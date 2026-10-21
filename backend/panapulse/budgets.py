"""Durable bounded model request budgets for one API worker.

Fixed UTC windows intentionally reserve budget before contacting the provider.
Failed provider calls still count; restarts never reset a spending allowance.
"""
from datetime import datetime, timezone
import hmac
import os
import threading

from sqlalchemy import DateTime, Integer, String, delete
from sqlalchemy.orm import Mapped, mapped_column

from .models import Base


class AskBudgetBucket(Base):
    __tablename__ = 'ask_budget_buckets'
    id: Mapped[str] = mapped_column(String(160), primary_key=True)
    count: Mapped[int] = mapped_column(Integer, default=0)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)


class DurableRateLimiter:
    def __init__(self, sessions, per_minute, per_day, global_per_day):
        self.sessions = sessions
        self.per_minute = per_minute
        self.per_day = per_day
        self.global_per_day = global_per_day
        self.lock = threading.Lock()

    @staticmethod
    def secret():
        return os.getenv('PANAPULSE_ASK_HASH_KEY') or os.getenv('PANAPULSE_REPORT_HASH_KEY', '')

    def configured(self):
        return len(self.secret()) >= 32

    def allow(self, client, now=None):
        if not self.configured():
            return False, 'chat_budget_not_configured'
        now = datetime.fromtimestamp(now, timezone.utc) if now is not None else datetime.now(timezone.utc)
        identity = hmac.new(self.secret().encode(), client.encode(), 'sha256').hexdigest()
        checks = [('global', 'all', 86400, self.global_per_day, 'daily_budget'),
                  ('client', identity, 86400, self.per_day, 'client_daily'),
                  ('client', identity, 60, self.per_minute, 'client_minute')]
        with self.lock, self.sessions.begin() as s:
            # Restore deliberately loses private budget rows. Block paid requests through
            # the next UTC day boundary so recovery cannot grant a second daily allowance.
            guard = s.get(AskBudgetBucket, 'recovery')
            if guard:
                end = guard.expires_at if guard.expires_at.tzinfo else guard.expires_at.replace(tzinfo=timezone.utc)
                if end > now:
                    return False, 'chat_budget_recovery'
            s.execute(delete(AskBudgetBucket).where(AskBudgetBucket.expires_at <= now)
                      .execution_options(synchronize_session=False))
            reserve = []
            for kind, subject, seconds, limit, reason in checks:
                window = int(now.timestamp()) // seconds
                bid = f'{kind}:{subject}:{seconds}:{window}'
                bucket = s.get(AskBudgetBucket, bid)
                if limit <= 0 or (bucket and bucket.count >= limit):
                    return False, reason
                if bucket is None:
                    bucket = AskBudgetBucket(id=bid, count=0,
                        expires_at=datetime.fromtimestamp((window + 1) * seconds, timezone.utc))
                reserve.append(bucket)
            for bucket in reserve:
                bucket.count += 1
                s.add(bucket)
        return True, 'ok'
