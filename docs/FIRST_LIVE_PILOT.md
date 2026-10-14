# First real PanaPulse pilot: USGS and scheduled electricity

This is an **executable first test**, not a production release. Existing backend modules implement USGS ingestion with revisions, ENSA/Naturgy planned-maintenance HTML adapters, SQLite/Postgres storage, and a read-only FastAPI API. The missing operational piece is actually fetching, verifying and serving the data from a running computer.

## 1. Run real collectors now

Run in a local checkout of PanaPulse with Python 3.11+ (prefer 3.12):

```bash
python3 -m venv backend/.venv
source backend/.venv/bin/activate
cd backend
python -m pip install -e '.[test]'
cd ..
bash scripts/first-live-test.sh
```

This creates/verifies a SQLite database at `backend/panapulse.db` by default (or connects to `DATABASE_URL`), then fetches USGS, ENSA and Naturgy separately. Errors are printed and a nonzero exit code is returned when any source is blocked, changes layout, times out, or fails validation. Past notices are retained, **never misrepresented as fresh or as an all-clear**.

## 2. Start the API

First terminal, from the repository root, with your virtualenv active:

```bash
cd backend
uvicorn panapulse.api:app --host 0.0.0.0 --port 8000
```

Second terminal:

```bash
curl -fsS http://127.0.0.1:8000/healthz
curl -fsS http://127.0.0.1:8000/v0/source-health
curl -fsS 'http://127.0.0.1:8000/v0/earthquakes?limit=10'
curl -fsS 'http://127.0.0.1:8000/v0/power-maintenance?corregimiento=Pueblo%20Nuevo'
```

The `/healthz` response checks only process liveness; source freshness lives in the source-health and power-maintenance endpoints. For electricity, read `sources[].freshness` and `sources[].last_error` as well as `notices`. `service_state: unknown` and `scope: scheduled_maintenance_only` are correct and must remain.

## 3. Show real notices in Expo Go on an Android phone

Use the same trusted Wi-Fi network for phone and computer. Find your computer's LAN address (on many Macs, `ipconfig getifaddr en0`; otherwise your Wi-Fi network details).

At the repository root:

```bash
npm ci
EXPO_PUBLIC_API_URL=http://192.168.1.42:8000 npx expo start --lan
```

**Replace** `192.168.1.42` with the actual LAN IP of the computer running FastAPI. On the phone, `localhost` is the phone itself. Open the Expo Go QR and check Services in **Preview OFF** mode. Native Expo Go may load real USGS directly; the electricity API reads your backend. The separate Claude-hosted artifact typically cannot reach your private LAN.

Do not make an HTTP LAN test server publicly accessible. Use HTTPS and a stable persistent backend for off-network beta testers.

## 4. Ongoing polling

For a single-worker beta, run `python -m panapulse.cli ingest` every 10–15 minutes, and `python -m panapulse.cli utilities --source ensa` and `--source naturgy` every six hours. Use a scheduler/worker with a persistent database, job locking, failure monitoring, 403/429 backoff and respect for source terms. Avoid running the same collector concurrently.

In a public pilot, use a persistent hosted Postgres database and a scheduled worker. Set `EXPO_PUBLIC_API_URL` to the HTTPS API origin, not a local address, and keep `DATABASE_URL` and any LLM keys server-side. Mobile devices read your cached API, not the operators directly.

## 5. Remaining source acquisition

| Service | Honest early-beta solution | Production path |
|---|---|---|
| IDAAN | Verified published notices with source links, time and geographic coverage; manually reviewed if necessary | Authorized announcement feed or permitted scraper, with dedup/revisions |
| Metro L1/L2 | Verified official service notices. Do not infer normal operation from silence | Operator service-alert feed/API, or permitted retrieval of official announcements |
| MiBus | Static routes/links; don't call scheduled times live arrivals | Request reusable official GTFS Static + GTFS-Realtime or predicted-arrival integration |
| Unplanned utility interruption | Anonymous neighborhood reports tagged community, subject to abuse controls | Moderation, corroboration, bounded freshness, reputation and privacy |
| Normal electric/water service | Never claim normal from an empty published-maintenance list | Actual operator live-availability signal, if permission/access exists |

MiBus already advertises real-time positions and ETAs in its app. That does **not** establish a public reusable API. Email the operator requesting a developer or data-sharing pathway, licensing terms, and GTFS/GTFS-RT details.

ENSA: https://ensa.com.pa/mantenimientos-programados/
Naturgy: https://www.naturgy.com.pa/cronogramas-mantenimiento/
Naturgy searchable: https://formularios.naturgy.com.pa/WebAsep/reporte_descargos_programados.jsf
MiBus: https://www.mibus.com.pa/noticia/mibus-maps-panama/
Metro: https://elmetrodepanama.com/
USGS: https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php

### Real-data acceptance

- New USGS earthquake appears with an actual observation time and source link.
- ENSA and Naturgy each either parse genuine current source content or expose clear errors. An absence of scheduled notices is not a normal-service confirmation.
- Expo Go displays the API results over local Wi-Fi and refreshes after a successful new poll.
- Preview OFF contains no fictional outages or arrival times.
- Native Android testing is complete before public release.

## Android internal build needs a backend URL
`eas.json` no longer sets an empty `EXPO_PUBLIC_API_URL`. The pre-install guard (`scripts/check-build-env.cjs`) fails the build unless the profile provides an `https://` API origin, because an APK without one has no scheduled power notices and no server chat, and it would not say so. Set it with `eas env:create --environment preview` (name `EXPO_PUBLIC_API_URL`), or build knowingly offline with `ALLOW_NO_BACKEND=1`. A successful install does not mean live data is connected: check Settings > source health after installing.
