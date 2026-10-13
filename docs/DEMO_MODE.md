# PanaPulse: source-first preview (hybrid)

A source-first, bilingual consumer UI. This **replaces** the previous full-screen demo implementation.

## Why
Two earlier mistakes were corrected:
1. Preview cards were added above live-source “SIN DATOS” cards, contradicting the sample.
2. Every screen was then replaced with fiction, hiding authentic USGS earthquake observations.

Both are incorrect. Samples should be optional **per missing data source**, not an alternative reality for the app.

## Rules
1. **Real and fresh** → show official fact with provider, date/time, and source link.
2. **Real but stale** → show the last-known official fact with its *original date/time* and stale label; do not refresh or extrapolate it.
3. **No usable real feed + preview enabled** → show a dynamically changing fictional example, tagged **SIMULADO / SIMULATED on that card**.
4. **No usable real feed + preview disabled** → show honest “SIN DATOS” with official link.
5. An official scheduled-maintenance notice does **not** assert power availability, even if recent.
6. No fake USGS earthquake or forecast may override real catalog entries. Quakes and the earthquake hero remain real USGS or dated official snapshot in **every** mode.
7. Reports entered by the user and the chat use actual local/sourced data, never demo fixtures.

## Specific screens
- **Home:** USGS hero and source time always real. The latest recorded magnitude/location is visible even with a dated snapshot, but explicitly labeled stale. The power card uses official current or stale data if present; an example only if the source is missing. An optional example commute is clearly marked.
- **Sismos:** always actual USGS earthquakes/OAF. If cached/snapshot, the forecast and source are visibly **stale**; do not treat the archived probabilities as current.
- **Servicios:** same source-first policy for ENSA/Naturgy scheduled notices; IDAAN is a locally tagged example only when preview is enabled. Official provider links remain accessible in all modes.
- **Movilidad:** no verified live Metro/MiBus times yet; in preview, examples are labeled and grouped; official operator links remain accessible.
- **Reportes:** fictional neighborhood count is isolated from saved user reports.
- **Ajustes:** source health and timestamps stay real regardless of preview selection.

The component selection for scheduled electricity is implemented centrally in `src/data/sourcePolicy.ts` and checked by `node scripts/test-source-policy.cjs`.

## Acceptance
- Toggle preview while online: Home and Sismos USGS **must not change to fictional earthquakes**.
- Set power source to current/stale/missing and toggle preview: current/stale are always preserved; only missing becomes a demo example.
- Every fictional ETA or outage is labeled SIMULATED inside its card. The top-level UI is not labeled wholly fictional.
- Verify in ES/EN, Auto/Light/Dark, 360dp width, large text, reduced motion.
- Run GitHub CI, and capture native screenshots before release.
- Deployment is separate: the electricity collector, IDAAN feed and authorized transit integrations are NOT made live by turning on preview.
