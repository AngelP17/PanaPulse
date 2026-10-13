# Palette previews

**Decision (2026-10-12): Porcelana (`p2-porcelana.tokens.ts`) was approved and is now `src/theme/tokens.ts`.**
The other two stay here as reference. Brand rules: `docs/BRAND.md`.

Three token-only variations of the current Home layout, built from the candidate brand colors
`#202333` ink, `#515D7C` storm, `#929BC5` periwinkle, `#E4A18F` coral, `#F5F2EF` porcelain.

| File | Name | Light accent | Dark accent | Notes |
|---|---|---|---|---|
| `p1-crepusculo.tokens.ts` | Crepúsculo | `#4C5775` storm | `#AEB6E6` periwinkle | Not chosen. Periwinkle sky into a coral horizon |
| `p2-porcelana.tokens.ts` | Porcelana | `#9A4836` deep coral | `#E4A18F` coral | **Approved.** Warm-led. Light mode sits near the cream + terracotta cliché (see BRAND.md) |
| `p3-tinta.tokens.ts` | Tinta | `#9A4836` deep coral | `#E4A18F` coral | Not chosen. Cool-led, least like Hark, flattest dark mode |

Status colors are shared: official `#176A35` / `#7BD88F`, stale `#7D5A00` / `#F2C14E`,
community `#0D6B64` / `#5FD4C4` (moved off lilac), alert `#A8322A` / `#FF8591`.

These files are references only; nothing imports them.

## Review

Open `design/review/index.html` (screenshots in `design/review/img/`): current main vs the three variations,
light and dark, top and scrolled, plus the logo sheet, the audit and the roadmap. Renders are web exports of the
real Expo code at 412×915, not Android.

## Reproduce

```bash
python3 tools/variants.py            # definitions
python3 tools/contrast.py            # WCAG check: every card text color over every sky stop
python3 tools/gen.py                 # regenerate p*.tokens.ts from the current src/theme/tokens.ts
```

To preview one: copy it over `src/theme/tokens.ts`, swap the three hex colors in `src/components/pulse.tsx` with the
ones in the file's "P mark" comment, run `npx expo start`, then `git checkout -- src`.

## Applied

`feat/palette-tokens`: Porcelana written into `src/theme/tokens.ts`, mark colors moved into the `mark` token, quake sheet literals replaced by `sheet`/`scrim` tokens, icons and SVG brand assets recolored, DESIGN.md, AGENTS.md, BRAND.md and CLAUDE.md updated together. Before/after screenshots in `design/review/after/`.
