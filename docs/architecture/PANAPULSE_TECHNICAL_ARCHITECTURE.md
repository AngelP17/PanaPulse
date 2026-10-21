# PanaPulse | Technical Architecture & Product Flows

**Updated:** October 21, 2026. **Scope:** the connected implementation under review, preserving Expo / React Native, FastAPI, SQLAlchemy and Porcelana. These diagrams describe repository behavior, not a deployed service or completed native-device acceptance.

The owner requested repository completion and review before deployment. The [connected audit](../CONNECTED_BETA_AUDIT.md) records evidence and outstanding gates; the [operations runbook](../CONNECTED_BETA_RUNBOOK.md) contains deployment/recovery procedures for later use. [Browser beta](../WEB_BETA.md) documents the shared web build.

## 1. System architecture

```mermaid
flowchart TD
    Native["Expo / React Native app"] --> API["FastAPI: one API process"]
    Browser["Desktop and mobile browser: Expo Web"] --> API
    Native --> Local["Per-installation AsyncStorage"]
    Browser --> Local
    API --> DB["SQLAlchemy / durable SQLite"]
    USGS["USGS catalog and published OAF"] --> Worker["Scheduled Python collector"]
    Power["ENSA / Naturgy scheduled notices"] --> Worker
    Worker --> DB
    Worker --> Purge["Report and budget retention cleanup"]
    Purge --> DB
    API -. "optional, configured and guarded" .-> Model["Model provider / read-only tools"]
```

Clients never trigger source crawling. The worker polls USGS every two minutes and configured utility sources every six hours, with bounded failure backoff. Clients refresh seismic data every five minutes, on app resume and on explicit retry. Source health records success/failure separately from event times and service state. An unsuccessful or invalid ingest does not become a successful source update.

One API process and one worker share one persistent volume. Report mutation locking is process-local; additional API workers/replicas require a database concurrency design before scale-out. Optional model request budgets persist in SQLite across API restarts, reserve before provider calls and count failed calls. They bound request counts; provider-side monetary caps remain an operational control. See `backend/panapulse/worker.py`, `reports.py`, `api.py` and `compose.yaml`.

## 2. Client modes and navigation

```mermaid
flowchart TD
    Start["Launch app or browser URL"] --> Welcome{"Onboarding complete?"}
    Welcome -- No --> Setup["Choose area, language and appearance"]
    Setup --> Destination["Requested destination or Home"]
    Welcome -- Yes --> Destination
    Destination --> Mode{"Build mode?"}
    Mode -- Connected --> Real["API data and structured shared reports"]
    Mode -- "Explicit showcase" --> Preview["Labeled scenarios and local-only reports"]
    Real --> Tabs["Home / Mobility / Quakes / Reports"]
    Preview --> Tabs
    Tabs --> Detail["Services, source details, Ask and Settings"]
```

The four-tab navigation remains managed by `AppContext`. Android back closes a quake sheet, then returns Home. The `.web.ts` navigation adapter adds `/#/home`, `/#/mobility`, `/#/quakes`, `/#/report`, `/#/services`, `/#/chat` and `/#/settings`, including refresh and browser history. A browser is an independent installation; it does not share private receipts or preferences with a phone.

`EXPO_PUBLIC_APP_MODE=connected` disables the scenario switch and bundled seismic substitution. Existing showcase/local records are never uploaded automatically. Missing IDAAN, Metro and MiBus feeds remain unavailable with official links; no fictional conditions or arrivals appear as live data.

## 3. API boundaries

| Endpoint | Responsibility |
| --- | --- |
| `GET /healthz` / `GET /readyz` | Process liveness / required-table accessibility. Neither establishes upstream freshness. |
| `GET /v0/capabilities` | Configured report/chat capability flags; not proof of model-provider availability. |
| `GET /v0/seismic` | Validated client bundle: M4.5+ regional observations from the last 30 days, up to 200 records, published OAF, source health and original timestamps. |
| `GET /v0/source-health` | USGS source success/error and freshness. |
| `GET /v0/earthquakes`, `/{event_id}`, `/{event_id}/revisions` | Detailed source records and revision history under the `/v0/earthquakes` prefix. |
| `GET /v0/forecast` | Stored published aftershock forecast through the read-only source tools. |
| `GET /v0/power-maintenance?corregimiento=…` | Provider- and district-scoped scheduled notices and per-provider source health. |
| `GET /v0/community/config` | Current recovery epoch, server time and two-hour submission-age limit. |
| `POST /v0/community/reports` | Validated, rate-limited, idempotent structured observation, including epoch and observation time. |
| `GET /v0/community/mine` | The installation's own retained receipts. |
| `DELETE /v0/community/reports/{id}` | Owner withdrawal; safe to retry after a lost response. |
| `GET /v0/community/summary?area=…` | Coarse, unverified aggregates; no individual submissions or public identities. |
| `POST /v0/ask` | Optional bounded assistant request with language and selected area; read-only source tools. |

Owner operations require `X-Installation-Token`. The backend hashes this random installation credential rather than storing its raw value. This is possession-based installation ownership, not a verified account system. Web origins are explicitly allowed through CORS. Request-body limits and source/receipt schema validation prevent invalid payloads from being silently treated as valid information.

## 4. Persistence and privacy

```mermaid
erDiagram
    EARTHQUAKES ||--o{ EARTHQUAKE_REVISIONS : retains
    EARTHQUAKES ||--o{ AFTERSHOCK_FORECASTS : has
    EARTHQUAKES {
        string id PK
        datetime event_time
        float magnitude
        string event_url
    }
    SOURCE_HEALTH {
        string source PK
        datetime last_success_at
        string last_error
    }
    UTILITY_NOTICES {
        string id PK
        string provider
        string corregimiento
        datetime starts_at
        datetime ends_at
        datetime last_seen_at
    }
```

The community and budget tables use opaque identifiers, with no public identity relationship:

```mermaid
erDiagram
    COMMUNITY_REPORTS {
        string id PK
        string owner_hash
        string request_id
        string area
        string service
        string observation
        datetime created_at
        datetime expires_at
        string status
    }
    REPORT_RATE_BUCKETS {
        string id PK
        int count
        datetime expires_at
    }
    REPORT_AUDIT {
        int id PK
        string report_id
        string action
        datetime at
    }
    REPORT_RUNTIME {
        int id PK
        string epoch
    }
    ASK_BUDGET_BUCKETS {
        string id PK
        int count
        datetime expires_at
    }
```

This diagram selects relevant fields, not the complete schema. Source snapshots also retain fetched source evidence. `REPORT_AUDIT.report_id` is deliberately not drawn as a foreign-key relationship: a withdrawal deletes the observation while retaining an opaque receipt hash to reject delayed resubmission.

Client storage holds preferences/onboarding, existing showcase/local activity, previously received seismic data, a per-API installation token and at most one pending structured submission. Server reports accept only a selected supported corregimiento, electricity/water and interruption/restored. No free text, names, exact coordinates or raw client IP is stored in report records. IP budgets use a keyed hash.

Active observations expire two hours after `observed_at`, not two hours after a delayed retry. New observations older than two hours or more than five minutes in the future are rejected. A new observation supersedes that installation's previous active observation for the same area/service. Public counts require at least three installation identities and remain `community_unverified` with `service_state=unknown`; they do not establish three distinct humans or official confirmation. Withdrawal removes the observation immediately. Report/audit retention is seven days, while expired rate buckets are purged on their own expiry. The worker runs cleanup; an operator can hide a report or purge through the CLI.

## 5. Report submission and recovery

```mermaid
sequenceDiagram
    participant UI as Native or browser UI
    participant Local as Installation storage
    participant API as FastAPI reports
    participant DB as SQLite transaction
    UI->>API: GET current report epoch and server time
    API-->>UI: Configuration
    UI->>Local: Persist token, UUID, epoch and observed_at
    UI->>API: POST structured observation with token
    API->>DB: Check epoch, owner/request, observation age and limits
    alt Existing matching request
        DB-->>API: Original receipt
    else New permitted request
        API->>DB: Supersede old observation, insert report and audit
        DB-->>API: Committed receipt
    else Expired epoch/observation, withdrawn request or rate limit
        API-->>UI: Explicit 410 or 429, no new report
    end
    API-->>UI: Confirmed receipt on success
    UI->>Local: Clear pending request only after confirmation
    Note over UI,Local: Network failure preserves UUID, epoch and observed_at for retry.
    UI->>API: DELETE own report
    API->>DB: Remove observation and record withdrawal tombstone
    API-->>UI: Confirm withdrawal
```

The pending request is not a published report and never appears as successful solely because it was saved locally. Within the same recovery epoch, retrying the same owner/UUID and identical observation returns the original retained receipt; conflicting content or observation time returns 409. A retained withdrawal tombstone returns 410 and prevents a delayed retry from recreating the deleted observation. A changed recovery epoch also returns 410, so an old pending request cannot survive a database restore. An expired observation is rejected even after its older receipt has been purged. Rate windows persist across API restarts: six submissions per installation/hour, thirty per hashed IP/hour, and two thousand globally/day. This limits abuse but is not identity verification.

## 6. Provenance, freshness and assistant behavior

```mermaid
flowchart TD
    Input["Candidate information"] --> Kind{"Provenance?"}
    Kind -- Official --> Valid{"Valid source contract?"}
    Valid -- Yes --> Fresh{"Source currently fresh?"}
    Fresh -- Yes --> Current["Official: source and time"]
    Fresh -- No --> Stale["Stale: preserve original time"]
    Valid -- No --> Unknown["Unavailable or last verified stale data"]
    Kind -- Community --> Community["Unverified coarse aggregate"]
    Kind -- "Missing / error" --> Unknown
    Kind -- "Showcase only" --> Demo["Persistent preview attribution"]
    Current --> Display["Consistent source policy in Home, Services and Ask"]
    Stale --> Display
    Community --> Display
    Unknown --> Display
    Demo --> Display
```

A scheduled interruption does not confirm an outage; an empty schedule does not confirm power is on. An expired OAF uses its original forecast windows and historical wording. Refresh failure must not leave a current-looking cached badge. Report absence never means normal service.

Ask first attempts a supported deterministic response grounded in app data. Optional server transport is offered through capabilities, uses selected-area context and reads the same database through bounded tools. There is no write tool and no model authority to invent restoration times, earthquake warnings or vehicle ETAs. The older artifact transport is retained for its explicit runtime; it is not a deployed beta dependency. Durable model-request budgets use keyed client hashes, minute/day windows and a global UTC-day window. Missing budget configuration or a restore guard returns 503; exhausted budgets return 429. Provider/model verification and an external monetary cap remain operational gates before enabling paid model chat.

```mermaid
stateDiagram-v2
    [*] --> Starting
    Starting --> Current: Valid fresh API response
    Starting --> Stale: Previously received verified data exists
    Starting --> Unavailable: No trustworthy saved data
    Current --> Stale: Fetch fails or freshness expires
    Stale --> Current: Valid fresh response
    Unavailable --> Current: Valid fresh response
    Unavailable --> Stale: Valid but historical API response
    Stale --> Unavailable: Saved data fails validation
    note right of Stale
      Keep original source timestamps.
      Connected mode never imports bundled examples.
    end note
```

## 7. Operations and source-only recovery

```mermaid
flowchart TD
    Migration["init-db: create missing tables"] --> API["Single API process"]
    Migration --> Worker["Single collector and retention worker"]
    API --> Live["Durable SQLite volume"]
    Worker --> Live
    Live --> Memory["Consistent SQLite backup in memory"]
    Memory --> Filter["Remove community, runtime and private budgets; vacuum"]
    Filter --> Verify["Integrity, foreign keys and source-only checks"]
    Verify --> Backup["Owner-only, no-clobber source snapshot"]
    Backup --> Restore["Verify and restore to a new database path"]
    Restore --> Epoch["New report epoch rejects old pending requests"]
    Restore --> Guard["Paid requests blocked until next UTC day"]
    Epoch --> Review["Operator recovery verification"]
    Guard --> Review
```

The backup deliberately excludes observations, ownership hashes, report epochs, rate budgets and withdrawal tombstones. It cannot import withdrawn observations and intentionally loses submission history. A new runtime epoch rejects pre-recovery pending reports. Restore inserts an anonymous paid-request guard through the next UTC-day boundary so restoring cannot grant a second daily model allowance. Report rate windows restart empty, so the operator should verify recovery before re-enabling reports. It is not a complete private-user-data backup. The filtering copy is in memory, so the host needs sufficient RAM. Restore never overwrites an active database. Future column changes need versioned migrations; `init-db` is table creation, not a full migration system.

Production topology, when later approved, uses HTTPS, a trusted reverse proxy, an exact web CORS origin and a durable volume. Static hosting serves Expo's web export; it cannot replace the API/collector host. No service worker is installed to cache API results. See the runbook for backup, rollback, proxy trust and verification commands.

## 8. Repository verification and external release gates

```mermaid
flowchart TD
    Change["Reviewed source change"] --> Unit["Backend tests and source regressions"]
    Change --> Types["TypeScript and Expo export"]
    Change --> HTTP["Connected browser HTTP lifecycle and retry"]
    Change --> Image["Container build and migrated readiness"]
    Unit --> Review["Owner repository review with evidence"]
    Types --> Review
    HTTP --> Review
    Image --> Review
    Review --> Decision{"Approve deployment testing?"}
    Decision -- No --> Fix["Targeted repository fixes"]
    Fix --> Change
    Decision -- Yes --> External["Staging HTTPS, device install, accessibility and recovery tests"]
    External --> Gate{"All external acceptance gates pass?"}
    Gate -- No --> Fix
    Gate -- Yes --> Beta["Approved controlled beta distribution"]
```

CI configuration covers backend fixture/privacy/recovery tests, TypeScript, deterministic source/local-state regressions, real HTTP browser report flows, and container readiness. Tests use isolated data. Green fixture tests are not proof of upstream availability, and local web screenshots are not native or mobile Safari evidence. Record the exact commit and CI run in the audit.

Repository-implemented code, locally exercised real source collectors and browser checks are distinct from outstanding public HTTPS verification, signed installation, actual-device accessibility, provider/model acceptance and operator recovery exercises. The current instruction is to finish the repository first; diagrams do not authorize deployment or assert that beta distribution is ready.

## Maintenance contract

1. Update these existing Mermaid blocks alongside changes to navigation, endpoints, schema, source policy or recovery.
2. Keep implementation, observed test evidence and external acceptance gates distinct.
3. Validate Mermaid syntax and local documentation links before review.
4. Verify diagrams against `src/state/AppContext.tsx`, `src/data/community.ts`, `src/navigation/`, `backend/panapulse/` and the CI workflow before generating code from them.
