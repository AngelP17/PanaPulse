# CLAUDE HANDOFF: PanaPulse premium Beta 1
Prepared 2026-10-13 as a binding implementation brief **after** the verified seismic visual pass.

## Start here: why this exists

Earlier automated redesigns accidentally removed the attractive Hark-inspired atmosphere, introduced generic flat navy/cyan dashboards, hid genuine USGS data behind fake full-screen quakes, repeated 'DEMO / SIN DATOS' everywhere, and made chat contradict official utility notices. **Do not repeat those regressions.**

Your objective is not 'make something modern'. It is to extend the existing Expo app to a coherent, polished Beta 1, with controlled Hark-level visual quality and a trustworthy service-data pipeline. Stop changing anything until you have read the files named below.

## Read in this strict order

1. DESIGN.md (approved visual contract).
2. docs/BRAND.md and src/theme/tokens.ts (Porcelana, P mark, semantic source colors).
3. design/ART_DIRECTION_BETA1.md (approved-inspired creative hierarchy; no Hark copying).
4. docs/BETA1_READINESS.md (release gates and demonstrated vs missing capabilities).
5. docs/DATA_SOURCES.md, docs/POWER_DATA.md and docs/DEMO_MODE.md (real vs stale vs preview contracts).
6. This handoff.
7. AGENTS.md, CLAUDE.md, existing Expo skills under .claude/skills and current GitHub PRs.
8. Inspect actual screens: src/screens/Home.tsx, PreviewHome.tsx, Quakes.tsx, Services.tsx, Mobility.tsx, Report.tsx, Chat.tsx and Settings.tsx. Read AppContext, maintenance/data adapters, i18n strings and current CI before modifying.

**Conflict precedence:** User-approved screen/UI behavior > DESIGN.md / BRAND.md / this explicit Beta 1 handoff > Expo-native framework and accessibility rules > TasteSkill opinions > other generic anti-slop skills. Data accuracy, privacy and safety are never optional.

## Current project baseline and outstanding work

- GitHub: https://github.com/AngelP17/PanaPulse
- At branch creation, main was a635fb4 (PR #7 merged); do not hardcode this SHA as the current remote head. Re-fetch before rebasing.
- This handoff branch: feat/beta1-premium-seismic-polish. Contains a real Seismic chapter improvement, magnitudes ALL/M5+/M6+, a genuine featured USGS record, correctly dated archived OAF windows and CI regression. Review visually before merge.
- **PR #8**: https://github.com/AngelP17/PanaPulse/pull/8. Anonymous report cards + official power schedules taking priority in chat. Must be reviewed/merged before claiming users can read other users' actual reports. Its preview stories are fictional until a real report backend exists.
- **PR #9**: https://github.com/AngelP17/PanaPulse/pull/9. Real collector smoke script + Android Expo LAN runbook. Must be actually executed against upstream sources; a green CI is only syntax/fixture proof.
- CI command: npm ci then node --stack-size=8000 node_modules/typescript/bin/tsc --noEmit; node scripts/test-source-policy.cjs, scripts/test-preview-flow.cjs and scripts/test-seismic-view.cjs; Python python -m pytest backend/tests -q.
- Note conflicts may occur when integrating #8 (PreviewHome/Services/Report/Chat). Resolve carefully against functional behavior and take screenshots; never discard one PR's features.

## TasteSkill integration, accurately scoped

The current source at https://github.com/Leonxlnx/taste-skill/skills/taste-skill/SKILL.md says design-taste-frontend v2 is **NOT for dashboards or app screens**, and its browser inspector rejects the Porcelana atmospheric gradient and cream/terracotta, which are APPROVED. Do not run the full v2 rule set against native PanaPulse screens.

For Claude Code (in a local checkout, not on a hosted Artifact), install only the applicable skill if missing:

  npx skills add https://github.com/Leonxlnx/taste-skill --skill "redesign-existing-projects"

For a future marketing site, the default v2 may be used with keep palette/type; use Node 22+ and Chrome. For mobile, consult redesign-existing-projects for scan→diagnose→targeted fix, consult Expo design/native/animation skills for implementation and audits. The 'high-end-visual-design' skill is optional inspiration and **must not** override Manrope, Lucide, gradients or nav. Do not run automatic rewrites or wholesale CSS transplant into React Native.

## Approved creative direction: A Living Neighborhood

- A premium consumer companion with a calm Porcelana day and midnight ember night, generous Manrope type, accurate source times, and connected-path P identity.
- Content composition resembles chapters, not tiles dumped onto a screen: Area → One Meaningful Signal → Essential Services → Your Journey → What Neighbors Report → Genuine USGS.
- Hark is a quality benchmark, NOT a component library to copy. Keep the four-tab PanaPulse native nav, brand mark and coral interaction token.
- Design with responsive type and deliberate card ratios; buttons actually navigate. No decorative coral vertical rules, generic hospital-grade dashboard, enterprise tables, fabricated source legend, massive warning block or five 'SIN DATOS' cards.
- Keep source/status semantics explicit in **live** mode and only one persistent preview pill in **preview** mode. Genuinely sourced seismic readings are always attributed even in preview.

## What the visual enhancement in THIS branch changes

Sismos was previously a dense aftershock table followed by equally-weighted event rows. It now:
1. Establishes source current vs archived at the screen's top.
2. Offers functional ALL/M5+/M6+ segmented-like pills, ≥44pt, keyboard/screenreader semantics.
3. Features one newest matching real USGS earthquake as the hero, with original place/time and detail action; no inferred danger tint from magnitude.
4. Separates OAF probability data into a lower chapter, with '**Day 1 / Week 1 / Month 1**' headings when archived, and real issue date. Historical data isn't a forecast for today.
5. Renders the rest as a date-sorted catalog without repeating the featured event, with usable hit targets, neutral magnitude tiles and empty-filter recovery.
6. Adds pure filter logic in src/data/seismicView.ts and a CLI regression test.
7. Adds ES/EN copy rather than hardcoding warning text.
It does **NOT** alter USGS fetches, model, backend schema, global palette, app logo, tabs or chat.

Validate the resulting screenshots. If a new layout is objectively worse, revert only that component on a separate branch, not the entire app or its data layer.

## Next focused premium enhancements (one PR per screen group)

**First, integration correctness.**
0. **Known P0 conflict:** current main's PreviewHome and preview Services may hide real current/stale power notices even though the standalone live Services screen is source-first. Do not treat PR #8's chat-only precedence as enough. Derive one shared visible source selection used by Home, Services AND Ask, with tests for real-current, real-stale, missing-in-preview and missing-in-live. Do not show preview power as an actual outage.
A. Merge and test PRs #8 and #9 with this branch through a separate integration PR; run all CI and re-check real source data. The power/preview/chat precedence must agree across Home and Ask.
B. Install applicable TasteSkill and run a written audit, but do not let random art directions discard Porcelana.

**Then visual work, in order:**
1. Home: Pair electricity/water as distinct service snippets with one meaningful story, not repeated 'Reportes' counts. Bring short anonymous cards into the community chapter from PR #8. Real USGS remains visible with original timestamp even if snapshot. One next action per module.
2. Mobility: Journey-based layout for preview with saved commute, stops and a plausible (labeled as preview by global pill) next arrival; real mode avoids invented ETA.
3. Servicios: Service notices grouped by provider/zone/date, with tap-through to source and an explicit difference between scheduled maintenance and a confirmed outage.
4. Reportes: Anonymous neighborhood cards show time, general corregimiento, message and category; never exact address, user identity or false official confirmation.
5. Preguntar: Answer from backend and live source facts when available; don't override a real power notice with simulated claims. Show messages/links and a compact source hint without walls of legalese.
6. Settings: Distinguish product settings, preview, sources and legal/privacy. Source health must remain real and not update from preview fixtures.

**Interaction/motion budget:** Existing 230ms screen fade and 330ms Porcelana theme crossfade; avoid adding complex animation systems. Honor OS Reduce Motion. Use stable tab navigation and >44pt target sizes.

## Hard DO NOTs

- Do not copy Hark design assets, navigation or its component geometry pixel-for-pixel.
- Do not replace P with an ECG icon, or redesign logo, palette, Manrope, mark/splash and bottom nav without explicit approval.
- Do not add cyan/navy, monochrome glass everywhere, pink/glow, a fresh serif, checkerboard gradient, or random card outlines as an aesthetic shortcut.
- Do not change to expo-router, WebViews, Next.js, a new navigation stack or unrelated database simply to satisfy a browser-centric design skill.
- Do not reintroduce fake earthquakes, invented OAF probabilities, wrong forecast windows, fake utility all-clear, or unauthorized transit live ETAs.
- Do not silently modify/merge another agent's open PRs, force push main, publish an Artifact, add billing or deploy a public service without approval.
- Do not promise Android/iOS QA on the basis of browser screenshots.
- Do not present local-only community reports as a live public social feed or expose contact details/exact addresses.
- Do not commit personal API keys, deployment secrets, phone numbers, location histories or source HTML with user data.

## Visual before/after acceptance protocol

1. Preserve CURRENT screenshots at identical device width/theme/language/scenario, before code changes. Save them under design/review/beta1/before.
2. Describe the visible issue, why it hurts user understanding and exactly which small component will change.
3. Change one section only. Run TypeScript and web render; take matching AFTER screenshots under design/review/beta1/after.
4. Inspect the pixels at 360, 393 and 412px, ES/EN, Light/Dark/Auto, 200% text, keyboard, source unavailable, snapshot stale, one real official notice, preview scenarios.
5. Confirm contrast, hero wraps, source captions, status chips, scrolling, safe areas, last card, sheets and accessibility labels. Fix failures then reshoot.
6. Android native Expo Go or internal build screenshots must be captured **before any Beta 1 release claim**; label WEB-only images as WEB.
7. Log exact screenshots, code paths, design decision, test evidence and remaining issues in the PR. User must approve global style changes.

## Beta 1 functionality acceptance

- Launchable installable Android internal build with a stable HTTPS backend and verified source-health, plus a clean rollback.
- Real USGS latest/archived/quakes/OAF states, no future-tense historic forecasts.
- Scheduled power notices validated against real upstream page, accurate provider + corregimiento and last-success date; do not claim actual service availability.
- IDAAN/Metro notice feeds only after permitted verified integration; MiBus ETA only with authorized feed.
- Interactive preview coherent across Home/Mobility/Services/Reports/Ask and persistently scoped as preview.
- Local report vs shared report privacy messaging correct; content moderated/corroborated before public backend.
- ES/EN, dark/light/auto, offline fallback, accessibility scaling, source drill-down and deterministic budgeted chat.
- Test results in GitHub Actions AND screenshots on physical devices. Privacy/terms/source disclaimers and data handling in place before inviting strangers.

## Exact next message to follow

'Continue the PanaPulse Beta 1 work from the current GitHub head. First read CLAUDE_HANDOFF_BETA1.md, DESIGN.md, docs/BRAND.md, design/ART_DIRECTION_BETA1.md and docs/BETA1_READINESS.md. Reconcile PR #8, PR #9 and the beta1 premium seismic PR without losing behavior. Audit the actual running Expo UI, capture before screenshots, then propose exactly ONE narrow premium refinement per screen based on A Living Neighborhood and the approved Porcelana brand. Do not change the identity or data-trust contract. Render and compare ES/EN and light/dark, test native Android, run CI and show me the resulting PR plus honest Beta 1 blockers. Do not merge/publish without my approval.'
