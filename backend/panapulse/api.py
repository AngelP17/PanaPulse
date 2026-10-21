"""Read-only source APIs and bounded community submissions. No HTTP ingestion endpoint."""
from datetime import datetime, timezone, timedelta
import os

from fastapi import FastAPI, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import sessionmaker, Session

from .config import Settings
from .ask import Asker, AskError, DataTools, RateLimiter
from .models import AftershockForecast, Base, Earthquake, EarthquakeRevision, SourceHealth, UtilityNotice, make_session_factory
from .utilities import ENSA_URL, NATURGY_URL, key, corregimiento_key, provider_for
from .reports import CommunityReport, ReportAudit, ReportRateBucket, router as report_router
from .request_limits import RequestBodyLimit


def as_utc(value: datetime | None) -> str | None:
    if value is None:
        return None
    if value.tzinfo is None:  # SQLite loses tzinfo: treat UTC storage as UTC
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat()


def event_dict(event: Earthquake) -> dict:
    return {
        "id": event.id,
        "magnitude": event.magnitude,
        "place": event.place,
        "event_time": as_utc(event.event_time),
        "usgs_updated_at": as_utc(event.usgs_updated_at),
        "latitude": event.latitude,
        "longitude": event.longitude,
        "depth_km": event.depth_km,
        "review_status": event.review_status,
        "pager_alert": event.pager_alert,
        "tsunami_product_flag": event.tsunami_product_flag,
        "tsunami_warning_active": None,  # deliberately UNKNOWN, consult SINAPROC
        "oaf_status": event.oaf_status,
        "oaf_product_updated_at": as_utc(event.oaf_product_updated_at),
        "oaf_forecast_url": event.oaf_forecast_url,
        "event_url": event.event_url,
        "revision_number": event.revision_number,
        "source": "USGS",
    }


class AskBody(BaseModel):
    messages: list[dict] = Field(..., max_length=20)
    lang: str = Field("es", pattern="^(es|en)$")
    zone: str | None = Field(None, max_length=60)


def create_app(sessions: sessionmaker[Session], asker: Asker | None = None,
               limiter: RateLimiter | None = None) -> FastAPI:
    app = FastAPI(title="PanaPulse API", version="0.3.0")
    app.add_middleware(RequestBodyLimit)
    app.include_router(report_router(sessions))
    tools = DataTools(sessions)
    limiter = limiter or RateLimiter(
        per_minute=int(os.getenv("PANAPULSE_ASK_PER_MINUTE", 6)),
        per_day=int(os.getenv("PANAPULSE_ASK_PER_DAY", 60)),
        global_per_day=int(os.getenv("PANAPULSE_ASK_GLOBAL_PER_DAY", 5000)),
    )
    origins = [o for o in os.getenv("PANAPULSE_CORS_ORIGINS", "").split(",") if o]
    if origins:  # only the web build needs CORS; native apps don't send Origin checks
        from fastapi.middleware.cors import CORSMiddleware
        app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["GET", "POST", "DELETE"],
                           allow_headers=["Content-Type", "X-Installation-Token"])
    state = {"asker": asker}

    def get_asker() -> Asker:
        if state["asker"] is None:
            if not os.getenv("ANTHROPIC_API_KEY"):
                raise HTTPException(503, "chat_not_configured")
            state["asker"] = Asker(tools)
        return state["asker"]

    @app.post("/v0/ask")
    def ask(body: AskBody, request: Request):
        # Behind a proxy, set the real client IP via the proxy's trusted header instead.
        client = request.client.host if request.client else "unknown"
        ok, why = limiter.allow(client)
        if not ok:
            raise HTTPException(429, why)
        try:
            result = get_asker().ask(body.messages, body.lang, body.zone)
        except AskError as e:
            raise HTTPException(400, e.code)
        return {"answer": result.answer, "model": result.model, "tools": result.tool_calls,
                "usage": {"input_tokens": result.input_tokens, "output_tokens": result.output_tokens}}

    @app.get("/v0/forecast")
    def forecast():
        return tools.aftershock_forecast({})

    @app.get("/v0/capabilities")
    def capabilities():
        return {"chat": bool(os.getenv("ANTHROPIC_API_KEY")) or state["asker"] is not None,
                "reports": os.getenv("PANAPULSE_REPORTS_ENABLED") == "1"
                    and len(os.getenv("PANAPULSE_REPORT_HASH_KEY", "")) >= 32}

    @app.get("/healthz")
    def health():
        return {"status": "running"}  # liveness, not source freshness

    @app.get("/v0/source-health")
    def source_health():
        with sessions() as s:
            health = s.get(SourceHealth, "usgs")
            last = health.last_success_at if health else None
            if last is not None and last.tzinfo is None:
                last = last.replace(tzinfo=timezone.utc)
            is_fresh = (last is not None and timedelta(0) <= datetime.now(timezone.utc) - last < timedelta(minutes=20)
                        and not health.last_error)
            return {"source": "USGS", "freshness": "current" if is_fresh else "stale_or_unavailable",
                    "last_success_at": as_utc(last),
                    "last_attempt_at": as_utc(health.last_attempt_at) if health else None,
                    "last_error": health.last_error if health else None,
                    "last_event_count": health.last_event_count if health else None,
                    "note": "Data freshness does not mean the absence of nearby earthquakes."}

    @app.get("/readyz")
    def ready():
        # Readiness checks the database, not provider availability or earthquake safety.
        try:
            with sessions() as s:
                for model in (SourceHealth, Earthquake, AftershockForecast, UtilityNotice,
                              CommunityReport, ReportRateBucket, ReportAudit):
                    s.execute(select(model).limit(1))
        except Exception:
            raise HTTPException(503, "database_unavailable")
        return {"status": "ready"}

    @app.get("/v0/seismic")
    def seismic():
        """One consistent mobile contract, from the same persisted source used by Ask."""
        health = source_health()
        with sessions() as s:
            rows = s.scalars(select(Earthquake).where(
                Earthquake.magnitude >= 4.5,
                Earthquake.event_time >= datetime.now(timezone.utc) - timedelta(days=30),
            ).order_by(Earthquake.event_time.desc()).limit(200)).all()
            f = s.scalars(select(AftershockForecast).order_by(AftershockForecast.creation_time.desc())).first()
            epoch = lambda dt: int(datetime.fromisoformat(as_utc(dt)).timestamp() * 1000)
            return {
                "source": "USGS", "health": health,
                "earthquakes": [{"id": e.id, "mag": e.magnitude, "place": e.place or "",
                    "time": epoch(e.event_time), "lat": e.latitude, "lon": e.longitude,
                    "depthKm": e.depth_km, "status": e.review_status or "automatic", "alert": e.pager_alert}
                    for e in rows],
                "forecast": None if f is None else {
                    "creationTime": epoch(f.creation_time),
                    "nextForecastTime": epoch(f.next_forecast_time) if f.next_forecast_time else None,
                    "mainshockId": f.event_id, "url": f.url,
                    "windows": [{"label": w["label"], "timeStart": w["time_start"],
                                 "timeEnd": w["time_end"], "bins": w["bins"]} for w in f.windows]},
                "fetchedAt": int(datetime.fromisoformat(health["last_success_at"]).timestamp() * 1000)
                    if health["last_success_at"] else 0,
                "mode": "live" if health["freshness"] == "current" else "snapshot",
            }

    @app.get("/v0/power-maintenance")
    def power_maintenance(corregimiento: str = Query(..., min_length=2, max_length=100)):
        """Official scheduled work only; never confirms current electricity availability."""
        zone = corregimiento.strip()
        match = provider_for(zone)
        providers = ["ensa", "naturgy"] if match["provider"] == "border" else [match["provider"]]
        current = datetime.now(timezone.utc)
        sources, notices = [], []
        with sessions() as s:
            for provider in providers:
                h = s.get(SourceHealth, provider)
                success = h.last_success_at if h else None
                if success and success.tzinfo is None:
                    success = success.replace(tzinfo=timezone.utc)
                age = current - success if success else None
                freshness = "current" if age is not None and timedelta(0) <= age < timedelta(hours=36) and not h.last_error else "stale_or_unavailable"
                sources.append({
                    "provider": provider, "freshness": freshness,
                    "source_url": ENSA_URL if provider == "ensa" else NATURGY_URL,
                    "last_success_at": as_utc(success),
                    "last_attempt_at": as_utc(h.last_attempt_at) if h else None,
                    "last_error": h.last_error if h else None,
                })
                if success is None:
                    continue
                rows = s.scalars(select(UtilityNotice).where(
                    UtilityNotice.provider == ("ENSA" if provider == "ensa" else "Naturgy"),
                    UtilityNotice.ends_at >= current,
                    UtilityNotice.last_seen_at == h.last_success_at,
                ).order_by(UtilityNotice.starts_at.asc()).limit(500)).all()
                for row in rows:
                    if corregimiento_key(row.corregimiento) != corregimiento_key(zone) or key(row.district or "") != "panama":
                        continue
                    notices.append({
                        "id": row.id, "provider": row.provider, "place": row.place,
                        "start": as_utc(row.starts_at), "end": as_utc(row.ends_at),
                        "task": row.task, "affected": row.affected,
                        "source_url": row.source_url, "verification": "official_scheduled",
                        "source_freshness": freshness,
                    })
        notices.sort(key=lambda n: n["start"])
        return {
            "corregimiento": zone, "coverage": match, "sources": sources,
            "notices": notices, "service_state": "unknown",
            "scope": "scheduled_maintenance_only",
            "note": "No scheduled notice does not imply service is normal.",
        }

    @app.get("/v0/earthquakes")
    def earthquakes(limit: int = Query(50, ge=1, le=200)):
        with sessions() as s:
            events = s.scalars(select(Earthquake).order_by(Earthquake.event_time.desc()).limit(limit)).all()
            return {"items": [event_dict(e) for e in events], "count": len(events), "source": "USGS"}

    @app.get("/v0/earthquakes/{event_id}")
    def earthquake(event_id: str):
        with sessions() as s:
            event = s.get(Earthquake, event_id)
            if not event:
                raise HTTPException(404, "Event not found")
            return event_dict(event)

    @app.get("/v0/earthquakes/{event_id}/revisions")
    def revisions(event_id: str):
        with sessions() as s:
            if s.get(Earthquake, event_id) is None:
                raise HTTPException(404, "Event not found")
            rows = s.scalars(select(EarthquakeRevision).where(EarthquakeRevision.event_id == event_id)
                             .order_by(EarthquakeRevision.revision_number.asc())).all()
            return {"event_id": event_id, "items": [
                {"revision_number": row.revision_number, "captured_at": as_utc(row.captured_at),
                 "source_updated_at": as_utc(row.source_updated_at), "data": row.normalized_payload}
                for row in rows]}
    return app


def default_app() -> FastAPI:
    settings = Settings.from_env()
    engine, sessions = make_session_factory(settings.database_url)
    return create_app(sessions)  # run init-db separately; use Alembic before production


app = default_app()
