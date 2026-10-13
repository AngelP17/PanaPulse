# PanaPulse brand: Porcelana

**Brand essence:** Panama, connected every day. Calm, useful, precise.
**Palette:** "Porcelana", approved 2026-10-12 (replaces the v0.2.1 navy/cyan). Review page and the two
alternatives that weren't chosen: `design/review/` and `design/palettes/`.

## Colors

| Token (`brand` in `src/theme/tokens.ts`) | Hex | Use |
|---|---|---|
| `ink` | `#202333` | Text, mark tile, dark-mode sky top, active nav |
| `porcelain` | `#F5F2EF` | Light-mode sky top, ink-on-dark text, mark spark |
| `coral` | `#E4A18F` | Mark letter, dark-mode accent, horizon glow |
| `deepCoral` | `#9A4836` | Light-mode accent (buttons, links, accent text). Passes AA on porcelain cards |
| `storm` | `#515D7C` | Reserved, secondary brand color |
| `periwinkle` | `#929BC5` | Reserved, secondary brand color |

The live UI values per theme (sky stops, card translucency, accent) are in `palettes` in `src/theme/tokens.ts`.
Every card text color clears WCAG AA (4.5:1) over every sky stop; recheck with
`design/palettes/tools/contrast.py` before changing anything.

## Logo

- Geometry: the connected-path `P` in `assets/brandmark.svg`. Never redraw, skew, add glows or swap it for a heartbeat icon.
- App mark (`mark` in `tokens.ts`, used by `PulseMark`): ink tile, coral letter, porcelain spark.
- `assets/brandmark.svg`: ink letter, deep-coral spark, for light backgrounds.
- Wordmarks: `assets/wordmark-light.svg` (ink + deep coral) and `assets/wordmark-dark.svg` (porcelain + coral).
  Never set light coral `#E4A18F` text on porcelain: it fails contrast. Use deep coral there.
- App icons: `assets/icon.png` (full-bleed, no transparency, for iOS), `assets/android-icon-foreground.png` on
  `#202333`, `assets/android-icon-monochrome.png` for Android 13+ themed icons, `assets/favicon.png` for web.
- Clear space around the P: at least a quarter of its height.

## Application interface

- Light: warm porcelain sky that glows coral near the horizon. Dark: midnight ink into dusk plum with an ember horizon.
- Coral is brand and interaction only, **never** verification. Status colors are fixed and semantic:
  official green, stale gold (dotted), community teal (dashed), alert red (with icon and label).
  They were chosen to stay distinct from coral; don't move them toward it.
- Cards are large, rounded and translucent. Don't shrink text to cram data into uniform boxes.
- The four-tab bottom navigation is the product's own grammar, distinct from Hark's conversation-first nav.
- Status always carries a text label; color is never the only signal.

## Known risk

Porcelain plus coral sits near the "cream and terracotta" look that AI-generated designs default to.
What keeps it distinct: the ink sky at night, the P mark, the pulse rail and the bottom nav. Avoid adding serif
display type, beige-on-beige cards or terracotta rules, which would push it into the cliché.

## Provenance

These are bespoke concept assets, not trademark-cleared. Check wordmark and mark availability before public launch.
