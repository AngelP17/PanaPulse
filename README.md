# PanaPulse v0.2

Spanish-first civic dashboard for Panama City. Expo SDK 57 (React Native 0.86), Android-first,
Hark-inspired design, ES/EN, Auto/Light/Dark.

## What's real
- **Sismos + pronóstico de réplicas:** USGS. Native builds fetch live every 5 min and fall back to the
  bundled snapshot (labeled with its real timestamp). Web builds use the snapshot.
- **Chat:** answers only from app data through 4 read-only tools. Native → backend `/v0/ask`
  (Claude Haiku 5.5). In the Claude artifact → the viewer's Claude via the `sample` capability.
- **Luz, agua, Metro, MiBus:** shown as "Sin datos" with the official channel. See `docs/DATA_SOURCES.md`.
- **¿Se fue solo a mí?:** saves reports on the device only (no report server yet).

## Run the app
```bash
npm install
npx expo start            # press a for Android, or scan with Expo Go
npm run export:web        # static web build in dist/
```
Point the app at your backend for chat: `EXPO_PUBLIC_API_URL=http://<your-lan-ip>:8000 npx expo start`

## Run the backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e '.[test]'
pytest                                   # 20 tests, no network or API key needed
python -m panapulse.cli ingest --verbose # live USGS + aftershock forecast
export ANTHROPIC_API_KEY=...             # only for /v0/ask
uvicorn panapulse.api:app --host 0.0.0.0 --port 8000
```
Chat env: `PANAPULSE_CHAT_MODEL` (default `claude-haiku-5-5`), `PANAPULSE_ASK_PER_MINUTE` (6),
`PANAPULSE_ASK_PER_DAY` (60), `PANAPULSE_ASK_GLOBAL_PER_DAY` (5000), `PANAPULSE_CORS_ORIGINS`.

### Chat guardrails
Model only sees tool output from PanaPulse's DB (no browsing) · system prompt restricts scope and
forbids predictions · 400-char input, 6-turn window · per-client and global daily limits · 4 tool
rounds max · 400 output tokens · prompt caching on system + tools. Haiku 5.5 is $0.10/M input,
$0.50/M output, so a typical answer costs well under a tenth of a cent.

## Design system
`DESIGN.md` (direction), `src/theme/tokens.ts` (values), `docs/ANTISLOP-RN.md` (RN rules),
`.claude/skills/` (vetted MIT skills: Expo official, anti-slop core/copy/UI, avoid-ai-design,
no-slop-ui). `scripts/fetch-reference-skills.sh` clones the reviewed-but-not-vendored ones.

## Notes
- Navigation is in-app state (Hark-style pill nav), not expo-router, so the same build runs in a
  sandboxed web frame. Android back closes the sheet, then returns Home.
- `node --stack-size=8000 node_modules/typescript/bin/tsc --noEmit` to typecheck (TS 6 stack quirk).
