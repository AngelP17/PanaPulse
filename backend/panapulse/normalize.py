"""No generated facts: normalize only explicit USGS data."""
from datetime import datetime, timezone
from hashlib import sha256
import json
import math
import re
from urllib.parse import urlsplit


VALID_ID = re.compile(r"^[A-Za-z0-9_-]{1,80}$")


class InvalidUSGSEvent(ValueError):
    pass


def ms_utc(value: int | float) -> datetime:
    return datetime.fromtimestamp(value / 1000, tz=timezone.utc)


def utc_iso(value: datetime | None) -> str | None:
    return value.astimezone(timezone.utc).isoformat() if value else None


def allowed_usgs_url(value: str | None) -> str | None:
    """Only trust data-product URLs hosted at the exact USGS quake domain."""
    if not value:
        return None
    try:
        parsed = urlsplit(value)
        if parsed.scheme == "https" and parsed.hostname == "earthquake.usgs.gov" and not parsed.username and not parsed.password and parsed.port in (None, 443):
            return value
    except ValueError:
        pass
    return None


def normalize_feature(feature: dict, details: dict | None = None) -> dict:
    event_id = str(feature.get("id", ""))
    if not VALID_ID.fullmatch(event_id):
        raise InvalidUSGSEvent("Bad or missing USGS event ID")
    try:
        p = feature["properties"]
        coords = feature["geometry"]["coordinates"]
        lon, lat = float(coords[0]), float(coords[1])
        depth = None if len(coords) <= 2 or coords[2] is None else float(coords[2])
        time_ms = p["time"]
        updated_ms = p.get("updated") or time_ms
        time = ms_utc(time_ms)
        updated = ms_utc(updated_ms)
        mag = None if p.get("mag") is None else float(p["mag"])
    except (KeyError, IndexError, TypeError, ValueError, OverflowError) as e:
        raise InvalidUSGSEvent(f"Malformed {event_id} record: {e}") from e
    if not (math.isfinite(lat) and math.isfinite(lon) and (-90 <= lat <= 90) and (-180 <= lon <= 180)):

        raise InvalidUSGSEvent(f"Invalid coordinates in {event_id}")
    if (mag is not None and not math.isfinite(mag)) or (depth is not None and not math.isfinite(depth)):
        raise InvalidUSGSEvent(f"Invalid magnitude/depth in {event_id}")

    # The event listing may advertise an oaf product before detail is fetched.
    types = set(filter(None, (p.get("types") or "").split(",")))
    oaf_status = "listed" if "oaf" in types else "none"
    oaf_product_updated = None
    oaf_forecast = None
    if details is not None:
        # Only believe details if they describe the same event.
        if details.get("id") != event_id:
            raise InvalidUSGSEvent(f"Detail ID mismatch for {event_id}")
        oaf_products = (details.get("properties", {}).get("products", {}) or {}).get("oaf", [])
        active = [o for o in oaf_products if o.get("status", "UPDATE").upper() == "UPDATE"]
        if active:
            latest = max(active, key=lambda x: x.get("updateTime", 0))
            oaf_status = "confirmed"
            if latest.get("updateTime") is not None:
                oaf_product_updated = ms_utc(latest["updateTime"])
            contents = latest.get("contents") or {}
            forecast = next((obj.get("url") for path, obj in contents.items() if path.endswith("forecast.json") and isinstance(obj, dict)), None)
            oaf_forecast = allowed_usgs_url(forecast)
        elif "oaf" in types:
            oaf_status = "listed"  # explicit: not verified by an active product

    return {
        "id": event_id,
        "magnitude": mag,
        "place": p.get("place"),
        "event_time": utc_iso(time),
        "usgs_updated_at": utc_iso(updated),
        "latitude": lat,
        "longitude": lon,
        "depth_km": depth,
        "review_status": p.get("status"),
        "pager_alert": p.get("alert"),
        "tsunami_product_flag": bool(p.get("tsunami", 0)),
        "event_url": f"https://earthquake.usgs.gov/earthquakes/eventpage/{event_id}",
        "oaf_status": oaf_status,
        "oaf_product_updated_at": utc_iso(oaf_product_updated),
        "oaf_forecast_url": oaf_forecast,
    }


def hash_payload(payload: dict) -> str:
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return sha256(canonical.encode("utf-8")).hexdigest()


def parse_forecast(raw: dict) -> dict:
    """Keep only what USGS published: windows, bins, probabilities, count ranges. No derived values."""
    try:
        windows = []
        for w in raw["forecast"]:
            bins = []
            for b in w["bins"]:
                prob = float(b["probability"])
                if not (0.0 <= prob <= 1.0):
                    raise ValueError("probability out of range")
                bins.append({
                    "magnitude": float(b["magnitude"]),
                    "probability": prob,
                    "median": b.get("median"),
                    "p95min": b.get("p95minimum"),
                    "p95max": b.get("p95maximum"),
                })
            windows.append({"label": str(w["label"]), "time_start": int(w["timeStart"]),
                            "time_end": int(w["timeEnd"]), "bins": bins})
        creation = ms_utc(raw["creationTime"])
        nxt = ms_utc(raw["nextForecastTime"]) if raw.get("nextForecastTime") else None
    except (KeyError, TypeError, ValueError, OverflowError) as e:
        raise InvalidUSGSEvent(f"Malformed OAF forecast: {e}") from e
    if not windows:
        raise InvalidUSGSEvent("OAF forecast has no windows")
    return {"creation_time": creation, "next_forecast_time": nxt, "windows": windows}
