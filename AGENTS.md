# Codex agent instructions

This is the existing Expo SDK 57 + Python FastAPI PanaPulse project, not a rewrite request.

Read `DESIGN.md`, `docs/BRAND.md`, `src/theme/tokens.ts`, `docs/ANTISLOP-RN.md`, and `docs/DATA_SOURCES.md` before editing.

**Aesthetic:** Maintain the original premium atmospheric gradients and spacious cards. Brand palette is "Porcelana" (ink, porcelain, coral; see `docs/BRAND.md`). Navy/cyan is retired. Token, logo, nav, type and background changes need explicit approval. Do not copy Hark screens exactly or reduce the product to a generic flat utility dashboard. `no-slop-ui` is inactive reference only.

**Behavior:** Do not invent transit ETAs, outages, forecast numbers or service states. Missing data is unknown, never normal. Keep Spanish / English and light / dark / auto. Preserve USGS/OAF, cautious utilities adapters and read-only guarded chat.

**Delivery:** Work in small commits. Run `python -m pytest backend/tests -q`, `npm run typecheck` after npm ci, screenshot-check on Android/iOS, and document unverified third-party feeds.
