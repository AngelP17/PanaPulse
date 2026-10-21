# PanaPulse Feature Complete: local app milestone (2026-10-13)

> **Historical milestone, superseded scope (October 21, 2026):** The local-only/deferred-backend scope below records earlier owner decisions. The current request is to finish and verify the connected native + desktop/mobile web application in the repository, then let the owner review before deployment. Shared structured reports, backend collectors and connected web are now implemented in the review branch. See the [connected audit](CONNECTED_BETA_AUDIT.md), [current architecture](architecture/PANAPULSE_TECHNICAL_ARCHITECTURE.md), and [operations runbook](CONNECTED_BETA_RUNBOOK.md) for current status. Historical completion statements are not fresh CI, public-service or native-device evidence. Preserve all still-applicable design and data-integrity requirements.


This milestone is **application functionality**, not a Beta 1 APK release, not an API launch and not a claim that all Panama services are live.

## What was merged, in order

| PR | Feature | Source of truth |
|---|---|---|
| #13 | Shared typed and persisted local state, v1 migration, area, saved commute, report storage, chat history | `src/data/localModel.ts`, `src/state/AppContext.tsx` |
| #14 | Reports activity, filters, tap-through detail, deletion, preview/device origin labels | `src/screens/Report.tsx` |
| #15 | Selectable preview journey origin/destination/mode, stored chosen route and Home sync | `src/screens/DemoScreens.tsx`, `Commute` |
| #16 | First launch onboarding: area, language and appearance, persistent completion | `src/screens/Onboarding.tsx`, `src/App.tsx` |
| #17 | Local service notices with drill-down and stale-official precedence | `src/data/previewNotices.ts`, `src/screens/Services.tsx` |
| #18 | Stored assistant answer timestamps and scenario attribution, scenario-specific suggestions | `src/screens/Chat.tsx`, `ChatTurn` |
| #19 | Clear local report/chat/commute activity with explicit confirmation | `src/screens/Settings.tsx`, `localModel.reduce` |

## Nonnegotiable factual boundaries

- USGS observations and official forecast issue times remain authentic. The app does not provide earthquake early warning.
- Electricity planned maintenance is **not** a guarantee of actual power status. Current and stale source notices have priority; unknown stays unknown.
- Preview mobility, utility and neighborhood examples are **fictional, clearly scoped product demonstrations**, not official Metro/MiBus/IDAAN or real neighborhood reports.
- Report creation is local to this phone. No real multi-user public feed exists.
- Built-in deterministic chat can answer known scenario and source questions; standalone unlimited free-form AI is not provided without a supported runtime.
- The approved Porcelana/Hark-quality brand and four-tab navigation remain unchanged.

## Application QA still REQUIRED before a Feature Complete sign-off

1. Capture physical or reliable simulator/native screens, ES+EN, light+dark+auto, 360/393/412dp and 200% text.
2. **Fresh install:** onboarding, selected area, language and theme persist after restart. Existing v1 storage migrates and skips onboarding.
3. **Mobility:** update origin, destination, preferred route, and save/remove. Return to Home; values agree and persist across restart.
4. **Reports:** filters and detail view work; create/delete a local preview report; ensure preview content never shows as a real public report or leaks into live-mode feed.
5. **Services:** switch three preview scenarios, open each electricity/water notice detail, back to list; stale authentic power remains visible if present.
6. **Ask:** chat suggestions change for preview; old answers display their creation date and scenario; old forecast data isn't presented as current.
7. **Sismos:** filter, detail sheet, real USGS source, archived forecast issue and period labels; no fake all-clear or red PAGER state.
8. **Settings:** clear activity requires confirmation and preserves area, language, appearance and onboarding; reports/chat/saved route disappear.
9. Test offline and error states, bottom navigation, keyboard avoidance, no clipped CTAs, 44pt touch targets and Reduce Motion.
10. Run GitHub CI TypeScript + all regression scripts + backend fixture tests after merging.

## Explicitly deferred by product owner

Do **NOT** spend more time on EAS/APK creation, Android signing, API hosting, Python collectors, live IDAAN/Metro/MiBus ingestion or monetization until the app's local UX is accepted. Keep existing configurations intact but frozen.

If asked to “finish the app,” optimize usable screens, state coherence, evidence and accessibility first. Never substitute a web mockup or APK as proof of actual feature completeness.

## Next agent handoff, exact brief

> Inspect current GitHub main (not a stale SHA), read DESIGN.md, docs/BRAND.md, design/ART_DIRECTION_BETA1.md, this document and CLAUDE_HANDOFF_BETA1.md. The local app feature flow has merged through PR #19. Run an end-to-end app UX audit, fix reproducible dead buttons, clipping, navigation, empty states and persistence bugs with minimal targeted commits. Capture before/after ES/EN and light/dark screenshots and run CI. Do not redesign Porcelana, launch an APK, configure EAS, add an API or publicly release. Report test evidence honestly; don't call device QA complete from browser renders alone.

## October 14 continuation: Beta 1 app-first closure order

**Current implementation:** PRs #13–#19 merged. PR #20 is an open design-reference study, not a code/UI change. This audit's first small app change enlarges the preview badge tap target from 30pt to 44pt. That is a source-level improvement, not native-device validation.

**Do these in order, creating focused PRs rather than another broad planning-only PR:**

1. **P0 native walkthrough and screen inventory:** Run Expo on Android device/emulator or reliable native simulator, compare Home, Sismos, Mobility, Services, Reports, Ask, Settings, onboarding. Capture ES/EN × light/dark/auto and 360/393/412dp + 200% font screenshots. Record any broken tap, clipping or navigation issue with steps, screenshot, device and expected/actual behavior.
2. **P0 integrity/regression:** Test full preview scenario switching, authentic USGS event/source timestamps, real scheduled notice precedence vs fictional power/water examples, local report labeling, saved route synchronization, reset confirmations, and stale/offline source treatment. Verify restart/migration persistence and missing-data handling.
3. **P1 premium polish implementation:** Use PR #20's linked reference sites as discovery inputs. Make an original **Home-first** UX adjustment to hierarchy, spacing and component affordances using existing Porcelana tokens. No logo/nav/type palette or background changes without owner approval. Include true before/after renders and tests; no glowing meters, speculative service status or web-only CSS imitation.
4. **P0 acceptance:** Run the repository TypeScript, backend fixture and all available regression checks on integrated code; repeat native smoke tests, accessibility checks and Reduce Motion. Archive real evidence and known limitations. Green CI alone is insufficient.
5. **Release authorization:** Once the owner accepts local UX, explicitly ask to reopen internal Android build/distribution work. Only then produce a signed internal beta and test install/cold start; connected API, real crowdsourcing, MiBus ETA, and broad public launch remain deferred.

**Truthful completion criteria:** Application UX is accepted only when evidence exists for the above. This document should be updated with actual screenshots, test outputs, device details and remaining blocker tickets, not a guessed completion percentage.
