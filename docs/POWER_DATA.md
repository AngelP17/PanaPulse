# Scheduled electricity in PanaPulse

The new Services screen and Home summary read **scheduled maintenance notices only** for Pueblo Nuevo through the backend. This is not a live electricity or outage confirmation.

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
- The app defaults to Pueblo Nuevo; geographic selection is not implemented yet.
- No data appears until an ingest worker runs successfully.
- Naturgy's weekly HTML page and ENSA's maintenance page may change. Parser failures must be monitored, not interpreted as an empty schedule.
- Scraping feasibility has been tested against fixtures, not independently proven against current live provider responses here. Commercial permissions must be checked.

## Deferred modules

IDAAN outage announcements, unplanned electric outages, user-shared reporting, Metro/MiBus live ETA feeds and traffic incidents remain unconnected. The interface links to official channels and must not invent availability.
