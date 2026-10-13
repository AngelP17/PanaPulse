import React from 'react';
import { View } from 'react-native';
import { useApp } from '../state/AppContext';
import { space, type } from '../theme/tokens';
import { Txt } from './ui';

export function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  const { c } = useApp();
  return (
    <View style={{ paddingHorizontal: space.xs, gap: 4, marginTop: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <View style={{ width: 4, height: 24, borderRadius: 3, backgroundColor: c.accent }} />
        <Txt size={type.title + 3} weight="bold" accessibilityRole="header">{title}</Txt>
      </View>
      <Txt size={type.label} tone="muted">{subtitle}</Txt>
    </View>
  );
}
