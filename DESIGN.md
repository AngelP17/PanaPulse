# PanaPulse design direction

**Identity:** a calm civic instrument with Hark's atmosphere. Sky gradient, soft translucent cards,
floating pill navigation, big numerals. Trust first: it must read calmly the day after an M7.7.

**Dials (anti-slop):** ENERGY 1 · RHYTHM 1 · MOTION 1. No celebratory motion, no pulsing dots.

## Tokens (`src/theme/tokens.ts`)
- **Atmosphere:** light = daylight over the bay (pale sky → lilac → warm horizon); dark = dusk over
  the city (steel blue → violet → peach). Decoration only.
- **Surfaces:** `card` (translucent, radius 30), `tile` (nested, radius 20), `nav` (near-opaque so
  text never shows through the floating bars).
- **Status (fixed, never dynamic color):** official = solid chip, community = dashed outline,
  unavailable = solid outline in neutral. Always a text label, never color alone.
- **Alert red** only marks M6+ events. Nothing else is red.
- **Type:** Manrope (Spanish diacritics, tabular numerals). Stats 34, titles 19, body 16, labels 14.

## Layout grammar
- Top: round `+` (new report) · pill nav (Inicio / Sismos / Chat) · round settings.
- Bottom: floating composer "Pregúntale a PanaPulse".
- Home: Hark-style action cards (verb chip + object), then one focal card (aftershock forecast
  while a USGS forecast is active), then services and mobility with honest "Sin datos" states.

## Status grammar (every data card)
Source · verification chip · "actualizado hace N min". Missing data is shown as missing, never as
"todo normal". Snapshot data says its real timestamp.

## Banned here
Purple-blue hero gradients on white, glassmorphism blur stacks, emoji icons, 2×3 fake-metric grids,
sparkle/AI badges, invented sample stats, confetti or celebratory haptics, ads on emergency screens.
