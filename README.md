# PanaPulse

Spanish-first civic companion for Panama City, built with Expo SDK 57 / React Native 0.86 and FastAPI. The same application runs on Android/iOS and in desktop or mobile browsers, preserving Porcelana, Manrope, ES/EN and Auto/Light/Dark.

**Current scope (October 21, 2026):** finish and verify the connected application in the repository first. Deployment and tester distribution follow the owner's review. Implemented code and local test evidence do not establish a publicly reachable service, an installable beta, or native-device acceptance.

Start with the [connected beta audit](docs/CONNECTED_BETA_AUDIT.md), [architecture diagrams](docs/architecture/PANAPULSE_TECHNICAL_ARCHITECTURE.md), [operations runbook](docs/CONNECTED_BETA_RUNBOOK.md) and [browser beta guide](docs/WEB_BETA.md). Earlier local-only handoffs remain historical context; they do not describe the connected implementation below.

## Connected functionality

| Area | Repository implementation | Boundary |
| --- | --- | --- |
| Earthquakes and aftershocks | Backend-ingested USGS observations and published OAF; native and web read `/v0/seismic` | Genuine source times; expired forecasts remain historical. This is not earthquake early warning. |
| Electricity | ENSA/Naturgy scheduled-maintenance collectors and area-filtered notices | A schedule or its absence does not establish current electricity availability. |
| Community | Structured electricity/water observations, server receipts, retry, withdrawal and coarse aggregates | Unverified community information; no names, free text or exact coordinates. Installation identities are not verified people. |
| Water, Metro and MiBus | Honest unavailable states and official channel links | No authorized live service feed or fabricated vehicle ETA. |
| Ask | Deterministic answers from app data plus an optional guarded `/v0/ask` transport | Model credentials, provider/model availability and budget controls require separate operational acceptance. |
| Browser | Shared Expo app with responsive reading column and shareable `/#/…` destinations | Private report ownership and preferences belong to each browser/app installation. |

Connected mode disables fictional preview scenarios and bundled seismic substitution. On refresh failure, only previously received, dated seismic data may remain, marked stale. A first launch without API data shows an unavailable state. The older explicitly labeled showcase remains a separate development flow.

## Run locally

```sh
npm ci
python -m pip install -r backend/requirements.lock -e './backend[test]'
python -m panapulse.cli init-db
python -m panapulse.cli ingest --verbose
```

Run the API and collector in separate terminals using the same `DATABASE_URL`. Configure local settings from `.env.backend.example`; environment files are not automatically loaded by these commands. Reports require the feature flag and a private hash key. See the runbook for exact configuration, retention and moderation.

```sh
python -m uvicorn panapulse.api:app --host 127.0.0.1 --port 8000
python -m panapulse.worker
EXPO_PUBLIC_APP_MODE=connected EXPO_PUBLIC_API_URL=http://127.0.0.1:8000 npm run web
```

For web development, set `PANAPULSE_CORS_ORIGINS` on the API to the exact origin printed by Expo. For a physical phone, use a reachable development host address instead of the phone's loopback address. Public beta exports require HTTPS; never publish a loopback build.

See the [API contract](docs/API_CONTRACT.md) and [owner acceptance checklist](docs/BETA_ACCEPTANCE.md) for exact behavior and a reproducible walkthrough.

## Verify before review

```sh
python -m pytest backend/tests -q
npm run typecheck
node scripts/test-seismic-contract.cjs
```

GitHub CI additionally runs source/preview/local-state regressions, a connected browser report lifecycle against an isolated real HTTP API, offline retry checks, and a Docker build/readiness job. Inspect the exact commit's CI results; the workflow definition is not evidence that a run passed. `npm run test:connected` expects the exported local test client and Playwright setup described in `scripts/qa/run-connected.sh`.

For a future connected web release, set the reviewed API's public HTTPS origin and run `npm run export:web:connected`. Its guard rejects missing, HTTP or showcase configuration and clears Metro's cache before export. `vercel.json` is optional static-host configuration; it does not host the Python API or publish anything by itself.

## Architecture and design contracts

- [Technical architecture and Mermaid flows](docs/architecture/PANAPULSE_TECHNICAL_ARCHITECTURE.md): clients, source policy, report persistence, recovery and verification gates.
- [Operations runbook](docs/CONNECTED_BETA_RUNBOOK.md): one API process, one collector, durable SQLite, trusted proxy, source-only backup/restore and rollback.
- [Backend documentation](backend/README.md): source ingestion and API implementation.
- [DESIGN.md](DESIGN.md), [brand](docs/BRAND.md), [tokens](src/theme/tokens.ts), [React Native rules](docs/ANTISLOP-RN.md): binding visual and accessibility decisions.
- [Connected audit](docs/CONNECTED_BETA_AUDIT.md): roadmap reconciliation, completed work, evidence and remaining gates. PRs #22–25 were merged; do not recreate them.

Preserve the existing in-app navigation and Android back behavior. Web hash navigation is a small platform adapter, not a second app or a router rewrite. No merge, deployment or beta-readiness claim follows automatically from this documentation.
