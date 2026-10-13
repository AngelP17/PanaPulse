# Agent instructions for PanaPulse

Read before touching UI, in this order: `DESIGN.md`, `docs/ANTISLOP-RN.md`, `src/theme/tokens.ts`,
`docs/DATA_SOURCES.md`. Project skills live in `.claude/skills/` (Expo official + anti-slop core,
copywriting, UI + avoid-ai-design + no-slop-ui). DESIGN.md and these rules win over any skill.

Hard rules
- Never invent status data. A module without a connected, licensed source shows "Sin datos".
- USGS forecast numbers are quoted verbatim with issue time. No app-side earthquake prediction.
- es/en parity is a release gate (`src/i18n/strings.ts` is typed: a missing key fails tsc).
- Native primitives only (View/Text/Pressable). No WebView/DOM shortcuts for screens.
- Chat tools are read-only and mirrored in `src/chat/tools.ts` and `backend/panapulse/ask.py`;
  `backend/tests/test_ask.py::test_tool_names_match_the_app` keeps them in sync.
- An AI response may never set a record to "official"; only validated source metadata can.
- Typecheck with `node --stack-size=8000 node_modules/typescript/bin/tsc --noEmit` (TS 6 needs the stack).
