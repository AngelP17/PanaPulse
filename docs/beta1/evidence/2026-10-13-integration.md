# Beta 1 integration evidence, 2026-10-13

Branch: `integration/beta1` (main a635fb4 + PR #10 + PR #8 + PR #9 + two fixes). Environment: cloud sandbox, WEB build only.

## Integration sequence (all three merged textually clean, none overwritten)
1. PR #10 `feat/beta1-premium-seismic-polish`: Sismos chapters, ALL/M5+/M6+ filters, Mobility real-state card, Beta 1 docs.
2. PR #8 `fix/chat-official-power-precedence`: anonymous neighborhood cards (preview only), official power notices in Ask, honest local report copy.
3. PR #9 `feat/live-pilot-runbook`: `scripts/first-live-test.sh`, Android LAN runbook, CI syntax check.

## Fixes made on top
- **Shared power selector.** Home, Services and Ask all decide through `powerSurfaceSource` (src/data/sourcePolicy.ts). A real current or stale notice always wins over a preview scenario; the preview example fills only a missing feed. Ask previously duplicated that logic. Test: `scripts/test-preview-flow.cjs` checks the three states in preview on and off.
- **Clipped scenario pills.** "Recuperación" was cut off at 360 and 393 px (horizontal scroller). Pills now wrap. No token, type or nav change.
- Added `eas.json` with an internal Android `preview` profile (APK). Not built: needs your Expo login.

## Test results
```
tsc --noEmit: pass
Official maintenance beats preview incidents; stale and unavailable source states stay distinct.
Seismic selection: deterministic filters and source integrity pass.
Source-first precedence: 6 combinations passed.
30 passed, 1 warning in 4.69s
```

## Screenshots (WEB only, Chromium, identical conditions per pair)
`design/review/beta1/side-by-side/` (before = main a635fb4, after = this branch). Matrix captured: 393 light+dark ES preview off; 393 light ES preview on; 393 dark ES preview on; 360 light ES preview on; 360/412 light EN preview off. Not captured: 200% text, reduced motion, keyboard open, long place names, offline, Auto theme switching.
Findings: Sismos and Mobility changes read well; Home and Services in live mode are unchanged by these PRs (no change justified: adding a second "no data" water card would repeat the problem the design rules forbid).

## Live source check: NOT VERIFIED
`scripts/first-live-test.sh` run from the sandbox: USGS, ENSA and Naturgy all failed with `ProxyError: 403 Forbidden` (sandbox egress allowlist). The script failed closed and recorded errors, no fabricated data. Must be re-run from a normal network.

## Beta 1 blocker checklist (open unless ticked)
- [ ] Run `first-live-test.sh` from a real network; confirm USGS, ENSA, Naturgy parse and map Pueblo Nuevo to the right provider
- [ ] Stable HTTPS backend with persistent DB, scheduled collector, health endpoint, rollback
- [ ] `eas build --profile preview --platform android` (needs your Expo account), install without Expo Go, cold start
- [ ] Physical Android screenshots: ES/EN, light/dark/auto, 200% text, gesture nav, keyboard, sheets
- [ ] Verify scheduled-notice accuracy against the live ENSA/Naturgy pages
- [ ] Reports: stay labeled local-only until a moderated backend exists
- [ ] Privacy, terms and "not an early-warning system" copy in ES/EN
- [ ] Remaining WEB gaps above (200% text, reduced motion, offline, long names)
- [ ] IDAAN, Metro and MiBus remain unconnected by design (links only)
- [ ] Per-source error reporting and diagnostics
- [x] Real-vs-preview power precedence consistent across Home, Services, Ask (tested)
- [x] USGS data stays real in preview; archived forecasts worded historically
