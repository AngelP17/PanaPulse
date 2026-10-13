# PanaPulse Beta 1 readiness / release gates
Date: 2026-10-13. Owner review required. This document is a release checklist, **not an assertion that the app is ready**.

## What exists on main, as inspected October 13

| Product area | Implemented | Verification / caveat |
|---|---|---|
| Expo SDK 57 / React Native app, PanaPulse branding, native four-tab navigation | Yes | Android + iOS physical screenshots not yet accepted |
| Porcelana Light/Dark/Auto and ES/EN | Yes | 200% accessibility text and device rotation/OS variation pending |
| USGS event ingestion and OAF forecast | Yes, client and Python adapter | Native live fetch + fallback, browser/artifact may use stale snapshot; never an early warning system |
| Earthquake catalog / detail sheet | Yes | Premium filtering pass proposed in separate PR; date labels must remain factual |
| Anonymous community report server / moderation | **No** | Main stores user reports locally. PR #8 proposes a fictional preview feed and better local display, not production crowdsourcing |
| Electricity planned maintenance adapter + API | Code exists | Operational poll/deploy, legal reuse and source accuracy not verified end-to-end; does not establish live service state |
| IDAAN / Metro official incident ingestion | **Not connected** | Needs permitted notice/feed collector, normalization, monitoring |
| MiBus live arrivals | **Not connected** | Needs authorized GTFS-RT/prediction access; preview counts are fiction |
| Ask PanaPulse | Deterministic answers + Claude Artifact sample + server endpoint | Source precedence & privacy need physical/live verification; AI provider API paid outside hosted artifact |
| Dynamic product walkthrough | Yes | Separate it unambiguously from real telemetry; one persistent indicator |
| Production push alerts, accounts, backend-published reports | **No** | Out of Beta 1 scope unless explicitly designed/tested |

## P0: must be done BEFORE inviting external testers

1. **Review/merge outstanding PRs thoughtfully:** PR #8 anonymous report UI / power-chat precedence and PR #9 first-live-data pilot. They are separate and may have new CI statuses/conflicts at review time. Do not blindly cherry-pick. Re-run all tests on integrated main.
2. **Validate live upstream sources from a machine with internet**, not CI fixtures: USGS, ENSA, Naturgy independently; log last success, parser errors, source revisions, response time and real page URL. The existing scheduled-maintenance backend is not proof of working power. Have the two utilities mapped to the correct area/provider.
3. **Serve an actual HTTPS API** with a persistent database, pinned environment, scheduled collector worker, source timeout, retry/backoff and per-source health endpoint. A phone-local LAN smoke test comes before public hosting. No anonymous public API endpoint with unbounded crawling or LLM costs.
4. **Separation of operational state, freshness and verification.** Real source with old timestamp is STALE, errors are UNKNOWN, community anecdotes are COMMUNITY, simulation is PREVIEW. No real-world fake ETAs, blanket 'operating normally' or future-tense archived forecasts.
5. **Test Android physical device** in Panama using native Expo/preview build. Verify network permission, LAN/HTTPS origin, app lifecycle resume, font scaling, gesture navigation, bottom insets, keyboard, deep links and sheets.
6. **Decide privacy before community sharing.** If no server, label real reports 'saved on this device only'. If a shared beta report backend is added: nonidentifying pseudonyms, coarse corregimiento only, no exact coords, contact info scrubbing, report expiry, abuse throttling, moderation, deletion pathway, retention policy, nonrepudiation. Don't advertise public anonymous reporting when submissions aren't published.
7. **Add operational diagnostics**: consent-aware error reporting, health checks, bounded log volume, data timestamp/scope telemetry, source contract failure alerts, tested source-down UI. Keep credentials/PII outside logs.
8. **Add Spanish and English privacy/terms/beta disclaimers**, and distinguish USGS observational monitoring from earthquake early warning. Confirm provider data usage rights, brand/title clearance, and source-specific copyright/reuse limits.
9. **Perform device-accessibility QA**: text up to 200%, screen reader labels, 44+pt targets, Reduce Motion, color contrast and left/right system gesture interactions.
10. **Build through supported EAS testing distribution**, sign Android development/internal test build, test install on device without Expo Go and clean cold start. iOS TestFlight only after provisioning; no unreviewed store/public listing.

## P1: sensible Beta 1 scope after P0

- One region (Ciudad de Panamá, manual corregimiento selector if implemented; until then explicitly state fixed Pueblo Nuevo).
- True USGS catalog, authoritative *scheduled* utility notices where collector is verified, historical timestamps, source links.
- Metro/MiBus and IDAAN operator notice links, permitted validated event notices when available. 'Unavailable' for true unknowns; not a fake live ETA.
- Interactive preview with coherent scenarios, save/remove commute, anonymous example cards, and scenario-consistent chat.
- User reports on device clearly labeled local; real anonymous aggregated feed only after a supported backend exists.
- No ads, premium accounts, or broad notifications in the first external test.

## P2: after Beta 1

- Licensed MiBus GTFS-RT/vehicle ETA, authorized Metro service events, IDAAN event normalization, push subscription management, background sync, real authenticated reporting + abuse review, saved-location user preferences, monetization.
- Avoid scraping per app visitor or per chat message. Fetch once in the backend, deduplicate, validate and serve many.

## Acceptance scenarios with expected result

| Scenario | Expected behavior |
|---|---|
| Actual USGS + online | Same genuine magnitude, location, date, event ID as original USGS; tapping opens details and USGS link |
| USGS offline for hours | Last-known sourced snapshot marked stale with original timestamp; no 'all clear' |
| Archived USGS OAF | Historical first-day/week/month periods labeled as such, not future forecasts |
| Naturgy/ENSA published scheduled notice | Valid place, start/end, source and last checked; does not claim there is a current outage or that electricity is on |
| Scheduled data source timeout | Stale/unknown with source name/error; never '0 outages' |
| Preview enabled with an incident | Same story across Home/Services/Mobility/Reports/Ask. Preview indicator persistent and reachable |
| Preview disabled | No synthetic transport times or utility incidents |
| User submitted local report | Stored/displayed locally only; not misleadingly included in public neighbors count |
| Device offline / API down | Explain last successful data and allow navigation to existing screen content |
| Screen reader 200% scale | Major headings, filter chips, CTA and bottom nav operable without clipping |
| Server unexpected payload | Reject invalid schema, preserve last known records, log parser/schema failure |

## Beta 1 pass/fail rule

**GO** only when P0 evidence (screenshots, reproducible device build, source fetch logs, incident/state verification, privacy copy, integrated CI and rollback plan) is stored under docs/beta1/evidence/ or linked in a release PR. **NO-GO** if a current real incident can be confused with a simulation, if reported outages can be forged as official or if the app cannot distinguish stale from live data.

No 'fully functional, live for all of Panama' marketing until the corresponding licensed source connections actually exist.
