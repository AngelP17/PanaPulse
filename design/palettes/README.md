# Palette previews (not approved)

Three token-only variations of the current Home layout, built from the candidate brand colors
`#202333` ink, `#515D7C` storm, `#929BC5` periwinkle, `#E4A18F` coral, `#F5F2EF` porcelain.

| File | Name | Light accent | Dark accent | Notes |
|---|---|---|---|---|
| `p1-crepusculo.tokens.ts` | Crepúsculo | `#4C5775` storm | `#AEB6E6` periwinkle | Recommended. Periwinkle sky into a coral horizon |
| `p2-porcelana.tokens.ts` | Porcelana | `#9A4836` deep coral | `#E4A18F` coral | Warm-led. Light mode risks the cream + terracotta cliché |
| `p3-tinta.tokens.ts` | Tinta | `#9A4836` deep coral | `#E4A18F` coral | Cool-led, least like Hark, flattest dark mode |

Status colors are shared: official `#176A35` / `#7BD88F`, stale `#7D5A00` / `#F2C14E`,
community `#0D6B64` / `#5FD4C4` (moved off lilac), alert `#A8322A` / `#FF8591`.

These files are references only. Nothing imports them, and `src/theme/tokens.ts` is unchanged on this branch.

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

## After approval

One PR (`feat/palette-tokens`): write the chosen palette into `src/theme/tokens.ts`, move the mark colors into
`brand` tokens, replace the literal colors in `Quakes.tsx`, update DESIGN.md, AGENTS.md, BRAND.md and CLAUDE.md
together, then capture before/after screenshots.
