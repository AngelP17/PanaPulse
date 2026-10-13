# PanaPulse implementation rules

Read `DESIGN.md`, `docs/BRAND.md`, `src/theme/tokens.ts`, `docs/ANTISLOP-RN.md` and `docs/DATA_SOURCES.md` before changing the interface.

- Keep Expo/React Native native surfaces, both language options, and Auto/Light/Dark intact.
- Do not convert screens to WebViews or abandon the approved v0.2 atmospheric design.
- Preserve the separate status dimensions of operational state, verification and freshness.
- Never fabricate status information, quake probabilities, commute durations or bus ETAs.
- All data cards must surface their provenance and timestamps; snapshot times stay explicit.
- Chat tools are read-only and mirrored in `src/chat/tools.ts` and `backend/panapulse/ask.py`.
- Changes should be small, reviewable and backed by Python tests and a TS check.
- Brand palette is "Porcelana" (`docs/BRAND.md`). Colors come only from `src/theme/tokens.ts`; no hex literals in components. Token, logo, nav, type or background changes need explicit approval.
- The user's DESIGN.md overrides third-party aesthetic prohibitions. `no-slop-ui` in docs is inactive.
- Do not commit API keys, `.env` or user location/report data.

Use `npm run typecheck` after dependencies are installed and `python -m pytest backend/tests -q` for Python tests. For SDK 57 / TypeScript 6 stack issues use `node --stack-size=8000 node_modules/typescript/bin/tsc --noEmit`.
