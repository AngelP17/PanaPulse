// PanaPulse design tokens, v0.3 identity.
// Direction: "the canal at night". Midnight navy into deep ocean teal (dark), fog and sea-glass
// (light). One brand accent, canal cyan, used for the pulse mark, active tab and primary actions.
// Status colors are fixed per theme, distinct from the accent, and never wallpaper-derived.

export const space = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32 } as const;
export const radius = { row: 12, tile: 14, card: 22, pill: 999 } as const;

export const font = {
  display: 'BricolageGrotesque_700Bold',
  displaySemi: 'BricolageGrotesque_600SemiBold',
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
} as const;

export const type = {
  caption: 12,
  label: 14,
  body: 16,
  title: 18,
  heading: 26,
  display: 34,
  hero: 64,
} as const;

export type ThemeName = 'light' | 'dark';

export interface Palette {
  sky: readonly [string, string];
  surface: string;
  raised: string;
  line: string;
  ink: string;
  muted: string;
  faint: string;
  accent: string;
  accentInk: string;
  accentSoft: string;
  bar: string;
  official: string;
  officialInk: string;
  community: string;
  alert: string;
  alertInk: string;
  unknown: string;
}

export const palettes: Record<ThemeName, Palette> = {
  light: {
    sky: ['#EEF4F6', '#DDEBEE'],
    surface: '#FFFFFF',
    raised: '#F2F7F9',
    line: 'rgba(10,40,55,0.10)',
    ink: '#0C2230',
    muted: 'rgba(12,34,48,0.66)',
    faint: 'rgba(12,34,48,0.46)',
    accent: '#0A6E95',
    accentInk: '#FFFFFF',
    accentSoft: 'rgba(10,110,149,0.12)',
    bar: '#FFFFFF',
    official: '#1E7A3E',
    officialInk: '#FFFFFF',
    community: '#5B45B8',
    alert: '#B3261E',
    alertInk: '#FFFFFF',
    unknown: 'rgba(12,34,48,0.50)',
  },
  dark: {
    sky: ['#0A1522', '#0C2630'],
    surface: '#112131',
    raised: '#172B3D',
    line: 'rgba(170,210,225,0.12)',
    ink: '#EAF2F5',
    muted: 'rgba(220,234,240,0.68)',
    faint: 'rgba(220,234,240,0.46)',
    accent: '#5CC8F0',
    accentInk: '#06202C',
    accentSoft: 'rgba(92,200,240,0.14)',
    bar: '#0D1A28',
    official: '#7BD88F',
    officialInk: '#0B2A14',
    community: '#C3B1FF',
    alert: '#FF7A6B',
    alertInk: '#2A0905',
    unknown: 'rgba(220,234,240,0.50)',
  },
};
