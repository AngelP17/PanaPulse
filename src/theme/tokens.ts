// PanaPulse design tokens.
// Direction: the original v0.2 atmosphere (rich gradient, soft translucent cards, big numerals) in the
// approved "Porcelana" palette (2026-10-12): warm porcelain days, ink-to-ember evenings, deep coral accent.
// Changing these values is a brand change and needs explicit approval (see DESIGN.md).
// Status colors are fixed per theme and never derived from wallpaper / dynamic color.

export const space = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32 } as const;
export const radius = { tile: 20, card: 30, pill: 999 } as const;

export const brand = {
  ink: '#202333',
  storm: '#515D7C',
  periwinkle: '#929BC5',
  coral: '#E4A18F',
  deepCoral: '#9A4836',
  porcelain: '#F5F2EF',
} as const;

/** The P mark's three fills. Geometry lives in assets/brandmark.svg and components/pulse.tsx and never changes. */
export const mark = { tile: brand.ink, letter: brand.coral, spark: brand.porcelain } as const;

export const font = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
} as const;

export const type = {
  caption: 12,
  label: 14,
  body: 16,
  title: 19,
  stat: 34,
  hero: 44,
} as const;

export type ThemeName = 'light' | 'dark';

export interface Palette {
  sky: readonly [string, string, string, string];
  card: string;
  tile: string;
  tileStrong: string;
  line: string;
  ink: string;
  muted: string;
  faint: string;
  nav: string;
  navActive: string;
  navActiveInk: string;
  bubbleUser: string;
  bubbleUserInk: string;
  official: string;
  officialInk: string;
  stale: string;
  accent: string;
  accentInk: string;
  community: string;
  alert: string;
  unknown: string;
  /** Bottom-sheet surface (quake detail). */
  sheet: string;
  /** Dim layer behind sheets and modals. */
  scrim: string;
}

export const palettes: Record<ThemeName, Palette> = {
  // Morning in porcelain: warm off-white washing into a soft coral glow near the horizon.
  light: {
    sky: ['#F5F2EF', '#EEE6E2', '#EAD3CA', '#E8B7A8'],
    card: 'rgba(250,248,246,0.68)',
    tile: 'rgba(250,248,246,0.70)',
    tileStrong: 'rgba(252,250,248,0.88)',
    line: 'rgba(32,35,51,0.09)',
    ink: '#202333',
    muted: 'rgba(32,35,51,0.66)',
    faint: 'rgba(32,35,51,0.46)',
    nav: 'rgba(247,245,243,0.95)',
    navActive: '#202333',
    navActiveInk: '#F5F2EF',
    bubbleUser: '#202333',
    bubbleUserInk: '#F5F2EF',
    official: '#176A35',
    officialInk: '#FFFFFF',
    stale: '#7D5A00',
    accent: '#9A4836',
    accentInk: '#F5F2EF',
    community: '#0D6B64',
    alert: '#A8322A',
    unknown: 'rgba(32,35,51,0.58)',
    sheet: '#EDE6E1',
    scrim: 'rgba(32,35,51,0.45)',
  },
  // Evening: midnight ink into dusk plum, with an ember horizon.
  dark: {
    sky: ['#202333', '#2A2B3F', '#463F55', '#B67F71'],
    card: 'rgba(32,32,47,0.84)',
    tile: 'rgba(150,130,150,0.24)',
    tileStrong: 'rgba(170,150,165,0.38)',
    line: 'rgba(245,242,239,0.08)',
    ink: '#F5F2EF',
    muted: 'rgba(245,242,239,0.68)',
    faint: 'rgba(245,242,239,0.46)',
    nav: 'rgba(26,26,39,0.96)',
    navActive: '#F5F2EF',
    navActiveInk: '#202333',
    bubbleUser: '#F5F2EF',
    bubbleUserInk: '#202333',
    official: '#7BD88F',
    officialInk: '#0B2A14',
    stale: '#F2C14E',
    accent: '#E4A18F',
    accentInk: '#2A1813',
    community: '#5FD4C4',
    alert: '#FF8591',
    unknown: 'rgba(245,242,239,0.56)',
    sheet: '#2A2A3C',
    scrim: 'rgba(12,12,20,0.55)',
  },
};
