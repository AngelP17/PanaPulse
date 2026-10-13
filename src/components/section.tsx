import React from 'react';
import { View } from 'react-native';
import { space, type } from '../theme/tokens';
import { Txt } from './ui';

/**
 * A typographic chapter break. No decorative accent stripe; preserve the
 * approved Porcelana atmosphere and let hierarchy come from size and space.
 */
export function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={{ paddingHorizontal: space.xs, gap: 5, marginTop: space.lg }}>
      <Txt size={type.title + 3} weight="bold" accessibilityRole="header">{title}</Txt>
      <Txt size={type.label} tone="muted">{subtitle}</Txt>
    </View>
  );
}
