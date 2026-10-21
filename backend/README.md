# PanaPulse backend 0.3.0

FastAPI and SQLAlchemy power the connected Expo native/web app. The backend ingests genuine USGS/OAF and official scheduled power notices, persists anonymous observations, and supplies optional source-grounded Ask. It is not an emergency authority, earthquake-warning system or live utility/transit telemetry service.

Start with the [API contract](../docs/API_CONTRACT.md), [architecture diagrams](../docs/architecture/PANAPULSE_TECHNICAL_ARCHITECTURE.md), [operations runbook](../docs/CONNECTED_BETA_RUNBOOK.md) and [acceptance checklist](../docs/BETA_ACCEPTANCE.md). Repository verification is separate from public deployment and physical-device acceptance.

## Modules and responsibilities

| Module | Responsibility |
|---|---|
| `client.py`, `normalize.py`, `ingest.py` | Bounded USGS requests, normalized events, immutable material revisions, compressed evidence and validated published OAF |
| `utilities.py` | ENSA/Naturgy schedules, source freshness, explicit place/provider matching and parser errors |
| `models.py` | Official source records, revisions, forecasts, snapshots and health |
| `reports.py` | Owner receipts, epoch/observation-time validation, dedupe, withdrawal, aggregation, persistent limits and retention |
| `budgets.py` | Durable HMAC-keyed model request budgets; failed calls still consume reservations |
| `ask.py` | Guarded read-only source tools and optional model execution |
| `api.py`, `request_limits.py` | Public source reads, bounded community mutations, capability/readiness endpoints and request-body limits |
| `worker.py`, `cli.py` | Scheduled ingestion, bounded retries, cleanup and trusted operator actions |
| `backup.py`, `smoke.py` | Verified source-only SQLite backup/restore and read-only operational checks |

The supported closed-beta topology is **one API worker plus one collector sharing durable SQLite**. Report and budget mutation locks are process-local. Do not scale replicas or switch databases without a reviewed concurrency/migration plan. The optional Postgres driver remains in package metadata; it does not establish verified scale-out readiness.

## Local setup

From the repository root, using Python 3.12 (the pinned container/CI runtime):

```sh
python -m venv backend/.venv
. backend/.venv/bin/activate
python -m pip install -r backend/requirements.lock -e './backend[test]'
python -m panapulse.cli init-db
python -m panapulse.cli ingest
python -m pytest backend/tests -q
```

All processes must use the same `DATABASE_URL`. Environment files are not automatically read by Python; export settings in the shell or use the protected Compose environment file described in the runbook. Reports and paid model calls stay disabled until explicitly configured.

```sh
python -m uvicorn panapulse.api:app --host 127.0.0.1 --port 8000 --workers 1 --no-access-log
```

In another terminal, with the same settings:

```sh
PANAPULSE_UTILITY_SOURCES=ensa,naturgy python -m panapulse.worker
```

Do not run an additional collector against the same database simultaneously. `init-db` creates missing tables, including the new report runtime and model budget tables. It is not a replacement for versioned migrations when future changes alter existing columns.

Interactive documentation is at `http://127.0.0.1:8000/docs`; schema is at `/openapi.json`. `/healthz` is liveness, `/readyz` checks required tables, and `/v0/source-health` reports USGS freshness. No HTTP endpoint performs source ingestion.

## Source integrity

- The worker polls USGS every two minutes and utility pages every six hours, with bounded backoff. USGS becomes stale after 20 minutes, a failed latest attempt or invalid input. Utility freshness uses 36 hours and the latest error/success. These thresholds describe collection health, never public safety.
- Unchanged events do not create material revisions. Older snapshots cannot overwrite newer source records. Source responses are retained compressed for provenance/replay; monitor disk growth and preserve source evidence under the operator's retention policy.
- OAF availability distinguishes `none`, `listed` and `confirmed`. Published forecast JSON is fetched and schema-validated separately; stored issuance/validity windows govern current versus historical display. Probabilities are never estimated from a model or neighboring quakes.
- ENSA/Naturgy notices are scheduled work, with original URLs and explicit areas. They do not confirm whether power is currently on. A missing or empty feed remains unknown.
- `python -m panapulse.cli replay --snapshot-id ID` replays a stored FeatureCollection without marking the source freshly fetched. Historical OAF detail snapshots are evidence, not an independent replay pipeline.

The audit successfully fetched real USGS, ENSA and Naturgy data. Fixture tests remain offline and do not guarantee provider uptime or data reuse rights. See the audit for observed counts and verification limits.

## Runtime defaults

| Variable | Default |
|---|---|
| `DATABASE_URL` | `sqlite:///./panapulse.db` for local development |
| `PANAPULSE_MIN_LAT` / `PANAPULSE_MAX_LAT` | `5.5` / `11.5` |
| `PANAPULSE_MIN_LON` / `PANAPULSE_MAX_LON` | `-84` / `-76` |
| `PANAPULSE_MIN_MAGNITUDE` | `2.5` at ingestion; app bundle filters M4.5+ |
| `PANAPULSE_LOOKBACK_DAYS` | `30` |
| `PANAPULSE_UTILITY_SOURCES` | Empty unless explicitly configured |
| `PANAPULSE_REPORTS_ENABLED` | Disabled unless `1` |
| `ANTHROPIC_API_KEY` | Absent; paid model calls unavailable |

These geographic bounds include neighboring territory and offshore events. Do not label every event as inside Panama. Secrets, CORS, trusted proxy addresses and budget limits are documented in [`.env.backend.example`](../.env.backend.example); no database or provider secret belongs in the mobile/web bundle.

## Privacy and recovery

Community reports accept only service, interruption/restoration, supported area and bounded protocol metadata. A random installation token establishes receipt ownership; no verified account is implied. Public aggregates suppress exact counts below three installation identities. Reports expire two hours after observation and are removed after seven days; withdrawals and moderation affect aggregates immediately.

Only source data is backed up. The restore command rejects existing destination paths, verifies schema/integrity, creates a new report epoch and guards paid model calls until the next UTC day. Old pending reports are rejected rather than silently restored. Rehearse the documented procedure on staging and monitor the worker so retention continues even when no visitors or model calls arrive.

Read-only operational checks:

```sh
python -m panapulse.smoke --url https://api.example.com \
  --web-origin https://beta.example.com --require-fresh --require-reports
```

Replace example origins with the reviewed deployment. This command does not create public observations. Synthetic report lifecycle tests use only the isolated database started by `scripts/qa/run-connected.sh`.

Source references: [USGS catalog](https://earthquake.usgs.gov/fdsnws/event/1/), [OAF documentation](https://ghsc.code-pages.usgs.gov/hazdev/pdl/userguide/products/known-types/oaf.html), and [SINAPROC](https://www.sinaproc.gob.pa/) for official emergency instructions.
