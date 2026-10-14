# PanaPulse | Technical Architecture & Product Flows

**Baseline:** October 14, 2026  
**Status:** Living documentation based on `main`, not a Beta 1 release declaration.  
**Sources:** `README.md`, `docs/FEATURE_COMPLETE_HANDOFF.md`, `docs/BETA1_READINESS.md`, `docs/DATA_SOURCES.md`, `backend/README.md`.

These diagrams intentionally distinguish implemented code, validated live operation, local-only data, fictional previews and deferred services. Check the referenced source files before relying on a diagram for implementation details.

## 1. System architecture

```mermaid
flowchart LR
    User["Panama City resident"] --> Expo["Expo SDK 57 / React Native app"]
    Expo --> Storage["Local app state / AsyncStorage"]
    Expo --> Feed["USGS events + OAF: native fetch / snapshot fallback"]
    Expo -. "configured runtime only" .-> API["FastAPI /v0/ask"]
    API --> DB["Backend source DB"]
    API -. "configured" .-> Claude["Claude Haiku"]
    USGS["USGS official API"] --> Collector["Python USGS ingest CLI"]
    Collector --> DB
    Preview["Fictional guided preview"] --> Expo
    Utility["Utility / transit sources"] -. "not fully validated/connected" .-> Future["Deferred collectors"]
```

**Current boundaries:** The app uses Porcelana branding, Manrope, ES/EN, Auto/Light/Dark, four-tab in-app navigation and typed persisted local data. USGS observations are not earthquake early warning. The Python backend and optional chat runtime exist in code, but this does not establish operational deployment. Reports are device-local, not a public feed. IDAAN, Metro and MiBus real-time integrations are not connected. Scheduled utility notices do not prove current outages. Preserve `DESIGN.md`, `docs/BRAND.md`, `src/theme/tokens.ts`.

## 2. Navigation and user journeys

```mermaid
flowchart TD
    Start["Launch"] --> Check{"Onboarding complete?"}
    Check -- No --> Onboard["Choose area / language / appearance"]
    Onboard --> Home
    Check -- Yes --> Home["Home"]
    Home <--> Services["Services"]
    Home <--> Mobility["Mobility"]
    Home <--> Reports["Reports"]
    Home --> Quakes["Quakes and detail"]
    Home --> Chat["Ask PanaPulse"]
    Home --> Settings["Settings"]
    Services --> Notice["Notice details / official link"]
    Mobility --> Commute["Choose and save commute"]
    Reports --> ReportDetail["Local report detail"]
    Reports --> Create["Create device-local report"]
    Settings --> Clear["Confirm clearing local activity"]
```

This is a conceptual flow, not a claim that every destination is a root navigation tab. Actual entry points and back behavior live in `src/App.tsx` and `src/screens/`.

## 3. Conceptual local data model

```mermaid
erDiagram
    APP_PREFERENCES ||--o| ONBOARDING : includes
    APP_PREFERENCES ||--o| SAVED_COMMUTE : stores
    APP_PREFERENCES ||--o{ LOCAL_REPORT : retains
    APP_PREFERENCES ||--o{ CHAT_TURN : retains
    APP_PREFERENCES {
        string selected_area
        string language
        string appearance
        int storage_version
    }
    ONBOARDING {
        boolean completed
    }
    SAVED_COMMUTE {
        string origin
        string destination
        string preferred_route
    }
    LOCAL_REPORT {
        string category
        string area
        string created_at
        string origin_label
    }
    CHAT_TURN {
        string role
        string content
        string created_at
        string scenario_attribution
    }
```

**Conceptual only:** These are product entities, not verbatim interfaces, SQL tables or guaranteed cardinalities. See `src/data/localModel.ts` and `src/state/AppContext.tsx` for actual persisted types, migrations and reducers.

## 4. Provenance and freshness policy

```mermaid
flowchart TD
    Data["Candidate information"] --> Origin{"Provenance?"}
    Origin -- "Official" --> Valid{"Valid schema and source?"}
    Valid -- No --> Unknown["UNKNOWN: do not assert status"]
    Valid -- Yes --> Fresh{"Current for that source?"}
    Fresh -- Yes --> Current["CURRENT OFFICIAL: show source + time"]
    Fresh -- No --> Stale["STALE OFFICIAL: keep original time"]
    Origin -- "User's own report" --> Local["LOCAL: on this device only"]
    Origin -- "Example" --> Demo["PREVIEW: fictional"]
    Origin -- "Missing or error" --> Unknown
    Current --> Selector["Shared presentation precedence"]
    Stale --> Selector
    Local --> Selector
    Demo --> Selector
    Unknown --> Selector
    Selector --> UI["Home / Services / Ask"]
```

A genuine current or stale official notice must not be hidden by simulated utility incidents. An announced maintenance window is not confirmation of an outage. An empty feed or failed fetch never means “all clear.” Never infer earthquake warnings, historical OAF probabilities for the present, or live vehicle ETAs. Source-specific freshness rules must come from actual code and provider contracts.

## 5. Assistant request sequence

```mermaid
sequenceDiagram
    actor User
    participant UI as Ask PanaPulse
    participant State as Local area/scenario/source state
    participant API as Optional FastAPI /v0/ask
    participant DB as Read-only source tools / DB
    participant LLM as Optional Claude Haiku
    User->>UI: Ask a question
    UI->>State: Read app context
    alt Supported deterministic local response
        State-->>UI: Grounded response
    else Backend configured and reachable
        UI->>API: Bounded request
        API->>DB: Query allowed app data
        DB-->>API: Sourced facts
        API->>LLM: Restrained prompt + tool facts
        LLM-->>API: Answer
        API-->>UI: Answer and source context
    else Offline or no configured runtime
        UI-->>User: Local information or honest limitation
    end
    UI-->>User: Render response with provenance
```

These are supported/intended paths, not proof that the optional server is live. The README describes four read-only tools and request limits for configured backend chat.

## 6. Offline and recovery states

```mermaid
stateDiagram-v2
    [*] --> Starting
    Starting --> Live: Verified fresh response
    Starting --> Snapshot: Last-known or bundled source exists
    Starting --> Unknown: No trustworthy data
    Live --> Snapshot: Refresh fails, last-good data exists
    Live --> Live: Verified newer response
    Snapshot --> Live: Fetch succeeds
    Snapshot --> Unknown: Snapshot unusable for claim
    Unknown --> Live: Verified fetch succeeds
    Unknown --> Snapshot: Timestamped source recovered
    note right of Snapshot
      Display original source time.
      Never silently mark it fresh.
    end note
    note right of Unknown
      No source is not an all-clear.
    end note
```

## 7. Release / verification lifecycle

```mermaid
flowchart TD
    Feature["Local app feature milestone"] --> CI["Integrated main + green CI"]
    CI --> Visual["Porcelana visual QA: ES/EN, themes, 360/393/412dp"]
    Visual --> Access["Accessibility: 200% text, touch, motion, back"]
    Access --> Resilience["Persistence, offline and error recovery"]
    Resilience --> Trust["Real / stale / local / preview consistency"]
    Trust --> Device["Android native device verification"]
    Device --> Evidence["Save evidence and obtain owner acceptance"]
    Evidence --> Gate{"Beta 1 GO / NO-GO?"}
    Gate -- NO-GO --> Fix["Targeted fixes and repeat tests"]
    Fix --> CI
    Gate -- GO --> Controlled["Future controlled tester distribution"]
```

**Current priority:** local UX and evidence first. No APK/signing, public API hosting, new collectors, monetization or production release is authorized by this documentation.

## Maintenance contract

1. Update Mermaid diagrams in the same PR as a material navigation, schema, source precedence or release-gate change.
2. Clearly differentiate implemented, end-to-end verified, local, simulated and planned.
3. Keep diagrams as text in Markdown to support GitHub rendering and diff reviews.
4. Verify against `src/data/localModel.ts`, `src/state/AppContext.tsx`, `src/screens/`, and `backend/` before using diagrams to generate code.
5. Reconcile this baseline against Claude's subsequent UI changes after they merge.
