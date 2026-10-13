"""Read-only FastAPI routes. Ingestion is intentionally never an HTTP endpoint."""
from datetime import datetime, timezone, timedelta
import os

from fastapi import FastAPI, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import sessionmaker, Session

from .config import Settings
from .ask import Asker, AskError, DataTools, RateLimiter
from .models import AftershockForecast, Base, Earthquake, EarthquakeRevision, SourceHealth, make_session_factory


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


def create_app(sessions: sessionmaker[Session], asker: Asker | None = None,
               limiter: RateLimiter | None = None) -> FastAPI:
    app = FastAPI(title="PanaPulse API (prototype)", version="0.2.0")
    tools = DataTools(sessions)
    limiter = limiter or RateLimiter(
        per_minute=int(os.getenv("PANAPULSE_ASK_PER_MINUTE", 6)),
        per_day=int(os.getenv("PANAPULSE_ASK_PER_DAY", 60)),
        global_per_day=int(os.getenv("PANAPULSE_ASK_GLOBAL_PER_DAY", 5000)),
    )
    origins = [o for o in os.getenv("PANAPULSE_CORS_ORIGINS", "").split(",") if o]
    if origins:  # only the web build needs CORS; native apps don't send Origin checks
        from fastapi.middleware.cors import CORSMiddleware
        app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["GET", "POST"], allow_headers=["Content-Type"])
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
            result = get_asker().ask(body.messages, body.lang)
        except AskError as e:
            raise HTTPException(400, e.code)
        return {"answer": result.answer, "model": result.model, "tools": result.tool_calls,
                "usage": {"input_tokens": result.input_tokens, "output_tokens": result.output_tokens}}

    @app.get("/v0/forecast")
    def forecast():
        return tools.aftershock_forecast({})

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
            is_fresh = last is not None and datetime.now(timezone.utc) - last < timedelta(minutes=30)
            return {"source": "USGS", "freshness": "current" if is_fresh else "stale_or_unavailable",
                    "last_success_at": as_utc(last),
                    "last_attempt_at": as_utc(health.last_attempt_at) if health else None,
                    "last_error": health.last_error if health else None,
                    "last_event_count": health.last_event_count if health else None,
                    "note": "Data freshness does not mean the absence of nearby earthquakes."}

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
