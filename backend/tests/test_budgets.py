from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone

import pytest

from panapulse.budgets import AskBudgetBucket, DurableRateLimiter
from panapulse.models import Base, make_session_factory


@pytest.fixture
def sessions(tmp_path, monkeypatch):
    monkeypatch.setenv('PANAPULSE_ASK_HASH_KEY', 'test-only-ask-hash-key-' * 3)
    engine, factory = make_session_factory(f'sqlite:///{tmp_path / "budgets.db"}')
    Base.metadata.create_all(engine)
    yield factory
    engine.dispose()


def test_durable_budget_survives_restart_and_hides_client_address(sessions):
    now = datetime(2026, 10, 21, 12, 30, tzinfo=timezone.utc).timestamp()
    first = DurableRateLimiter(sessions, 1, 2, 3)
    assert first.allow('192.0.2.1', now) == (True, 'ok')
    restarted = DurableRateLimiter(sessions, 1, 2, 3)
    assert restarted.allow('192.0.2.1', now) == (False, 'client_minute')
    assert restarted.allow('192.0.2.1', now + 61) == (True, 'ok')
    assert restarted.allow('192.0.2.1', now + 122) == (False, 'client_daily')
    assert restarted.allow('192.0.2.2', now + 122) == (True, 'ok')
    assert restarted.allow('192.0.2.3', now + 122) == (False, 'daily_budget')
    with sessions() as s:
        assert all('192.0.2.' not in row.id for row in s.query(AskBudgetBucket))
    # UTC windows roll over normally; earlier rows are pruned rather than growing forever.
    assert restarted.allow('192.0.2.1', now + 86400) == (True, 'ok')
    with sessions() as s:
        assert s.query(AskBudgetBucket).count() == 3


def test_concurrent_reservations_do_not_exceed_global_budget(sessions):
    now = datetime(2026, 10, 21, 12, 30, tzinfo=timezone.utc).timestamp()
    limiter = DurableRateLimiter(sessions, 20, 20, 3)
    with ThreadPoolExecutor(max_workers=8) as pool:
        answers = list(pool.map(lambda i: limiter.allow(f'client-{i}', now), range(12)))
    assert sum(allowed for allowed, _ in answers) == 3
    assert {reason for allowed, reason in answers if not allowed} == {'daily_budget'}


def test_missing_hash_key_and_recovery_guard_fail_closed(sessions, monkeypatch):
    now = datetime(2026, 10, 21, 12, 30, tzinfo=timezone.utc)
    limiter = DurableRateLimiter(sessions, 6, 60, 100)
    with sessions.begin() as s:
        s.add(AskBudgetBucket(id='recovery', count=0, expires_at=now + timedelta(hours=1)))
    assert limiter.allow('client', now.timestamp()) == (False, 'chat_budget_recovery')
    assert limiter.allow('client', (now + timedelta(hours=1)).timestamp()) == (True, 'ok')
    monkeypatch.delenv('PANAPULSE_ASK_HASH_KEY', raising=False)
    monkeypatch.delenv('PANAPULSE_REPORT_HASH_KEY', raising=False)
    assert limiter.allow('client') == (False, 'chat_budget_not_configured')


def test_api_default_budget_survives_application_restart(sessions, monkeypatch):
    from fastapi.testclient import TestClient
    from panapulse.api import create_app
    from panapulse.ask import AskResult
    monkeypatch.setenv('PANAPULSE_ASK_GLOBAL_PER_DAY', '1')
    calls = []
    class SourceOnlyTestAsker:
        def ask(self, messages, lang, zone):
            calls.append(messages)
            return AskResult('Test provider result', [], 'test-only-no-paid-provider', 0, 0)
    payload = {'messages': [{'role': 'user', 'content': 'USGS?'}]}
    with TestClient(create_app(sessions, asker=SourceOnlyTestAsker())) as client:
        assert client.post('/v0/ask', json=payload).status_code == 200
    with TestClient(create_app(sessions, asker=SourceOnlyTestAsker())) as restarted:
        denied = restarted.post('/v0/ask', json=payload)
        assert denied.status_code == 429 and denied.json()['detail'] == 'daily_budget'
    assert len(calls) == 1


def test_housekeeping_removes_expired_budgets_without_more_model_calls(sessions):
    from panapulse.reports import purge
    now = datetime(2026, 10, 21, 12, 30, tzinfo=timezone.utc)
    limiter = DurableRateLimiter(sessions, 6, 60, 100)
    assert limiter.allow('client', now.timestamp()) == (True, 'ok')
    purge(sessions, now + timedelta(days=2))
    with sessions() as s:
        assert s.query(AskBudgetBucket).count() == 0
