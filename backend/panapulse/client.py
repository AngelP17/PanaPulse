"""Limited, explicit USGS HTTP client. No scraping, no untrusted domains."""
from datetime import datetime, timedelta, timezone
import logging
import time

import httpx

from .config import Settings
from .normalize import allowed_usgs_url, VALID_ID

logger = logging.getLogger(__name__)
QUERY_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query"


class USGSClient:
    def __init__(self, settings: Settings, transport: httpx.BaseTransport | None = None):
        self.settings = settings
        self.http = httpx.Client(
            timeout=httpx.Timeout(20),
            headers={"User-Agent": settings.user_agent, "Accept": "application/geo+json, application/json"},
            transport=transport,
            follow_redirects=False,
        )

    def close(self) -> None:
        self.http.close()

    def __enter__(self):
        return self

    def __exit__(self, *_):
        self.close()

    def get_json(self, url: str, params: dict | None = None) -> tuple[dict, str]:
        if allowed_usgs_url(url) is None:
            raise ValueError("Refusing non-USGS URL")
        for attempt in range(3):
            try:
                response = self.http.get(url, params=params)
                if response.status_code in (429, 500, 502, 503, 504) and attempt < 2:
                    time.sleep(min(2**attempt, 4))
                    continue
                if response.status_code == 204:
                    return {"type": "FeatureCollection", "features": []}, str(response.url)
                response.raise_for_status()
                data = response.json()
                if not isinstance(data, dict):
                    raise ValueError("USGS JSON response must be an object")
                return data, str(response.url)
            except (httpx.TransportError, httpx.TimeoutException):
                if attempt == 2:
                    raise
                time.sleep(min(2**attempt, 4))
        raise RuntimeError("Unreachable retry path")

    def query_recent(self, now: datetime | None = None) -> tuple[dict, str]:
        now = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
        start = now - timedelta(days=self.settings.lookback_days)
        params = {
            "format": "geojson",
            "starttime": start.strftime("%Y-%m-%dT%H:%M:%S"),
            "endtime": now.strftime("%Y-%m-%dT%H:%M:%S"),
            "minlatitude": self.settings.min_lat,
            "maxlatitude": self.settings.max_lat,
            "minlongitude": self.settings.min_lon,
            "maxlongitude": self.settings.max_lon,
            "minmagnitude": self.settings.min_magnitude,
            "orderby": "time",
        }
        return self.get_json(QUERY_URL, params=params)

    def event_detail(self, event_id: str) -> tuple[dict, str]:
        if not VALID_ID.fullmatch(event_id):
            raise ValueError("Invalid event ID")
        return self.get_json(f"https://earthquake.usgs.gov/earthquakes/feed/v1.0/detail/{event_id}.geojson")
