# Feature Complete audit, 2026-10-13

Scope: application completeness only (no APK, EAS, backend, hosting). Method: code read of every screen and the state layer, plus the web renders captured in `design/review/beta1/`. Status key: DONE in this PR, NEXT (planned PR), OPEN.

## Cross-cutting
| Finding | Status |
|---|---|
| State was split across `useState`s, two storage keys and in-memory arrays; preview reports, chat, area, commute destination did not survive a restart | DONE (PR 1: one typed store, `panapulse.state.v2`, v1 migration) |
| "Pueblo Nuevo" hardcoded in ~12 places (screens, chat, 12 copy strings, example feed) | DONE (single `area`; copy uses `{area}`) |
| No onboarding exists | NEXT (PR 7); store already has `onboarded` (existing installs migrate as done) |
| No area/location preference UI | DONE (Settings area picker; moves the commute origin) |
| Reports stored in two places, preview text mixed with real-mode local reports | DONE (one list, `scope: preview \| device`; live mode shows only `device`) |
| Chat history lost on every navigation | DONE (persisted, capped at 30 turns, "Clear conversation") |

## Per screen
| Screen | Findings | Plan |
|---|---|---|
| Home | Live: no drill-down beyond tabs; stale hero fine. Preview: reports shown as a count, not content; commute card is static text | PR 5: purposeful sections with drill-down to a report detail and the commute; area-aware (done) |
| Mobility | Origin/destination are fixed strings; no route/stop exploration; save/remove is the only interaction; live mode is one card + preview CTA | PR 4: from/to pickers, route legs and stops, saved journey, scenario arrivals everywhere |
| Services | Preview: two example cards only, no notices, affected areas, timestamps or categories; live: honest but thin | PR 5: notice list grouped by provider/zone/date with detail view, scheduled vs confirmed outage |
| Reports | Feed rows are not tappable (no detail); no filtering; delete missing; local-vs-example not visually distinct in feed | PR 3: filter (service, area), detail view, delete (done), local badge |
| Ask | Suggestions static; answers carry no time (a persisted preview ETA can look current); no per-area suggestions | PR 6: contextual suggestions per tab/scenario, timestamped answers, deterministic fallbacks |
| Sismos | Filters, featured event, historical OAF wording in place | PR 8: responsive check, detail polish |
| Settings | No area (done), no clear-data control, preview controls duplicated with Home pills | PR 7: clear local data, grouped sections |
| Onboarding | Missing | PR 7 |

## Known gaps in this PR
- Mobility origin/destination are stored but not yet editable in the UI (PR 4).
- Persisted preview chat answers keep old ETAs; PR 6 adds timestamps.
- Web render and unit tests only; no native device checks (out of scope by instruction).
