"""Closed-beta anonymous observations. No free text, GPS, names, or public device IDs.

One API process for this beta: the lock serializes limits/dedupe on SQLite. Limits
are persisted, so restarts don't reset them. Scale-out requires a DB lock strategy.
"""
from datetime import datetime, timedelta, timezone
from hashlib import sha256
import hmac
import os
import re
import threading
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel, ConfigDict, field_validator
from sqlalchemy import DateTime, Integer, String, UniqueConstraint, delete, select
from sqlalchemy.orm import Mapped, mapped_column

from .models import Base, utcnow

AREAS = {"Ancón", "Bella Vista", "Betania", "Calidonia", "Curundú", "El Chorrillo", "Juan Díaz",
         "Parque Lefevre", "Pueblo Nuevo", "Río Abajo", "San Felipe", "San Francisco", "Santa Ana",
         "Tocumen", "Pedregal", "Las Cumbres", "Chilibre", "Pacora", "San Martín", "24 de Diciembre"}


class CommunityReport(Base):
    __tablename__ = "community_reports"
    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    owner_hash: Mapped[str] = mapped_column(String(64), index=True)
    request_id: Mapped[str] = mapped_column(String(36))
    service: Mapped[str] = mapped_column(String(20))
    area: Mapped[str] = mapped_column(String(60), index=True)
    observation: Mapped[str] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    __table_args__ = (UniqueConstraint("owner_hash", "request_id"),)


class ReportRateBucket(Base):
    __tablename__ = "report_rate_buckets"
    id: Mapped[str] = mapped_column(String(160), primary_key=True)
    count: Mapped[int] = mapped_column(Integer, default=0)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)


class ReportAudit(Base):
    __tablename__ = "report_audit"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    report_id: Mapped[str] = mapped_column(String(64))
    action: Mapped[str] = mapped_column(String(30))
    at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Submission(BaseModel):
    model_config = ConfigDict(extra="forbid")
    request_id: UUID
    area: str
    service: Literal["electricity", "water"]
    observation: Literal["interruption", "restored"]

    @field_validator("area")
    @classmethod
    def area_known(cls, v):
        if v not in AREAS:
            raise ValueError("unsupported_area")
        return v


def aware(dt):
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def receipt(row, now):
    return {"id": row.id, "request_id": row.request_id, "area": row.area, "service": row.service,
            "observation": row.observation, "created_at": aware(row.created_at).isoformat(),
            "expires_at": aware(row.expires_at).isoformat(),
            "status": "expired" if row.status == "active" and aware(row.expires_at) <= now else row.status,
            "verification": "community_unverified"}


def router(sessions, clock=utcnow):
    r = APIRouter(prefix="/v0/community")
    lock = threading.Lock()

    def owner(token):
        if os.getenv("PANAPULSE_REPORTS_ENABLED") != "1":
            raise HTTPException(503, "reports_disabled")
        if not token or not re.fullmatch(r"[a-f0-9]{64}", token):
            raise HTTPException(401, "installation_token_required")
        return sha256(token.encode()).hexdigest()

    @r.post("/reports", status_code=201)
    def submit(body: Submission, request: Request, x_installation_token: str | None = Header(None)):
        identity = owner(x_installation_token)
        secret = os.getenv("PANAPULSE_REPORT_HASH_KEY", "")
        if len(secret) < 32:
            raise HTTPException(503, "reports_not_configured")
        now = clock()
        rid = sha256(f"{identity}:{body.request_id}".encode()).hexdigest()
        ip = request.client.host if request.client else "unknown"
        ip_hash = hmac.new(secret.encode(), ip.encode(), "sha256").hexdigest()
        with lock, sessions.begin() as s:
            previous = s.get(CommunityReport, rid)
            if previous:
                if (previous.area, previous.service, previous.observation) != (body.area, body.service, body.observation):
                    raise HTTPException(409, "idempotency_conflict")
                return receipt(previous, now)
            # A delayed network retry must not recreate a report the user withdrew.
            # Retain only the opaque receipt hash, with the same seven-day audit TTL.
            if s.scalar(select(ReportAudit.id).where(ReportAudit.report_id == rid,
                                                    ReportAudit.action == "withdrawn").limit(1)):
                raise HTTPException(410, "report_withdrawn")
            # Fixed windows, token and IP plus global budget, all surviving process restarts.
            checks = [("device", identity, 3600, 6), ("ip", ip_hash, 3600, 30),
                      ("global", "all", 86400, 2000)]
            for kind, subject, seconds, limit in checks:
                window = int(now.timestamp()) // seconds
                bid = f"{kind}:{subject}:{window}"
                bucket = s.get(ReportRateBucket, bid)
                if bucket and bucket.count >= limit:
                    raise HTTPException(429, "report_rate_limited", headers={"Retry-After": str(seconds)})
                if bucket is None:
                    bucket = ReportRateBucket(id=bid, count=0, expires_at=now + timedelta(seconds=seconds * 2))
                    s.add(bucket)
                bucket.count += 1
            # One active observation per installation/service/area. Restoration replaces interruption.
            for old in s.scalars(select(CommunityReport).where(
                    CommunityReport.owner_hash == identity, CommunityReport.area == body.area,
                    CommunityReport.service == body.service, CommunityReport.status == "active")):
                old.status = "superseded"
            row = CommunityReport(id=rid, owner_hash=identity, request_id=str(body.request_id), area=body.area,
                service=body.service, observation=body.observation, created_at=now,
                expires_at=now + timedelta(hours=2), status="active")
            s.add(row)
            s.add(ReportAudit(report_id=rid, action="submitted", at=now))
            s.flush()
            return receipt(row, now)

    @r.get("/mine")
    def mine(x_installation_token: str | None = Header(None)):
        identity = owner(x_installation_token)
        now = clock()
        with sessions() as s:
            rows = s.scalars(select(CommunityReport).where(CommunityReport.owner_hash == identity,
                CommunityReport.created_at >= now - timedelta(days=7))
                .order_by(CommunityReport.created_at.desc()).limit(100)).all()
            return {"items": [receipt(row, now) for row in rows]}

    @r.delete("/reports/{report_id}")
    def withdraw(report_id: str, x_installation_token: str | None = Header(None)):
        identity = owner(x_installation_token)
        with lock, sessions.begin() as s:
            row = s.get(CommunityReport, report_id)
            if row is None:
                return {"deleted": True}  # retry after a lost response is safe
            if not hmac.compare_digest(row.owner_hash, identity):
                raise HTTPException(404, "report_not_found")
            s.delete(row)
            s.add(ReportAudit(report_id=report_id, action="withdrawn", at=clock()))
        return {"deleted": True}

    @r.get("/summary")
    def summary(area: str):
        if os.getenv("PANAPULSE_REPORTS_ENABLED") != "1":
            raise HTTPException(503, "reports_disabled")
        if area not in AREAS:
            raise HTTPException(422, "unsupported_area")
        now = clock()
        with sessions() as s:
            rows = s.scalars(select(CommunityReport).where(CommunityReport.area == area,
                CommunityReport.status == "active", CommunityReport.expires_at > now)).all()
        groups = []
        for service in ("electricity", "water"):
            for observation in ("interruption", "restored"):
                count = len({x.owner_hash for x in rows if x.service == service and x.observation == observation})
                groups.append({"service": service, "observation": observation,
                    "state": "none" if count == 0 else "insufficient_reports" if count < 3 else "reports_received",
                    "count": count if count >= 3 else None})
        return {"area": area, "as_of": now.isoformat(), "window_minutes": 120,
                "verification": "community_unverified", "service_state": "unknown", "groups": groups}
    return r


def purge(sessions, now=None):
    now = now or utcnow()
    with sessions.begin() as s:
        s.execute(delete(CommunityReport).where(CommunityReport.created_at < now - timedelta(days=7)))
        s.execute(delete(ReportRateBucket).where(ReportRateBucket.expires_at < now))
        s.execute(delete(ReportAudit).where(ReportAudit.at < now - timedelta(days=7)))


def hide(sessions, report_id):
    with sessions.begin() as s:
        row = s.get(CommunityReport, report_id)
        if row is None:
            raise ValueError("report_not_found")
        row.status = "hidden"
        s.add(ReportAudit(report_id=report_id, action="moderator_hidden"))
