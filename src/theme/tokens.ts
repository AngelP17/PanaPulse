// PanaPulse design tokens.
// Direction: the original Hark-inspired atmosphere (rich gradient, soft translucent cards, big numerals),
// recolored for PanaPulse: midnight navy, coastal cyan and softly atmospheric ocean light.
// Status colors are fixed per theme and never derived from wallpaper / dynamic color.

export const space = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32 } as const;
export const radius = { tile: 20, card: 30, pill: 999 } as const;

export const brand = { navy: '#102635', cyan: '#20C9DB', porcelain: '#F9FCFD' } as const;

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
    sky: ['#E4F3F7', '#B8DCE8', '#B9DCD9', '#EDD0C0'],
    card: 'rgba(250,253,254,0.76)',
    tile: 'rgba(255,255,255,0.64)',
    tileStrong: 'rgba(255,255,255,0.90)',
    line: 'rgba(16,38,53,0.11)',
    ink: '#102635',
    muted: 'rgba(16,38,53,0.67)',
    faint: 'rgba(16,38,53,0.48)',
    nav: 'rgba(249,252,253,0.96)',
    navActive: '#102635',
    navActiveInk: '#FFFFFF',
    bubbleUser: '#102635',
    bubbleUserInk: '#FFFFFF',
    official: '#1E7A3E',
    officialInk: '#FFFFFF',
    stale: '#9A5B0C',
    accent: '#087D90',
    accentInk: '#FFFFFF',
    community: '#5B45B8',
    alert: '#B4372B',
    unknown: 'rgba(16,38,53,0.62)',
  },
  // Evening on the bay: navy into ocean and teal, city lights on a warm horizon.
  dark: {
    sky: ['#102635', '#1A4661', '#2E6D7D', '#C38E86'],
    card: 'rgba(12,31,46,0.82)',
    tile: 'rgba(67,116,136,0.37)',
    tileStrong: 'rgba(82,133,153,0.52)',
    line: 'rgba(255,255,255,0.08)',
    ink: '#F3F5FB',
    muted: 'rgba(228,232,246,0.66)',
    faint: 'rgba(228,232,246,0.44)',
    nav: 'rgba(8,27,41,0.96)',
    navActive: '#F9FCFD',
    navActiveInk: '#102635',
    bubbleUser: '#F9FCFD',
    bubbleUserInk: '#102635',
    official: '#7BD88F',
    officialInk: '#0B2A14',
    stale: '#F2B56B',
    accent: '#55DEEA',
    accentInk: '#102635',
    community: '#C3B1FF',
    alert: '#FF8A7A',
    unknown: 'rgba(228,232,246,0.55)',
  },
};
