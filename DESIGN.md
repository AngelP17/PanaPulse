# PanaPulse visual contract

## Direction

PanaPulse is a premium, bilingual consumer companion for life in Panama, not an operations dashboard. It combines a **calm porcelain-to-ember atmosphere** with local service information that is always explicit about provenance and freshness. The original Hark-inspired v0.2 demonstrated the desired airiness; the rejected flat v0.3 (`v0.3-parked`) is the counterexample. The functional `recovery` branch and `preview/b-refinement` inform the approved information architecture, not an entirely new design.

## Identity

- **Brand mark:** The connected-path letter P in `assets/brandmark.svg` and its matching app icon. Never substitute a generic heartbeat/ECG icon.
- **Brand colors ("Porcelana", approved 2026-10-12):** ink `#202333`, porcelain `#F5F2EF`, coral `#E4A18F`, deep coral `#9A4836`; storm `#515D7C` and periwinkle `#929BC5` reserved. Details and rules in `docs/BRAND.md`; light/dark UI values in `src/theme/tokens.ts`. Navy/cyan is retired; don't reintroduce it.
- **Typography:** Manrope, generous leading, clear hierarchy and tabular numerals for magnitudes/times. Spanish diacritics must render correctly.
- **Atmosphere:** Broad gradient across the background; translucent but legible cards. Keep rounded surfaces, quiet depth, and warmth near the horizon. Avoid blur stacks, loud glow, and flat enterprise tables.
- **No pixel-for-pixel Hark duplication:** Our logo, four-way bottom navigation and the one-glance Home (area, hero, status chips) distinguish the product.

## Screen hierarchy

1. **Home** answers in one glance: is anything wrong near me, how sure are we, what to check next. Fixed order: area summary → one Alert Hero (notable quake, calm summary, or "no recent update"; rules in `src/data/glance.ts`) → at most three plain-language status chips → one muted line listing every unavailable feed → one utility card (scheduled power notices) → one secondary card (report). No visual that needs a legend, no slot per unavailable source, no fictional commute. Detail lives in Sismos and Servicios.
2. **Mobility:** Metro/MiBus module, honest feed status, links to official sources. Never invent vehicle positions or arrivals.
3. **Quakes:** Real USGS catalog data, official aftershock probabilities *only when the OAF exists*, issue timestamp and link to sources.
4. **Chat:** Conversational on-demand help grounded in the application's tools, without fabricated outages.
5. **Report:** Local on-device reports are NOT crowd confirmation and must be labeled accordingly.

## Themes and language

- **ES/EN:** All visible copy via the typed locale keys. Spanish-first; English equivalent. The AppContext persists theme and language selection.
- **Auto/Light/Dark:** Support all three from day one. Color is never the only carrier of status.
- **Native layout:** Safe-area insets, scroll-to-last-item clearance, >= 44pt practical targets and 2x font-scaling review.

## Honest status grammar

Every data element includes source and update context; statuses distinguish official, community, stale, example and unavailable.

### Complete-product interactive preview

- **When preview is enabled, it is a full, coherent product walkthrough.** Show the complete functionality and dynamic scenario values across Home, Services, Mobility, Reports, and chat rather than empty real-source placeholders.
- Show **one concise, persistent** VISTA PREVIA / PREVIEW indicator under the app header, with the scenario name. Avoid repeating DEMO, SIN DATOS, unavailable-feed disclaimers or caution paragraphs inside every example card. Keep current real-source health accessible in Settings.
- The selected scenario (Everyday, Disruptions, Recovery) controls example utility and transit conditions, arrival countdowns and neighborhood activity everywhere. Chat answers those questions from the SAME scenario rather than contradicting the interface.
- Users may save/remove the example commute and create preview reports. Changes must propagate to other preview screens; preview reports are not uploaded or stored as real reports.
- **USGS quake and forecast values stay real.** In preview, historical USGS records have their true times/source and are displayed separately; never invent a recent earthquake, alter USGS issue times or present expired aftershock windows as future.
- Preview OFF always restores the strict, source-first live experience. Missing data is unknown, not normal. Official and stale data provenance remains explicit.
- `src/data/sourcePolicy.ts` applies to production source precedence, not to replacing the entire visual product walkthrough. This preview is not live operator telemetry or an emergency-information substitute.

## Changes that need explicit approval

Core branding (logo, mark colors, wordmark), navigation, typography, background treatment and any design-system token in `src/theme/tokens.ts`. Ordinary feature work does not. Capture before/after screenshots for any visual change.

## Status color on Home

Alert red only for an active issue (USGS PAGER orange/red). Stale gold only for old data. Offline gray for unavailable. Official green marks a verified source, never service health. Brand coral is interaction only (buttons, links), never a status.

## Motion

Motion explains or confirms; it never decorates. Built with Reanimated (`src/components/motion.tsx`).

- **Press feedback:** button-like pills and choice cards use `PressScale`: scale 0.97 on press-in, 120 ms, strong ease-out, commit on press-out. Full-width list rows highlight instead of scaling.
- **No animation** on the bottom nav or tab switches (used 100+ times a day).
- **Pulse rail draw-in:** retired with the rail on Home (2026-10-12). The component keeps the behavior if the rail is reused elsewhere.
- **Haptics:** one success haptic when a report is saved, always paired with the visible confirmation. Never on scroll, entrances or navigation.
- **Reduce Motion:** scale and draw-in are dropped; presses dim instead.
- Never `ease-in`, never `scale(0)`, never animate layout properties except an absolute, fixed-content clip.

## Agent precedence

1. Explicit product direction and approved screenshots.
2. This document and `src/theme/tokens.ts`.
3. Official Expo skills for native implementation and testing.
4. Anti-slop rules for accuracy, copy, states and accessibility.
5. Community design skills as references only.

`no-slop-ui` is parked under `docs/reference-skills/` and must NOT prohibit the atmospheric gradients, large radii and intentional pill controls in this product. Do not regress to v0.3 aesthetics.
