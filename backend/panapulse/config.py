"""Runtime defaults. Values are adjustable without code changes."""
from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    database_url: str = "sqlite:///./panapulse.db"  # local development only
    min_lat: float = 5.5
    max_lat: float = 11.5
    min_lon: float = -84.0
    max_lon: float = -76.0
    min_magnitude: float = 2.5
    lookback_days: int = 30  # USGS keeps revising big events and their aftershock forecasts for weeks
    user_agent: str = "PanaPulse-v0/0.1 (independent, not USGS-affiliated)"

    @classmethod
    def from_env(cls) -> "Settings":
        return cls(
            database_url=os.getenv("DATABASE_URL", cls.database_url),
            min_lat=float(os.getenv("PANAPULSE_MIN_LAT", cls.min_lat)),
            max_lat=float(os.getenv("PANAPULSE_MAX_LAT", cls.max_lat)),
            min_lon=float(os.getenv("PANAPULSE_MIN_LON", cls.min_lon)),
            max_lon=float(os.getenv("PANAPULSE_MAX_LON", cls.max_lon)),
            min_magnitude=float(os.getenv("PANAPULSE_MIN_MAGNITUDE", cls.min_magnitude)),
            lookback_days=int(os.getenv("PANAPULSE_LOOKBACK_DAYS", cls.lookback_days)),
        )
