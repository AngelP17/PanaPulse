"""Transactional, idempotent current-state upserts with append-only revisions."""
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from hashlib import sha256
import gzip
import json
import logging

from sqlalchemy.orm import Session, sessionmaker

from .client import USGSClient
from .config import Settings
from .models import AftershockForecast, Earthquake, EarthquakeRevision, SourceHealth, SourceSnapshot, utcnow
from .normalize import InvalidUSGSEvent, hash_payload, normalize_feature, parse_forecast

logger = logging.getLogger(__name__)


@dataclass
class IngestResult:
    fetched: int = 0
    created: int = 0
    changed: int = 0
    unchanged: int = 0
    stale_skipped: int = 0
    invalid: int = 0
    oaf_confirmed: int = 0
    detail_errors: int = 0
    warnings: list[str] | None = None

    def as_dict(self) -> dict:
        return asdict(self)


class USGSIngestor:
    def __init__(self, sessions: sessionmaker[Session], settings: Settings, client: USGSClient):
        self.sessions = sessions
        self.settings = settings
        self.client = client

    def _store_snapshot(self, session: Session, payload: dict, url: str) -> None:
        raw = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
        # Store only changed source payloads, not repeated polling responses. Every poll has a new
        # metadata.generated timestamp and a query URL with new start/end times, so dedupe on the
        # content (everything except metadata) and on the endpoint without its query string.
        content = {k: v for k, v in payload.items() if k != "metadata"}
        digest = sha256(json.dumps(content, ensure_ascii=False, sort_keys=True,
                                   separators=(",", ":")).encode("utf-8")).hexdigest()
        endpoint = url.split("?", 1)[0]
        last = (session.query(SourceSnapshot)
                .filter((SourceSnapshot.url == endpoint) | SourceSnapshot.url.startswith(endpoint + "?"))
                .order_by(SourceSnapshot.id.desc()).first())
        if last is None or last.sha256 != digest:
            session.add(SourceSnapshot(url=url, sha256=digest, compressed_json=gzip.compress(raw)))

    def _store_forecast(self, session: Session, item: dict, stats: "IngestResult", retrieve: bool) -> None:
        url = item.get("oaf_forecast_url")
        if not url or not retrieve:
            return
        if session.query(AftershockForecast.id).filter_by(url=url).first():
            return
        try:
            raw, _ = self.client.get_json(url)
            self._store_snapshot(session, raw, url)
            parsed = parse_forecast(raw)
            session.flush()  # the parent earthquake row must exist before the FK row
            session.add(AftershockForecast(event_id=item["id"], url=url, **parsed))
        except Exception as e:  # a forecast failure never drops the earthquake itself
            stats.detail_errors += 1
            stats.warnings.append(f"{item['id']} forecast failed: {type(e).__name__}")
            logger.warning("OAF forecast unavailable for %s: %s", item["id"], e)

    def ingest(self, feed: dict | None = None, source_url: str | None = None,
               retrieve_details: bool = True, mark_source_healthy: bool = True) -> IngestResult:
        """When feed is supplied, runs fully offline for testing/replay."""
        if feed is None:
            feed, source_url = self.client.query_recent()
        source_url = source_url or "https://earthquake.usgs.gov/fdsnws/event/1/query"
        if feed.get("type") != "FeatureCollection" or not isinstance(feed.get("features"), list):
            raise ValueError("Invalid USGS FeatureCollection")

        stats = IngestResult(fetched=len(feed["features"]), warnings=[])
        with self.sessions.begin() as session:
            self._store_snapshot(session, feed, source_url)
            for feature in feed["features"]:
                try:
                    item = normalize_feature(feature)
                except InvalidUSGSEvent as e:
                    stats.invalid += 1
                    stats.warnings.append(str(e))
                    logger.warning("Rejected malformed USGS feature: %s", e)
                    continue

                if not (self.settings.min_lat <= item["latitude"] <= self.settings.max_lat
                        and self.settings.min_lon <= item["longitude"] <= self.settings.max_lon):
                    continue

                current = session.get(Earthquake, item["id"])
                # Older snapshots must never roll a live record backward.
                if current is not None:
                    old_updated = current.usgs_updated_at
                    if old_updated.tzinfo is None:
                        old_updated = old_updated.replace(tzinfo=timezone.utc)
                    new_updated = datetime.fromisoformat(item["usgs_updated_at"])
                    if new_updated < old_updated:
                        stats.stale_skipped += 1
                        continue
                # Fetch detail only for OAF candidates, and skip when known fresh.
                has_oaf = item["oaf_status"] == "listed"
                needs_detail = has_oaf and retrieve_details and (
                    current is None or current.oaf_status != "confirmed"
                    or old_updated != datetime.fromisoformat(item["usgs_updated_at"])
                )
                if needs_detail:
                    try:
                        details, detail_url = self.client.event_detail(item["id"])
                        self._store_snapshot(session, details, detail_url)
                        item = normalize_feature(feature, details=details)
                    except Exception as e:
                        # A transient detail failure must not erase a valid main event.
                        stats.detail_errors += 1
                        stats.warnings.append(f"{item['id']} detail failed: {type(e).__name__}")
                        logger.warning("USGS detail unavailable for %s: %s", item["id"], e)

                # Do not downgrade a verified forecast merely because a detail fetch failed.
                if current is not None and current.oaf_status == "confirmed" and item["oaf_status"] == "listed":
                    item["oaf_status"] = "confirmed"
                    item["oaf_product_updated_at"] = current.oaf_product_updated_at.isoformat() if current.oaf_product_updated_at else None
                    item["oaf_forecast_url"] = current.oaf_forecast_url

                # USGS bumps "updated" for things like DYFI refreshes. That alone is not a revision:
                # hash only the material fields, but still advance usgs_updated_at on the live row.
                digest = hash_payload({k: v for k, v in item.items() if k != "usgs_updated_at"})
                if current is not None and current.current_hash == digest:
                    current.usgs_updated_at = datetime.fromisoformat(item["usgs_updated_at"])
                    stats.unchanged += 1
                    if item["oaf_status"] == "confirmed":
                        self._store_forecast(session, item, stats, retrieve_details)  # retries a failed fetch
                    continue

                revision_no = (current.revision_number + 1) if current is not None else 1
                if current is None:
                    current = Earthquake(id=item["id"], current_hash=digest, revision_number=revision_no,
                                         event_time=datetime.fromisoformat(item["event_time"]),
                                         usgs_updated_at=datetime.fromisoformat(item["usgs_updated_at"]),
                                         latitude=item["latitude"], longitude=item["longitude"],
                                         event_url=item["event_url"])
                    session.add(current)
                    stats.created += 1
                else:
                    stats.changed += 1

                for key in ("magnitude", "place", "latitude", "longitude", "depth_km",
                            "review_status", "pager_alert", "tsunami_product_flag", "event_url",
                            "oaf_status", "oaf_forecast_url"):
                    setattr(current, key, item[key])
                for key in ("event_time", "usgs_updated_at", "oaf_product_updated_at"):
                    setattr(current, key, datetime.fromisoformat(item[key]) if item[key] else None)
                current.current_hash = digest
                current.revision_number = revision_no
                current.local_updated_at = utcnow()
                session.add(EarthquakeRevision(
                    event_id=item["id"], revision_number=revision_no, source_updated_at=current.usgs_updated_at,
                    sha256=digest, normalized_payload=item,
                ))
                if item["oaf_status"] == "confirmed":
                    stats.oaf_confirmed += 1
                    self._store_forecast(session, item, stats, retrieve_details)
            if mark_source_healthy:
                health = session.get(SourceHealth, "usgs")
                if health is None:
                    health = SourceHealth(source="usgs")
                    session.add(health)
                health.last_attempt_at = utcnow()
                # HTTP 200 with rejected records is not a healthy complete catalog.
                if not stats.invalid:
                    health.last_success_at = utcnow()
                health.last_error = f"invalid_records:{stats.invalid}" if stats.invalid else None
                health.last_event_count = len(feed["features"])
        return stats


def mark_source_failure(sessions: sessionmaker[Session], error: Exception) -> None:
    """Persist failed scheduled fetches without deleting the last known-good data."""
    with sessions.begin() as session:
        health = session.get(SourceHealth, "usgs")
        if health is None:
            health = SourceHealth(source="usgs")
            session.add(health)
        health.last_attempt_at = utcnow()
        health.last_error = (f"{type(error).__name__}: {error}")[:500]
