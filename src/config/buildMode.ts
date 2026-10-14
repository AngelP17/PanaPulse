/**
 * Expo inlines EXPO_PUBLIC_* constants when bundling. Showcase APKs work
 * independently of a PanaPulse API; public USGS fetches remain permitted.
 * Never ship operator maintenance or AI backend traffic in showcase mode.
 */
export const IS_SHOWCASE_BUILD = process.env.EXPO_PUBLIC_APP_MODE === 'showcase';
export const API_ORIGIN = IS_SHOWCASE_BUILD
  ? ''
  : (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');
