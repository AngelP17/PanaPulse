# PanaPulse Beta 1 art direction: A Living Neighborhood

Status: proposed implementation language over the **approved Porcelana brand**, not a rebrand. Updated October 13, 2026.

## One-sentence idea
**Panama is a living neighborhood, not a government status dashboard.** PanaPulse presents the next meaningful thing around a person, then reveals supporting detail without losing trust in the source.

Our own visual signature is **the connected path**: the existing P mark, the cadence of neighborhood → signal → detail, and a quiet horizon that changes with the user's theme. Not Hark's layout, icons, specific components, or branding.

## What is fixed

- Preserve the exact connected-path P mark and all app icons/wordmarks. No generic ECG logo.
- Preserve the Porcelana light sky and ink-to-ember dark sky, semantic colors, Manrope, theme transitions and the four-tab pill navigation. The design system is in DESIGN.md, docs/BRAND.md and src/theme/tokens.ts.
- Existing components remain translucent, rounded and mobile-native. No permanent blurred stacks, glass effects dependent on expensive GPU or faux ambient lighting.
- Keep Spanish-first, English parity, tap targets ≥44pt, Dynamic Type/accessibility scaling, safe areas, Reduce Motion, touch feedback, readable source times.
- Coral is brand/interaction only, never an alert or verification indicator. Green means official verification, gold stale, teal community, and actual PAGER red alert only where truly supported.
- No infographic/legend for things that can be said with words. A blank feed isn't news.

## What makes this PanaPulse, not Hark

1. The personal corregimiento is the place anchor, not a generic assistant greeting.
2. An editorial **single signal** is the first decision: a sourced event or preview scenario fact that matters now. Context and action sit together.
3. Service cards are different because their information is different: Luz / Agua are paired, Mobility is a journey with stops and timing, Quakes is observations + forecast with source dates, Reports is anonymous community context with time/area.
4. The bottom four-way navigation and connected P remain proprietary PanaPulse grammar. Chat is contextual, not the whole product.
5. The vertical Porcelana/ember horizon frames content without encoding status.
6. Verified information is visually distinguished by provenance and timestamp, never decoration.
7. The preview mode is an interactive product walkthrough with one persistent 'VISTA PREVIA · {scenario}' indicator. It is not an excuse to claim simulated service telemetry is real.

## Hark-quality interaction standard, not Hark cloning

Adopt: breathable rhythm, premium type scale, large first-level facts, carefully mixed card density, responsive tap feedback, subtle depth and deliberate motion. Do not reproduce: Hark's exact navigation composition, gradient stops, logo proportions, characteristic cards or screen layouts.

## Original screen-specific hierarchy

**Home**
1. Area name + last relevant *sourced* context.
2. One primary piece of information, never five equally weighted warnings.
3. Power and water together as essential services, with a clear drill-in.
4. One optional saved commute, no invented route until preview is enabled.
5. Anonymous neighborhood reports shown as human-readable cards rather than an unsupported count, after PR #8 is integrated.
6. Genuine USGS observation with its actual timestamp.
No fake all-clear. Prefer one visible next action per section.

**Sismos / Quakes**
- Primary event is a typographic M number, place, original time and source.
- Magnitude filters are real interaction, not pseudo-counters. Filtering never mutates the USGS feed.
- Issued USGS aftershock forecasts are an independently labeled chapter, and archived periods must be phrased historically.
- More observations follow as a date-grouped catalog with tap-through to full details. PAGER red is never inferred from magnitude alone.
- Maintain current detail sheet and official link.

**Movilidad**
- Compose like a journey: origin → next leg → destination. Time and stops read quickly.
- Show route-save state and a deterministic preview ETA **only within preview**. Do not style static Google Transit estimates as live vehicle positions.
- Real mode retains unknown provider state and official channel links until an authorized feed is integrated.

**Servicios**
- Two distinct chapters, electricity (scheduled notice vs actual service) and water (official bulletin vs community report). Don't collapse source verification and service health.
- Use readable verified notice summaries, dates, affected corregimientos, and tap-through to original provider records.
- Absence of a scheduled notice is not proof of service working.

**Reportes**
- After PR #8: short anonymous report cards with service icon, message, corregimiento and relative time, NEVER exact address or identity.
- A report the user submitted is shown separately if it hasn't been published/verified by a server. Avoid false community consensus.
- Moderation, persistence and rate limiting are required before calling this a real shared social feed.

**Preguntar**
- Present answer and its provenance cleanly. A chat answer must not disagree with Services.
- In preview, use selected scenario and global indicator. For USGS, always use real catalog and genuine dates.
- On real data, say 'not connected' only once when necessary, not as a full-screen sermon.

**Settings**
- Clear ES/EN and appearance controls, separate preview controls and a compact, truthful source-health section. Current backend reachability is not current electric or water availability.

## Concrete components allowed in the beta polish

- Featured sourced event card, typographic chapter headings, compact 44+pt selectable chips, nested data tiles inside one main surface, one muted source line for each independent source.
- Whole-surface accessible press states and contextual CTAs that really navigate.
- 200–350ms unobtrusive transitions, Reduce Motion fallback. No pulsing alarms and no elaborate cinematic route animations that conceal factual values.

## TasteSkill v2 application rules

The actual 'design-taste-frontend' v2 SKILL.md explicitly says **'Not for dashboards or app screens'**. Its browser inspector also flags gradients and cream/terracotta, directly contradicting approved Porcelana. Therefore:
- For Expo native screens, use the **redesign-existing-projects** skill as a *diagnostic reference*, plus Expo's design/native/animation skills as implementation authority. Optionally consult TasteSkill v2 for structure/content and browser screenshot review, but **disable any generic palette/gradient prohibitions**.
- For a future public *marketing website* (not app UI), full design-taste-frontend v2 may be used with `--keep palette,type`.
- No skill may override DESIGN.md, docs/BRAND.md or source-trust contracts. 'High-end-visual-design' has web CSS directives and random-layout mandates: borrow attention to detail, **not** its bans on Manrope/Lucide or proposals to change theme.
- Always show three screenshots of **existing** UI before iterating. Never apply random art directions blindly to production views.
- Two visible variants MAX per changed screen: recovered/approved current and one controlled improvement. Request approval before modifying shared brand tokens, mark, tab grammar or global typography.

## Visual QA, mandatory

Capture on a web build using Chrome/Playwright, and again on a **physical Android device**:
- ES and EN; Light, Dark and Auto.
- 360×780, 393×852 and 412×915 viewport equivalents.
- Normal text and 200% accessibility font.
- Preview OFF with stale USGS + utility source unavailable. Preview ON in Día habitual, Incidencias and Recuperación, all tabs.
- Long corregimiento/place names, keyboard open over composer, offline network, modal open, route saved/removed, report submission.
- Verify no clipped words, orphaned CTA, obscured last card, inaccessible scroll, fake 'LIVE' status, wrong contrast or forced hero two-line truncation.
- Use before/after with same viewport/theme/data. Record each deviation, reason and acceptance in design/review/beta1/.

Do not claim native QA because web screenshots passed.
