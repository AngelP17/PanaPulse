# Scheduled electricity in PanaPulse

Services and Home read **scheduled maintenance notices only** for the selected supported Panama City corregimiento through the backend. This is not a live electricity or outage confirmation.

## Run locally

```bash
cd backend
python -m panapulse.cli init-db
python -m panapulse.cli utilities --source ensa
python -m panapulse.cli utilities --source naturgy
uvicorn panapulse.api:app --host 0.0.0.0 --port 8000
```

Optional database configuration: `DATABASE_URL`. Configure `EXPO_PUBLIC_API_URL` to the reachable API origin and restart Expo. A mobile device cannot reach your computer's localhost; use its reachable local IP for a development session and HTTPS for deployment.

## API

`GET /v0/power-maintenance?corregimiento=Pueblo%20Nuevo`

- The API always returns `service_state: unknown`. Neither empty results nor a recently polled source imply service is operating normally.
- `sources[].freshness` reflects when the **collector** last succeeded, not when ENSA/Naturgy last published.
- Notices are scoped to the selected corregimiento and include the provider, exact affected area, window and source URL.
- The app defaults to Pueblo Nuevo; onboarding and Settings persist the selected corregimiento. Provider mapping and Panama district filtering prevent unrelated areas with the same name from matching.
- No data appears until an ingest worker runs successfully.
- Naturgy's weekly HTML page and ENSA's maintenance page may change. Parser failures must be monitored, not interpreted as an empty schedule.
- ENSA and Naturgy live responses were exercised locally during the connected audit; see [exact evidence and limitations](CONNECTED_BETA_AUDIT.md). A successful parser run is not a deployed monitoring service or proof of ongoing availability. Provider reuse conditions still require review.
- The collector polls enabled utilities every six hours with failure backoff. Naturgy parsing limits ingestion to the current near-term window so malformed archived rows do not break current notices. Source failures remain stale/unavailable.

## Deferred modules

IDAAN incident ingestion, unplanned electric outage telemetry, Metro/MiBus live ETA feeds and traffic incidents remain unconnected. Structured community electricity/water observations now have a backend, but remain unverified community information and never official power status. The interface links to official channels and must not invent availability.

For the shared native/web API, worker configuration, retention and operational checks, see the [connected runbook](CONNECTED_BETA_RUNBOOK.md) and [architecture](architecture/PANAPULSE_TECHNICAL_ARCHITECTURE.md).
