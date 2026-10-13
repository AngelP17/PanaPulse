# PanaPulse USGS adapter v0

A **small, testable Python component** for a Panama-first situational awareness app. It consumes USGS earthquake GeoJSON, stores source snapshots, maintains current events **and their full revision history**, detects listed/confirmed `oaf` products, and exposes a read-only FastAPI service.

This is **not an earthquake-warning service** and does **not** predict earthquakes, assert an active tsunami warning, or present probabilities without a verified forecast file. It is intentionally much smaller than the full PanaPulse product spec.

## What ships in this repo

- USGS FDSN GeoJSON query, filtered to a configurable Panama-area bounding box.
- Event normalization with location, magnitude, origin time, update time, USGS event ID, USGS alert color, review status and `oaf` availability.
- Immutable numbered revisions: if USGS changes M7.6 to M7.7, preserve both versions; older fetched snapshots cannot undo newer updates.
- Compressed original API responses in `source_snapshots` for debugging/replay.
- Limited detail calls for events with an advertised `oaf` product; separate `listed` vs `confirmed` statuses.
- Source-health endpoint that returns `stale_or_unavailable` if the last successful poll is older than 30 minutes (or no poll happened).
- Read-only FastAPI endpoints for events and revisions. No public ingestion endpoint.
- Offline tests, including the Oct 9 Panama **us6000u18k** event, its revised M7.7 magnitude, and separate M6.6/M6.0 earthquakes.

**Not included:** mobile frontend, utility scraper, live traffic, notifications, accounts, ads, payments, forecasts parsing, official warning dissemination, review/moderation or automatic process scheduling. Add each *after* validating retention and data quality.

## Quick start: local SQLite development

Requirements: Python 3.11 or newer.

```bash
cd panapulse-usgs-v0
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\\Scripts\\activate
pip install -e '.[test]'
python -m pytest -q
python -m panapulse.cli init-db
python -m panapulse.cli ingest
uvicorn panapulse.api:app --reload --host 127.0.0.1 --port 8000
```

On a system with outbound internet, `ingest` requests USGS FDSN data in the configured bounding box for the most recent 30 days. It is safe to rerun: unchanged events do not create revisions, and a USGS "updated" timestamp bump with no material change (e.g. a DYFI refresh) does not either. Repeated polls with identical content store one snapshot.

The tests do **not** require internet access. The current package was tested offline; the code's network behavior has **not** been validated against live USGS responses in this environment.

Interactive API documentation: <http://127.0.0.1:8000/docs>

Examples:

```bash
curl http://127.0.0.1:8000/v0/source-health
curl http://127.0.0.1:8000/v0/earthquakes
curl http://127.0.0.1:8000/v0/earthquakes/us6000u18k
curl http://127.0.0.1:8000/v0/earthquakes/us6000u18k/revisions
```

`GET /healthz` is **process liveness only**. Always check `/v0/source-health` before presenting status/freshness to users.

## Use Supabase Postgres

For a Supabase Postgres connection, install the optional driver:

```bash
pip install -e '.[postgres]'
export DATABASE_URL='postgresql+psycopg://USER:PASSWORD@HOST:5432/postgres?sslmode=require'
python -m panapulse.cli init-db
python -m panapulse.cli ingest
uvicorn panapulse.api:app --host 127.0.0.1 --port 8000
```

Load `DATABASE_URL` from a secret manager or protected environment file, **not your mobile application**. Do not commit credentials or expose database credentials through public endpoints. For production, use a least-privileged DB role, TLS, backups and migrations (Alembic); `create_all` is only a bootstrap helper.

This iteration stores longitude and latitude as numeric columns. Introduce PostGIS point/geography types once there is a genuine geospatial query requirement.

## Scheduling

Run `python -m panapulse.cli ingest` from an external scheduler every **10–15 minutes** to start. Example cron:

```cron
*/15 * * * * cd /path/to/panapulse-usgs-v0 && /path/to/.venv/bin/python -m panapulse.cli ingest >> /var/log/panapulse-usgs.log 2>&1
```

Run only **one active ingestion worker** against a database until concurrency locking is implemented. Use a lock (`flock`) around cron if ingestion intervals could overlap. Avoid hitting USGS excessively; production backoff and HTTP caching deserve a real-world soak test. The data is delayed observational reporting, **not** advance earthquake detection.

The source-health endpoint considers the feed stale after 30 minutes. If the UI shows no recent events, report **“Sin eventos registrados en esta fuente”**, never **“No hay sismos”** or **“Todo normal”**.

## OAF handling: important nuance

The summary feed's `properties.types` value may contain `oaf`. That means **product listed**, not that aftershock odds have been extracted. The adapter then attempts the event-detail URL and looks for an active `properties.products.oaf` item:

- `none`: no OAF advertised in the latest summary.
- `listed`: summary references an OAF, but an active product was not confirmed from detail.
- `confirmed`: active `oaf` product metadata was observed in detail.

The endpoint exposes `oaf_product_updated_at` as the product's **last update**, not necessarily the forecast's own issue time. `oaf_forecast_url`, when present, is a URL for the official `forecast.json` asset, not a parsed numerical forecast. The next adapter iteration must fetch it, **validate its schema, locate forecast issuance and period explicitly, and display probabilities only as published by USGS**. Never derive odds from magnitude, neighboring quakes or an LLM.

The Oct 9 regression fixture advertises `oaf` but deliberately contains **no probabilities**. It is a minimized snapshot of source values, not a fake complete forecast payload.

## Reliability/failure behavior

- All selected events and their associated revisions are written in a SQL transaction. Unexpected failures roll back that transaction.
- Transient network errors retry up to three times with short exponential delays; long-term upstream failure is recorded in `source_health.last_error`.
- A failing OAF detail call does not erase a valid earthquake record. The record stays `listed` until details can be confirmed.
- Snapshot retention currently has no automated expiry. Decide a storage retention window, backups and replay policy before deployment.
- `source_snapshots` stores gzip-compressed full JSON responses. The API does **not** expose raw snapshots to end users.
- Replay a stored FeatureCollection without any network calls:

  ```bash
  python -m panapulse.cli replay --snapshot-id 1
  ```

  Replay does not mark the source freshly polled and cannot roll an event's `updated` timestamp backward. Historical OAF detail snapshots are saved but not yet independently replayed.
- There is no concurrency lock, automatic retention purge, metrics exporter or persistent dead-letter queue yet. Don't call this production hardened.

## Panama bounding box (configurable)

| Variable | Default |
|---|---:|
| `PANAPULSE_MIN_LAT` | `5.5` |
| `PANAPULSE_MAX_LAT` | `11.5` |
| `PANAPULSE_MIN_LON` | `-84` |
| `PANAPULSE_MAX_LON` | `-76` |
| `PANAPULSE_MIN_MAGNITUDE` | `2.5` |
| `PANAPULSE_LOOKBACK_DAYS` | `7` |
| `DATABASE_URL` | `sqlite:///./panapulse.db` |

These bounds include adjacent territory and offshore earthquakes. The UI must not imply all events occurred **inside** Panama. The 30-day lookback keeps magnitude and aftershock-forecast revisions for large events flowing after the first week (the query is still a single cheap request). Use backfill for historical data.

## Sources / attribution

- [USGS Earthquake Catalog API](https://earthquake.usgs.gov/fdsnws/event/1/)
- [USGS live GeoJSON feeds](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php)
- [USGS earthquake products](https://earthquake.usgs.gov/data/products/)
- [USGS OAF product documentation](https://ghsc.code-pages.usgs.gov/hazdev/pdl/userguide/products/known-types/oaf.html)
- [Oct 9 event us6000u18k](https://earthquake.usgs.gov/earthquakes/eventpage/us6000u18k)
- [SINAPROC](https://www.sinaproc.gob.pa/), the emergency-authority reference for Panama. **Do not synthesize tsunami all-clear statements.**

**Suggested user-facing disclaimer:** “Datos sísmicos del USGS. PanaPulse no es una autoridad de emergencias. Para instrucciones oficiales, consulta SINAPROC.”

## Next 3 steps, not 30 features

1. Deploy the ingestion job and monitor a full week of USGS fetches/revisions/failures.
2. Evaluate **one** utility feed (ENSA *or* Naturgy) for two weeks, including actual notice coverage and last-update semantics.
3. Build the smallest possible Android view: earthquake card, official notice card, and “¿Se fue solo a mí?” prototype for 2–3 corregimientos. No ads or subscriptions before repeated use is demonstrated.
