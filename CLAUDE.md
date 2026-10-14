# ACTIVE PRIORITY: App feature completeness (before APK/API)
Read docs/FEATURE_COMPLETE_HANDOFF.md before making changes. The owner explicitly deferred EAS/APK builds, backend scraping and hosting. Preserve Porcelana and finish app flows/UX with measured ES/EN visual verification. Don't claim native QA when only browser tests exist.

# PanaPulse implementation rules

**Beta 1 handoff is binding for continuing work:** read CLAUDE_HANDOFF_BETA1.md, design/ART_DIRECTION_BETA1.md and docs/BETA1_READINESS.md *before* starting design or readiness changes. The default TasteSkill v2 is marketing/web-oriented and must not overwrite the native Porcelana brand.

Read `DESIGN.md`, `docs/BRAND.md`, `src/theme/tokens.ts`, `docs/ANTISLOP-RN.md` and `docs/DATA_SOURCES.md` before changing the interface.

- Keep Expo/React Native native surfaces, both language options, and Auto/Light/Dark intact.
- Do not convert screens to WebViews or abandon the approved v0.2 atmospheric design.
- Preserve the separate status dimensions of operational state, verification and freshness.
- Never fabricate real-world status information, quake probabilities, commute durations or bus ETAs. In interactive preview, clearly scoped fictional local service/transit scenarios are allowed, but never passed off as real provider data.
- In live mode, every data card must surface its provenance and timestamps; snapshot times stay explicit. In preview, ONE persistent global preview indicator covers the fictional service scenario, while true USGS records retain their own genuine timestamps and source.
- Chat tools are read-only and mirrored in `src/chat/tools.ts` and `backend/panapulse/ask.py`. When preview is ON, quick chat answers use the shared dynamic scenario; genuine earthquake answers continue using USGS, never simulated data.
- Changes should be small, reviewable and backed by Python tests and a TS check.
- Brand palette is "Porcelana" (`docs/BRAND.md`). Colors come only from `src/theme/tokens.ts`; no hex literals in components. Token, logo, nav, type or background changes need explicit approval.
- The user's DESIGN.md overrides third-party aesthetic prohibitions. `no-slop-ui` in docs is inactive.
- Do not commit API keys, `.env` or user location/report data.

Use `npm run typecheck` after dependencies are installed and `python -m pytest backend/tests -q` for Python tests. For SDK 57 / TypeScript 6 stack issues use `node --stack-size=8000 node_modules/typescript/bin/tsc --noEmit`.
