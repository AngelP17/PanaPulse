// PanaPulse design tokens.
// Direction: Hark-style atmosphere (sky gradient, soft translucent cards, pill navigation,
// big numerals) carrying a calm civic-instrument status grammar.
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
  community: string;
  alert: string;
  unknown: string;
}

export const palettes: Record<ThemeName, Palette> = {
  // Daylight over the bay: pale sky into soft lilac and a warm horizon.
  light: {
    sky: ['#C9DBF1', '#A9C1E6', '#B6B8E0', '#EBC7B7'],
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
    official: '#1D7A63',
    officialInk: '#FFFFFF',
    community: '#9A5E14',
    alert: '#B4372B',
    unknown: 'rgba(22,32,58,0.55)',
  },
  // Dusk over the city: steel blue into violet and a peach horizon.
  dark: {
    sky: ['#2C4266', '#47558A', '#7A6C9C', '#CB8B78'],
    card: 'rgba(27,35,56,0.80)',
    tile: 'rgba(78,88,120,0.42)',
    tileStrong: 'rgba(92,102,136,0.55)',
    line: 'rgba(255,255,255,0.08)',
    ink: '#F3F5FB',
    muted: 'rgba(228,232,246,0.66)',
    faint: 'rgba(228,232,246,0.44)',
    nav: 'rgba(22,28,45,0.97)',
    navActive: '#F3F5FB',
    navActiveInk: '#141A28',
    bubbleUser: '#F3F5FB',
    bubbleUserInk: '#141A28',
    official: '#6FD1B3',
    officialInk: '#0E2A22',
    community: '#F0B66A',
    alert: '#FF8A7A',
    unknown: 'rgba(228,232,246,0.55)',
  },
};
