import { useWindowDimensions } from 'react-native';

/**
 * Two side-by-side cards stop working when the text inside them cannot fit: large OS font scale or a
 * narrow phone breaks long Spanish words mid-word. Stack them instead of clipping.
 */
export function useStackedPair(): boolean {
  const { fontScale, width } = useWindowDimensions();
  return fontScale > 1.15 || width < 340;
}
