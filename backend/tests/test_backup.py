from datetime import datetime, timedelta, timezone
import os
import sqlite3

import pytest
from fastapi.testclient import TestClient

from panapulse.api import create_app
from panapulse.backup import restore, snapshot
from panapulse.models import Base, SourceHealth, make_session_factory
from panapulse.reports import CommunityReport, ReportAudit, ReportRateBucket


def test_online_wal_backup_and_restore_exclude_community_data(tmp_path):
    original, archive, restored = [tmp_path / name for name in ('original.db', 'backup.db', 'restored.db')]
    engine, sessions = make_session_factory(f'sqlite:///{original}')
    Base.metadata.create_all(engine)
    now = datetime.now(timezone.utc)
    with sessions.begin() as s:
        s.add(CommunityReport(id='private-receipt', owner_hash='private-owner', request_id='private-request',
            service='water', area='Ancón', observation='interruption', created_at=now,
            expires_at=now + timedelta(hours=2), status='active'))
        s.add(ReportRateBucket(id='private-ip-hash', count=1, expires_at=now + timedelta(hours=1)))
        s.add(ReportAudit(report_id='private-receipt', action='submitted'))
    # Keep an uncheckpointed WAL connection open throughout the online snapshot.
    with sqlite3.connect(original) as writer:
        writer.execute('PRAGMA journal_mode=WAL')
        writer.execute('PRAGMA wal_autocheckpoint=0')
        writer.execute("INSERT INTO source_health(source,last_event_count) VALUES ('usgs',17)")
        writer.commit()
        snapshot(original, archive)
        assert writer.execute('SELECT count(*) FROM community_reports').fetchone()[0] == 1
    assert os.stat(archive).st_mode & 0o777 == 0o600
    assert b'private-receipt' not in archive.read_bytes()
    assert b'private-owner' not in archive.read_bytes()
    restore(archive, restored)
    restored_engine, restored_sessions = make_session_factory(f'sqlite:///{restored}')
    with TestClient(create_app(restored_sessions)) as client:
        assert client.get('/readyz').status_code == 200
    with restored_sessions() as s:
        assert s.get(SourceHealth, 'usgs').last_event_count == 17
        assert s.query(CommunityReport).count() == 0
        assert s.query(ReportRateBucket).count() == 0
        assert s.query(ReportAudit).count() == 0
    with pytest.raises(FileExistsError):
        snapshot(original, archive)
    with pytest.raises(FileExistsError):
        restore(archive, restored)
    with pytest.raises(ValueError, match='contains community data'):
        restore(original, tmp_path / 'unsafe.db')
    restored_engine.dispose()
    engine.dispose()


def test_backup_refuses_missing_and_incomplete_databases(tmp_path):
    with pytest.raises(FileNotFoundError):
        snapshot(tmp_path / 'missing.db', tmp_path / 'output.db')
    incomplete = tmp_path / 'empty.db'
    sqlite3.connect(incomplete).close()
    with pytest.raises(ValueError, match='Incomplete'):
        snapshot(incomplete, tmp_path / 'output.db')
    assert not (tmp_path / 'output.db').exists()
