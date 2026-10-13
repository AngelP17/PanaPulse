// PanaPulse design tokens.
// Direction: the original Hark-inspired atmosphere (rich gradient, soft translucent cards, big numerals),
// recolored for Panama: navy into ocean and teal over a warm sand horizon. Accent: canal cyan.
// Status colors are fixed per theme and never derived from wallpaper / dynamic color.

export const space = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32 } as const;
export const radius = { tile: 20, card: 30, pill: 999 } as const;

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
}

export const palettes: Record<ThemeName, Palette> = {
  // Morning on the bay: clear sky into sea glass and warm sand.
  light: {
    sky: ['#D3E7F4', '#AFD4E0', '#BEDDD4', '#F1D6BA'],
    card: 'rgba(255,255,255,0.62)',
    tile: 'rgba(255,255,255,0.66)',
    tileStrong: 'rgba(255,255,255,0.86)',
    line: 'rgba(22,32,58,0.09)',
    ink: '#16203A',
    muted: 'rgba(22,32,58,0.62)',
    faint: 'rgba(22,32,58,0.42)',
    nav: 'rgba(248,250,255,0.94)',
    navActive: '#16203A',
    navActiveInk: '#FFFFFF',
    bubbleUser: '#16203A',
    bubbleUserInk: '#FFFFFF',
    official: '#1E7A3E',
    officialInk: '#FFFFFF',
    stale: '#9A5B0C',
    accent: '#0A6E95',
    accentInk: '#FFFFFF',
    community: '#5B45B8',
    alert: '#B4372B',
    unknown: 'rgba(22,32,58,0.55)',
  },
  // Evening on the bay: navy into ocean and teal, city lights on a warm horizon.
  dark: {
    sky: ['#14284A', '#1F4F6E', '#35767E', '#CF9670'],
    card: 'rgba(17,33,52,0.80)',
    tile: 'rgba(72,112,132,0.36)',
    tileStrong: 'rgba(86,128,148,0.50)',
    line: 'rgba(255,255,255,0.08)',
    ink: '#F3F5FB',
    muted: 'rgba(228,232,246,0.66)',
    faint: 'rgba(228,232,246,0.44)',
    nav: 'rgba(11,24,40,0.96)',
    navActive: '#F3F5FB',
    navActiveInk: '#141A28',
    bubbleUser: '#F3F5FB',
    bubbleUserInk: '#141A28',
    official: '#7BD88F',
    officialInk: '#0B2A14',
    stale: '#F2B56B',
    accent: '#7FD6EC',
    accentInk: '#06202C',
    community: '#C3B1FF',
    alert: '#FF8A7A',
    unknown: 'rgba(228,232,246,0.55)',
  },
};
