from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi.testclient import TestClient
import pytest

from panapulse.api import create_app
from panapulse.models import Base, SourceHealth, make_session_factory
from panapulse.reports import CommunityReport, hide, purge
from panapulse.utilities import _clock, SourceFormatChanged


@pytest.fixture
def setup(tmp_path, monkeypatch):
    monkeypatch.setenv("PANAPULSE_REPORTS_ENABLED", "1")
    monkeypatch.setenv("PANAPULSE_REPORT_HASH_KEY", "test-only-hash-key-" * 3)
    engine, sessions = make_session_factory(f"sqlite:///{tmp_path / 'connected.db'}")
    Base.metadata.create_all(engine)
    with TestClient(create_app(sessions)) as client:
        yield client, sessions
    engine.dispose()


def body(client=None, **kw):
    return {"request_id": str(uuid4()), "service": "electricity", "area": "Pueblo Nuevo",
            "observation": "interruption",
            "epoch": client.get("/v0/community/config").json()["epoch"] if client else "0" * 32,
            "observed_at": datetime.now(timezone.utc).isoformat(), **kw}


def headers(n=1):
    return {"X-Installation-Token": f"{n:064x}"}


def test_submission_retry_and_ownership(setup):
    client, sessions = setup
    payload = body(client)
    a = client.post('/v0/community/reports', json=payload, headers=headers())
    assert a.status_code == 201
    assert client.post('/v0/community/reports', json=payload, headers=headers()).json() == a.json()
    assert client.post('/v0/community/reports', json={**payload, 'service': 'water'}, headers=headers()).status_code == 409
    assert len(client.get('/v0/community/mine', headers=headers()).json()['items']) == 1
    assert client.get('/v0/community/mine', headers=headers(2)).json()['items'] == []
    rid = a.json()['id']
    assert client.delete(f'/v0/community/reports/{rid}', headers=headers(2)).status_code == 404
    assert client.delete(f'/v0/community/reports/{rid}', headers=headers()).status_code == 200
    assert client.delete(f'/v0/community/reports/{rid}', headers=headers()).status_code == 200
    with sessions() as s:
        assert s.get(CommunityReport, rid) is None


def test_private_aggregation_expiry_restoration_and_moderation(setup):
    c, sessions = setup
    def summary():
        return c.get('/v0/community/summary?area=Pueblo%20Nuevo').json()['groups']
    assert summary()[0] == {'service': 'electricity', 'observation': 'interruption', 'state': 'none', 'count': None}
    ids = []
    for n in range(1, 4):
        ids.append(c.post('/v0/community/reports', json=body(c), headers=headers(n)).json()['id'])
        assert summary()[0]['count'] == (3 if n == 3 else None)
    c.post('/v0/community/reports', json=body(c, observation='restored'), headers=headers())
    assert summary()[0]['state'] == 'insufficient_reports'
    assert summary()[1]['state'] == 'insufficient_reports'
    hide(sessions, ids[1])
    with sessions.begin() as s:
        s.get(CommunityReport, ids[2]).expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
    assert summary()[0]['state'] == 'none'


def test_limits_persist_across_app_restart_and_input_minimization(setup):
    c, sessions = setup
    assert c.post('/v0/community/reports', json=body(c)).status_code == 401
    assert c.post('/v0/community/reports', json=body(c, note='phone: 12345678'), headers=headers()).status_code == 422
    assert c.post('/v0/community/reports', json=body(c, area='exact address'), headers=headers()).status_code == 422
    for _ in range(6):
        assert c.post('/v0/community/reports', json=body(c), headers=headers()).status_code == 201
    with TestClient(create_app(sessions)) as restarted:
        assert restarted.post('/v0/community/reports', json=body(c), headers=headers()).status_code == 429


def test_purge_and_disabled_report_gate(setup, monkeypatch):
    c, sessions = setup
    rid = c.post('/v0/community/reports', json=body(c), headers=headers()).json()['id']
    purge(sessions, datetime.now(timezone.utc) + timedelta(days=8))
    assert c.get('/v0/community/mine', headers=headers()).json()['items'] == []
    payload = body(c)
    monkeypatch.setenv('PANAPULSE_REPORTS_ENABLED', '0')
    assert c.post('/v0/community/reports', json=payload, headers=headers()).status_code == 503
    assert c.get('/v0/community/summary?area=Pueblo%20Nuevo').status_code == 503


def test_empty_and_failed_seismic_are_never_current(setup):
    c, sessions = setup
    assert c.get('/readyz').status_code == 200
    empty = c.get('/v0/seismic').json()
    assert empty['earthquakes'] == [] and empty['fetchedAt'] == 0 and empty['mode'] == 'snapshot'
    with sessions.begin() as s:
        s.add(SourceHealth(source='usgs', last_success_at=datetime.now(timezone.utc), last_error='timeout'))
    assert c.get('/v0/source-health').json()['freshness'] == 'stale_or_unavailable'
    assert c.get('/v0/seismic').json()['mode'] == 'snapshot'


def test_noon_midnight_and_invalid_clock():
    assert _clock('12:00 m.') == (12, 0)
    assert _clock('12:00 a.m.') == (0, 0)
    assert _clock('De 8:00 a.m.') == (8, 0)
    for value in ('13:00 p.m.', '8:99 a.m.', '8:45', '12:30 m.'):
        with pytest.raises(SourceFormatChanged):
            _clock(value)


def test_withdrawn_submission_cannot_be_resurrected_by_retry(setup):
    c, sessions = setup
    payload = body(c)
    rid = c.post('/v0/community/reports', json=payload, headers=headers()).json()['id']
    c.delete(f'/v0/community/reports/{rid}', headers=headers())
    assert c.post('/v0/community/reports', json=payload, headers=headers()).status_code == 410
    assert c.get('/v0/community/mine', headers=headers()).json()['items'] == []


def test_report_body_limit_before_validation(setup):
    c, _ = setup
    oversized = b'{"note":"' + b'x' * 3000 + b'"}'
    assert c.post('/v0/community/reports', content=oversized, headers=headers()).status_code == 413
    # An absent/underreported length cannot bypass the streamed-byte limit.
    assert c.post('/v0/community/reports', content=iter([oversized]),
                  headers={**headers(), 'Content-Length': '1'}).status_code == 413


def test_parallel_duplicate_reports_have_one_receipt(setup):
    from concurrent.futures import ThreadPoolExecutor
    c, sessions = setup
    payload = body(c)
    with ThreadPoolExecutor(max_workers=8) as executor:
        responses = list(executor.map(lambda _: c.post('/v0/community/reports', json=payload, headers=headers()), range(8)))
    assert {r.status_code for r in responses} == {201}
    assert len({r.json()['id'] for r in responses}) == 1
    assert len(c.get('/v0/community/mine', headers=headers()).json()['items']) == 1


def test_ip_budget_cannot_be_bypassed_by_new_installation(setup):
    c, _ = setup
    for n in range(1, 31):
        assert c.post('/v0/community/reports', json=body(c), headers=headers(n)).status_code == 201
    assert c.post('/v0/community/reports', json=body(c), headers=headers(31)).status_code == 429


def test_chat_catalog_includes_failed_source_freshness(setup):
    from panapulse.ask import DataTools
    _, sessions = setup
    with sessions.begin() as s:
        s.add(SourceHealth(source='usgs', last_success_at=datetime.now(timezone.utc), last_error='timeout'))
    result = DataTools(sessions).recent_earthquakes({})
    assert result['freshness'] == 'stale_or_unavailable'
    assert result['count'] == 0 and 'cannot confirm' in result['instruction']


def test_readiness_rejects_partially_migrated_database(setup):
    c, sessions = setup
    CommunityReport.__table__.drop(sessions.kw['bind'])
    assert c.get('/healthz').status_code == 200
    assert c.get('/readyz').status_code == 503


def test_observation_expiry_and_retry_after_retention(setup):
    from fastapi import FastAPI
    from panapulse.reports import router
    _, sessions = setup
    now = [datetime.now(timezone.utc)]
    app = FastAPI()
    app.include_router(router(sessions, clock=lambda: now[0]))
    with TestClient(app) as c:
        config = c.get('/v0/community/config').json()
        payload = body(c, observed_at=config['server_time'])
        accepted = c.post('/v0/community/reports', json=payload, headers=headers())
        assert accepted.status_code == 201
        changed = {**payload, 'observed_at': (now[0] - timedelta(minutes=1)).isoformat()}
        assert c.post('/v0/community/reports', json=changed, headers=headers()).status_code == 409
        now[0] += timedelta(hours=3)
        retry = c.post('/v0/community/reports', json=payload, headers=headers())
        assert retry.status_code == 201 and retry.json()['status'] == 'expired'
        fresh_id_old_observation = {**payload, 'request_id': str(uuid4())}
        stale = c.post('/v0/community/reports', json=fresh_id_old_observation, headers=headers())
        assert stale.status_code == 410 and stale.json()['detail'] == 'report_observation_expired'
        now[0] += timedelta(days=8)
        purge(sessions, now[0])
        assert c.post('/v0/community/reports', json=payload, headers=headers()).status_code == 410
        assert c.get('/v0/community/mine', headers=headers()).json()['items'] == []


def test_report_configuration_and_clock_bounds(setup):
    c, sessions = setup
    config = c.get('/v0/community/config').json()
    with TestClient(create_app(sessions)) as restarted:
        assert restarted.get('/v0/community/config').json()['epoch'] == config['epoch']
    assert config['max_submission_age_seconds'] == 7200
    payload = body(c)
    future = {**payload, 'observed_at': (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()}
    assert c.post('/v0/community/reports', json=future, headers=headers()).json()['detail'] == 'report_observation_expired'
    naive = {**payload, 'observed_at': '2026-10-21T12:00:00'}
    assert c.post('/v0/community/reports', json=naive, headers=headers()).status_code == 422
    wrong_epoch = {**payload, 'epoch': 'f' * 32}
    result = c.post('/v0/community/reports', json=wrong_epoch, headers=headers())
    assert result.status_code == 410 and result.json()['detail'] == 'report_epoch_expired'
