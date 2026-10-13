"""Small storage model: snapshots, current records, immutable revisions."""
from datetime import datetime, timezone
from sqlalchemy import (
    DateTime, Float, ForeignKey, Integer, JSON, LargeBinary, String,
    UniqueConstraint, create_engine,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class SourceSnapshot(Base):
    __tablename__ = "source_snapshots"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    url: Mapped[str] = mapped_column(String(700), nullable=False)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    compressed_json: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    # For debugging/replay. Restricted database access required.


class Earthquake(Base):
    __tablename__ = "earthquakes"
    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    magnitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    place: Mapped[str | None] = mapped_column(String(500), nullable=True)
    event_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    usgs_updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    depth_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    review_status: Mapped[str | None] = mapped_column(String(80), nullable=True)
    pager_alert: Mapped[str | None] = mapped_column(String(30), nullable=True)
    # USGS "tsunami" property is a product flag, NOT an active warning.
    tsunami_product_flag: Mapped[bool] = mapped_column(default=False)
    event_url: Mapped[str] = mapped_column(String(700), nullable=False)
    oaf_status: Mapped[str] = mapped_column(String(30), default="none")
    oaf_product_updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    oaf_forecast_url: Mapped[str | None] = mapped_column(String(700), nullable=True)
    current_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    revision_number: Mapped[int] = mapped_column(Integer, nullable=False)
    local_updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)




class SourceHealth(Base):
    __tablename__ = "source_health"
    source: Mapped[str] = mapped_column(String(50), primary_key=True)
    last_attempt_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_success_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error: Mapped[str | None] = mapped_column(String(500), nullable=True)
    last_event_count: Mapped[int | None] = mapped_column(Integer, nullable=True)


class EarthquakeRevision(Base):
    __tablename__ = "earthquake_revisions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[str] = mapped_column(ForeignKey("earthquakes.id"), nullable=False, index=True)
    revision_number: Mapped[int] = mapped_column(Integer, nullable=False)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    source_updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    normalized_payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    __table_args__ = (UniqueConstraint("event_id", "revision_number"),)


class AftershockForecast(Base):
    """Published USGS OAF forecast, stored verbatim-normalized. One row per forecast product URL."""
    __tablename__ = "aftershock_forecasts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_id: Mapped[str] = mapped_column(ForeignKey("earthquakes.id"), nullable=False, index=True)
    url: Mapped[str] = mapped_column(String(700), nullable=False, unique=True)
    creation_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    next_forecast_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    windows: Mapped[list] = mapped_column(JSON, nullable=False)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


def make_session_factory(database_url: str):
    kwargs = {"pool_pre_ping": True}
    if database_url.startswith("sqlite"):
        kwargs["connect_args"] = {"check_same_thread": False}
    engine = create_engine(database_url, **kwargs)
    return engine, sessionmaker(engine, expire_on_commit=False)
