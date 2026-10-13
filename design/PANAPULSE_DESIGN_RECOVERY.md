# PanaPulse Visual Recovery Contract

> Color direction below is superseded by the approved "Porcelana" palette (`docs/BRAND.md`, 2026-10-12). Everything else still applies.

Version: 2026-10-12. Applies to Expo / React Native Android and iOS. Spanish (Panama) and English are supported, with Auto, Light, and Dark appearance modes.

## Problem to correct

The latest three-variant design presentation removed the distinctive atmospheric personality that the user liked in the earlier Hark-inspired build. It now resembles a generic flat civic dashboard: excessive rigid section labels, repeated flat cards, a tiny five-segment status rail, a dominant earthquake percentage and weak differentiation between dark themes. The objective is **not** to clone Hark, nor to ban personality. Recover warmth, spaciousness, depth and instantly legible information while establishing PanaPulse's own identity.

## Skill precedence, not skill voting

1. User's reference screenshots and explicit product requirements.
2. `DESIGN.md`, `src/theme/tokens.ts` and actual native app constraints.
3. Official Expo skills: `expo-design-system`, `expo-ui`, `expo-router` as applicable.
4. `GrubbyLee/design-guide` for UI review, design direction and visual QA workflow.
5. `miqdadbadjuber/anti-slop` core for **honesty, empty/loading/error states, evidence and accessible copy**. Apply `skills/ANTISLOP-RN.md` overrides.
6. `Leonxlnx/taste-skill` and `funboy322/avoid-ai-design` as optional inspiration/review inputs, selectively.
7. `LeoStehlik/no-slop-ui`, `Netxeo/skill-file-design`, `lotfb86/web-design-skills`, `alchaincyf/huashu-design` as reference-only, not global vetoes. Many rules assume CSS/web or contradict this brand.

**Explicit conflict resolution:** `no-slop-ui` says "Normal. Not dramatic" and bans decorative gradients, pill controls, and large corner radii. These are suggestions for generic web dashboard reduction, **not** mandates for PanaPulse. Preserve intentional atmospheric background, one distinctive rounded focal card, generous typography and subtle depth. Never misrepresent the skill as a universal prohibition on gradients. PanaPulse's `DESIGN.md` governs.

**Check whether any skills are actually activated.** The previous project's `scripts/install-skills.sh` only clones repositories under `skills/vendor/` as *reference-only*. It does not make Claude activate them. Locate actual `SKILL.md` paths, agent/plugin registration and `CLAUDE.md` pointers. Report each skill as loaded, present-but-inactive or missing. Never say a skill was read if it wasn't.

## Product identity

A living neighborhood status instrument designed for Panama. Premium, atmospheric and inviting, but reliable under stress. Strong spatial hierarchy rather than a stack of generic metrics.

### Signature visual elements

- Background: brand-specific midnight-ocean-to-muted-teal atmosphere with a subtle warm horizon accent, not Hark's blue/purple/coral gradient. Light mode uses a warm off-white and cool ocean-blue washes, not plain white.
- A quiet 'Mi zona / My area' focal composition with five statuses: Power, Water, Metro, MiBus, Quakes. Statuses have icon + label + official/community/unknown/freshness text. Unknown is **not** healthy.
- One signature **Pulse Line** running through the area status overview. It can indicate an event only with verified data; otherwise it is a static brand motif, never a fake telemetry trace.
- A prominently actionable mobility summary below the area overview, because everyday commutes generate repeat use. Do not invent ETAs.
- A concise seismic event/forecast panel that remains readable and source-specific, without making one 28% figure the entire app's identity.
- Cards vary by information content and purpose. A single prominent surface is allowed; avoid endless rectangles of the same radius and padding.
- In compact navigation, use native bottom tabs for Home, Transit, Quakes, Reports, with settings available from the header. The chat agent is an optional secondary tool, not a permanent input blocking data.

### Required hierarchy on 412x915 dp home

1. Location name and concise source freshness at the top.
2. My Area five-service rail with clear unknown/official/community states.
3. Mobility/commute module clearly visible without scrolling when feasible.
4. Active critical alert (if one exists) elevated above normal modules, with source and timestamp.
5. Quakes forecast / recent event panel, informative but not visually overwhelming.
6. Report a service interruption action with obvious accessible touch target.

## Trust and usability rules

- Real data or explicit DEMO label on every mock card. No fake healthy service statuses, bus ETAs, neighbors reporting, or forecasts.
- For every data state, support loading, empty, error, stale. Error is not zero; unavailable is not normal.
- Source attribution, exact event time and verification status visible without drilling into a detail view.
- Human-readable Spanish and English strings, localization parity and automatic language selection when configured.
- Auto/Light/Dark must cover background, cards, typography, navigation and status bar. Maintain contrast for secondary labels.
- Maintain min 48 dp touch targets. Support TalkBack/VoiceOver, 360 dp width and 2.0 text scaling.
- Use React Native primitives/Expo. No WebView or CSS-only replication. Prefer fixed status semantic colors independent of theme.
- Emergency content cannot be obstructed by a floating composer or advertisements.

## Acceptance review and delivery gate

Before editing, show a 1-page visual audit of the current screenshots with 5 concrete findings and corresponding fixes. Name which files and installed skills were actually read. Then produce **two PanaPulse-specific visual directions**, including a native-feasible proposal and reasons for key visual decisions. Do not implement a major redesign before the user chooses a direction.

After approval, implement in the existing Expo components and tokens, not a throwaway HTML clone. Capture Android emulator screenshots (not just web output) at 412x915 light/dark and 360 dp narrow, check both languages, large text, stale and empty states, and provide before/after comparisons. Report unexecuted tests honestly.
