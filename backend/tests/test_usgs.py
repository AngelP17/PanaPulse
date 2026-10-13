"""Offline regression tests against the Panama October 2026 event IDs."""
from copy import deepcopy
import json
from pathlib import Path

import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select

from panapulse.api import create_app
from panapulse.client import USGSClient
from panapulse.config import Settings
from panapulse.ingest import USGSIngestor
from panapulse.models import Base, Earthquake, EarthquakeRevision, SourceSnapshot, make_session_factory
from panapulse.normalize import InvalidUSGSEvent, allowed_usgs_url, normalize_feature

FIXTURE = Path(__file__).parent / "fixtures" / "panama_oct_2026.json"


@pytest.fixture
def feed():
    return json.loads(FIXTURE.read_text(encoding="utf-8"))


@pytest.fixture
def services(tmp_path):
    settings = Settings(database_url=f"sqlite:///{tmp_path / 'test.db'}")
    engine, sessions = make_session_factory(settings.database_url)
    Base.metadata.create_all(engine)
    with USGSClient(settings, transport=httpx.MockTransport(
        lambda request: httpx.Response(500, json={"mock": "unavailable"})
    )) as client:
        yield settings, sessions, USGSIngestor(sessions, settings, client)
    engine.dispose()


def test_fixture_matches_public_panama_earthquake(feed):
    events = {e["id"]: e for e in feed["features"]}
    assert set(events) == {"us6000u18k", "us6000u19w", "us6000u1cf"}
    main = normalize_feature(events["us6000u18k"])
    assert main["magnitude"] == 7.7
    assert main["pager_alert"] == "red"
    assert main["oaf_status"] == "listed"  # listing is NOT the forecast probability
    assert events["us6000u19w"]["properties"]["mag"] == 6.6
    assert events["us6000u1cf"]["properties"]["mag"] == 6.0


def test_idempotent_ingest_and_distinct_events(feed, services):
    _, sessions, ingestor = services
    first = ingestor.ingest(feed, retrieve_details=False)
    again = ingestor.ingest(feed, retrieve_details=False)
    assert (first.created, again.unchanged, again.created) == (3, 3, 0)
    with sessions() as s:
        assert s.scalar(select(func.count()).select_from(Earthquake)) == 3
        assert s.scalar(select(func.count()).select_from(EarthquakeRevision)) == 3
        assert s.scalar(select(func.count()).select_from(SourceSnapshot)) == 1
        assert s.get(Earthquake, "us6000u18k").oaf_status == "listed"


def test_magnitude_revision_and_older_snapshot_cannot_regress(feed, services):
    _, sessions, ingestor = services
    old = deepcopy(feed)
    old["features"][0]["properties"]["mag"] = 7.6
    old["features"][0]["properties"]["updated"] = 1791700000000
    ingestor.ingest(old, retrieve_details=False)
    changed = ingestor.ingest(feed, retrieve_details=False)
    assert changed.changed == 1
    back = ingestor.ingest(old, retrieve_details=False)
    assert back.stale_skipped == 1
    with sessions() as s:
        event = s.get(Earthquake, "us6000u18k")
        assert event.magnitude == 7.7
        assert event.revision_number == 2
        revisions = s.scalars(select(EarthquakeRevision).where(EarthquakeRevision.event_id == event.id)
                             .order_by(EarthquakeRevision.revision_number)).all()
        assert [r.normalized_payload["magnitude"] for r in revisions] == [7.6, 7.7]


def test_active_oaf_detail_confirmation(feed):
    main = feed["features"][0]
    detail = {
        "id": "us6000u18k",
        "properties": {"products": {"oaf": [{
            "status": "UPDATE", "source": "us", "updateTime": 1791800000000,
            "contents": {"forecast.json": {"url": "https://earthquake.usgs.gov/product/oaf/sample/forecast.json"}}
        }]}}
    }
    normalized = normalize_feature(main, details=detail)
    assert normalized["oaf_status"] == "confirmed"
    assert normalized["oaf_product_updated_at"]
    assert normalized["oaf_forecast_url"].endswith("forecast.json")
    assert "probability" not in normalized


def test_oaf_detail_fail_does_not_erase_earthquake(feed, services):
    _, sessions, ingestor = services
    stats = ingestor.ingest(feed, retrieve_details=True)
    assert stats.created == 3
    assert stats.detail_errors == 1
    with sessions() as s:
        assert s.get(Earthquake, "us6000u18k").oaf_status == "listed"


def test_bad_coords_and_mismatched_detail_rejected(feed):
    bad = deepcopy(feed["features"][0])
    bad["geometry"]["coordinates"] = [999, 999, 20]
    with pytest.raises(InvalidUSGSEvent):
        normalize_feature(bad)
    with pytest.raises(InvalidUSGSEvent):
        normalize_feature(feed["features"][0], details={"id": "other", "properties": {}})
    assert allowed_usgs_url("https://earthquake.usgs.gov.attacker.com/path") is None
    assert allowed_usgs_url("http://earthquake.usgs.gov/anything") is None


def test_api_lists_earthquakes_with_usgs_provenance_and_revisions(feed, services):
    _, sessions, ingestor = services
    ingestor.ingest(feed, retrieve_details=False)
    client = TestClient(create_app(sessions))
    response = client.get("/v0/earthquakes")
    assert response.status_code == 200
    assert len(response.json()["items"]) == 3
    detail = client.get("/v0/earthquakes/us6000u18k").json()
    assert detail["oaf_status"] == "listed"
    assert detail["source"] == "USGS"
    assert detail["tsunami_warning_active"] is None
    assert detail["revision_number"] == 1
    assert len(client.get("/v0/earthquakes/us6000u18k/revisions").json()["items"]) == 1
    assert client.get("/v0/earthquakes/not-real").status_code == 404


def test_http_client_restricted_domains_and_mock_feed(services):
    settings, _, _ = services
    seen = []

    def route(request: httpx.Request) -> httpx.Response:
        seen.append(str(request.url))
        return httpx.Response(200, json={"type": "FeatureCollection", "features": []})

    with USGSClient(settings, transport=httpx.MockTransport(route)) as client:
        data, url = client.query_recent()
        assert data["features"] == []
        assert "minlatitude=" in url and "minlongitude=" in url
        with pytest.raises(ValueError):
            client.get_json("https://bad-domain.example/anything")
        with pytest.raises(ValueError):
            client.event_detail("../secrets")
    assert len(seen) == 1


def test_source_health_when_fresh_and_when_unavailable(feed, services):
    _, sessions, ingestor = services
    client = TestClient(create_app(sessions))
    before = client.get("/v0/source-health").json()
    assert before["freshness"] == "stale_or_unavailable"
    ingestor.ingest(feed, retrieve_details=False)
    after = client.get("/v0/source-health").json()
    assert after["freshness"] == "current"
    assert after["last_event_count"] == 3
    assert after["last_success_at"] is not None


def _poll(feed, generated_ms, url_suffix):
    """Simulate a real poll: USGS regenerates metadata and the query URL carries new times."""
    polled = deepcopy(feed)
    polled.setdefault("metadata", {})["generated"] = generated_ms
    url = f"https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&endtime={url_suffix}"
    return polled, url


def test_repeated_polls_with_no_real_change_do_not_pile_up_snapshots(feed, services):
    _, sessions, ingestor = services
    for i in range(5):
        polled, url = _poll(feed, 1791800000000 + i * 300000, f"2026-10-12T1{i}:00:00")
        ingestor.ingest(polled, source_url=url, retrieve_details=False)
    with sessions() as s:
        assert s.scalar(select(func.count()).select_from(SourceSnapshot)) == 1


def test_usgs_updated_bump_without_material_change_is_not_a_revision(feed, services):
    _, sessions, ingestor = services
    ingestor.ingest(feed, retrieve_details=False)
    bumped = deepcopy(feed)
    for f in bumped["features"]:
        if f["id"] == "us6000u18k":
            f["properties"]["updated"] += 60_000  # e.g. a DYFI refresh, magnitude unchanged
    result = ingestor.ingest(bumped, retrieve_details=False)
    assert result.changed == 0
    with sessions() as s:
        assert s.scalar(select(func.count()).select_from(EarthquakeRevision)
                        .where(EarthquakeRevision.event_id == "us6000u18k")) == 1
        # but the current row still tracks the newest USGS timestamp, so staleness checks stay correct
        stored = s.get(Earthquake, "us6000u18k").usgs_updated_at
        assert int(stored.replace(tzinfo=stored.tzinfo or __import__("datetime").timezone.utc).timestamp() * 1000) \
            == next(f for f in bumped["features"] if f["id"] == "us6000u18k")["properties"]["updated"]
