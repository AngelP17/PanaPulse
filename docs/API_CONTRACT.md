# Connected beta API contract

API version: `0.3.0`. Base paths remain `/v0`; FastAPI serves the exact machine-readable schema at `/openapi.json` and interactive documentation at `/docs`. Web and native use the same origin and contracts. Never put backend secrets in the exported client.

## Operational and source reads

| Method and path | Purpose and semantics |
|---|---|
| `GET /healthz` | Process liveness only. Does not verify database or upstream sources. |
| `GET /readyz` | Database access and all required source/report/budget tables. Returns 503 if the schema/database is unavailable. |
| `GET /v0/capabilities` | Reports and paid-chat configuration flags. Configuration is not evidence that an external provider is reachable. |
| `GET /v0/source-health` | USGS attempt/success times, parser/fetch errors and freshness. Missing, failed or older-than-20-minute data is stale/unavailable. |
| `GET /v0/seismic` | The app's combined persisted USGS catalog and latest stored OAF. M4.5+, 30 days, at most 200 events. Millisecond timestamps; nullable forecast. `fetchedAt: 0` means no successful source fetch. `mode: snapshot` means stale, not fabricated data. |
| `GET /v0/earthquakes` | Source-oriented event catalog. Inspect OpenAPI for query parameters and limits. |
| `GET /v0/earthquakes/{event_id}` | One source record, including provenance and OAF status. Unknown tsunami warning state remains null. |
| `GET /v0/earthquakes/{event_id}/revisions` | Stored source revision history. |
| `GET /v0/forecast` | OAF data with current/historical context and time windows. No invented forecast when absent. |
| `GET /v0/power-maintenance?corregimiento=...` | Correct provider(s), source health and published scheduled work for a supported area. Always `service_state: unknown` and `scope: scheduled_maintenance_only`. Empty schedules do not mean electricity is available. |

No HTTP endpoint triggers ingestion. The collector performs bounded background reads and stores results; visitor traffic reads the database. Source response times and app receipt times are different from earthquake/maintenance event times.

## Anonymous observations

Reports are opt-in structured observations about electricity or water. No accounts, names, exact coordinates or free text. Owner credentials are random 32-byte tokens held in the installation's local storage and sent only in `X-Installation-Token`. The server stores a hash, never the token. Web and native installations have separate private ownership, but share public aggregates.

| Method and path | Contract |
|---|---|
| `GET /v0/community/config` | Returns `epoch` (32 lowercase hexadecimal characters), `server_time` (UTC ISO timestamp), and `max_submission_age_seconds: 7200`. The epoch identifies this runtime database generation. |
| `POST /v0/community/reports` | Requires owner token plus `request_id` (UUID), `epoch`, `observed_at` (timezone-aware ISO timestamp), exact supported `area`, `service` (`electricity` or `water`) and `observation` (`interruption` or `restored`). Extra fields are rejected. |
| `GET /v0/community/mine` | Requires owner token; returns up to 100 of that installation's receipts from the last seven days. No other installation's receipts. |
| `DELETE /v0/community/reports/{id}` | Requires owner token. Deletes the observation; an opaque tombstone prevents delayed retry from recreating it. A repeated deletion succeeds. Wrong-owner access returns 404. |
| `GET /v0/community/summary?area=...` | Coarse area aggregate over active observations. `verification: community_unverified`, `service_state: unknown`. Groups below three distinct installation tokens suppress the exact count; installations are not verified unique people. |

A successful POST returns a receipt with `id`, `request_id`, `area`, `service`, `observation`, `created_at`, `expires_at`, `status` and `verification: community_unverified`. Status can be `active`, `expired`, `hidden` or `superseded`. The runtime epoch is request metadata, not a receipt field.

### Idempotency, expiry and recovery

1. A new observation obtains the current report configuration. The app records observation time using the server clock offset, creates a UUID and saves the full pending request before POST.
2. Retries preserve the UUID, epoch, observation time and payload. They never manufacture a new observation time to bypass expiry. The server returns the same accepted receipt without consuming a second submission budget.
3. A request with a different payload for an existing UUID returns 409. New observations older than two hours or too far in the future return 410. A withdrawn request returns 410. A pre-recovery epoch returns 410.
4. The client clears terminally expired/withdrawn pending requests, explains the result, and offers a fresh form. Unknown network outcomes remain pending until the server confirms them. An offline click never displays success.
5. Restoring the source-only backup excludes report data and the runtime generation, so the restored database generates a new epoch. Old queued observations cannot silently repopulate the recovered service. Restore also protects against resetting the daily paid-chat allowance.

The observation's two-hour visibility window starts at `observed_at`, not the eventual retry time. One installation has at most one active observation per area/service; a later restoration observation supersedes its earlier interruption. Server records expire from public aggregates and are removed by retention housekeeping after seven days. An operator can hide a receipt through the CLI; there is no public moderation endpoint.

### Limits and errors

Community writes have a 2 KiB body limit, including chunked bodies. General API writes have a 64 KiB limit. Submission budgets are six per installation/hour, 30 per client IP/hour and 2,000 globally/day, persisted in SQLite. The API runs one worker; deployment must preserve the trusted client IP through its proxy.

| Status | Meaning | Client behavior |
|---|---|---|
| 201 | Accepted or idempotently confirmed receipt | Show confirmed, unverified observation; remove pending request |
| 401 | Missing/invalid installation credential | Preserve user-visible error; never claim submitted |
| 404 | Receipt unavailable to this owner | No cross-owner disclosure |
| 409 | Idempotency conflict | Do not silently change/retry the payload under another ID |
| 410 | Withdrawn, expired observation or old runtime epoch | Clear this terminal pending request; explain and allow a new current observation |
| 413 / 422 | Oversized or invalid input | Correct input; no success state |
| 429 | Persistent request budget exhausted | Show limit message and respect retry guidance |
| 503 | Feature/database configuration unavailable | Show unavailable; retain uncertain pending request |

## Ask

`POST /v0/ask` accepts bounded `messages`, `lang: es|en` and optional `zone`. It is read-only with respect to observations and official data. It never submits reports, crawls a provider per visitor, invents live transit/utility status, or guarantees safety.

Deterministic common answers are composed in the client from actual received data. Paid model calls require configured credentials and a sufficiently long budget-hashing secret. Per-client/minute, per-client/day and global/day limits are persisted before provider calls; failed requests still consume their reservation. Restarts do not reset them. Tokens/currency spent still depend on bounded model calls, so verify provider-side cost limits before enabling paid chat.

No deployment or actual paid-provider execution is implied by repository tests. Source and report flows can be tested with model chat disabled. See [the operations runbook](CONNECTED_BETA_RUNBOOK.md) for environment variables, HTTPS/CORS, monitoring, privacy, backup and rollback.
