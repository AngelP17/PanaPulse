"""One bounded collector process. API requests never crawl upstream sources."""
import json
import logging
import os
import signal
import threading
import time

from .client import USGSClient
from .config import Settings
from .ingest import USGSIngestor, mark_source_failure
from .models import make_session_factory
from .reports import purge
from .utilities import UtilityIngestor

log = logging.getLogger("panapulse.worker")


def run():
    logging.basicConfig(level=logging.INFO)
    settings = Settings.from_env()
    engine, sessions = make_session_factory(settings.database_url)
    stop = threading.Event()
    for sig in (signal.SIGTERM, signal.SIGINT):
        signal.signal(sig, lambda *_: stop.set())
    utilities = [s.strip() for s in os.getenv("PANAPULSE_UTILITY_SOURCES", "").split(',') if s.strip()]
    if any(s not in ('ensa', 'naturgy') for s in utilities):
        raise ValueError('Unknown utility source')
    sources = ['usgs', *utilities]
    due = {source: 0.0 for source in sources}
    failures = {source: 0 for source in sources}
    try:
        while not stop.is_set():
            for source in sources:
                if stop.is_set() or time.monotonic() < due[source]:
                    continue
                started = time.monotonic()
                interval = 120 if source == 'usgs' else 6 * 3600
                try:
                    if source == 'usgs':
                        with USGSClient(settings) as client:
                            result = USGSIngestor(sessions, settings, client).ingest().as_dict()
                        if result['invalid']:
                            raise ValueError('invalid_usgs_records')
                    else:
                        with UtilityIngestor(sessions) as client:
                            result = client.run(source)
                    failures[source] = 0
                    log.info(json.dumps({'source': source, 'status': 'ok', 'seconds': round(time.monotonic()-started, 2), 'result': result}))
                except Exception as exc:
                    failures[source] += 1
                    if source == 'usgs':
                        mark_source_failure(sessions, exc)
                    interval = min(6 * 3600, 60 * 2 ** min(failures[source], 8))
                    log.error(json.dumps({'source': source, 'status': 'failed', 'error': type(exc).__name__, 'retry_seconds': interval}))
                due[source] = time.monotonic() + interval
            purge(sessions)
            stop.wait(30)
    finally:
        engine.dispose()


if __name__ == '__main__':
    run()
