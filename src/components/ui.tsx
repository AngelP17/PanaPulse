import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Linking, Pressable, StyleSheet, Text, TextProps, View, ViewProps, ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useApp } from '../state/AppContext';
import { PressScale } from './motion';
import { font, radius, space, type } from '../theme/tokens';

type Tone = 'ink' | 'muted' | 'faint' | 'official' | 'community' | 'alert';

export function Txt({
  size = type.body,
  weight = 'regular',
  tone = 'ink',
  style,
  numeric,
  ...rest
}: TextProps & { size?: number; weight?: keyof typeof font; tone?: Tone; numeric?: boolean }) {
  const { c } = useApp();
  return (
    <Text
      {...rest}
      style={[
        {
          color: c[tone],
          fontFamily: font[weight],
          fontSize: size,
          lineHeight: Math.round(size * (size >= 30 ? 1.12 : 1.42)),
          fontVariant: numeric ? ['tabular-nums'] : undefined,
        },
        style,
      ]}
    />
  );
}

/** Gentle Porcelana gradient crossfade. Disabled for Reduce Motion. */
export function Scene({ children }: { children: React.ReactNode }) {
  const { c } = useApp();
  const reduced = useReducedMotion();
  const [previous, setPrevious] = useState(c.sky);
  const last = useRef(c.sky);
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (last.current === c.sky) return;
    setPrevious(last.current);
    last.current = c.sky;
    fade.stopAnimation();
    fade.setValue(reduced ? 1 : 0);
    if (!reduced) {
      Animated.timing(fade, { toValue: 1, duration: 330, useNativeDriver: true }).start();
    }
  }, [c.sky, fade, reduced]);
  const locations: [number, number, number, number] = [0, 0.38, 0.7, 1];
  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={previous as unknown as [string, string, ...string[]]} locations={locations} style={StyleSheet.absoluteFill} />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: fade }]}>
        <LinearGradient colors={c.sky as unknown as [string, string, ...string[]]} locations={locations} style={{ flex: 1 }} />
      </Animated.View>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

export function Card({ style, children, featured = false, ...rest }: ViewProps & { featured?: boolean }) {
  const { c } = useApp();
  return (
    <View {...rest} style={[{ backgroundColor: c.card, borderRadius: radius.card, padding: space.lg, gap: space.md, borderWidth: 1, borderColor: featured ? c.accent : c.line, overflow: 'hidden' }, style]}>
      {children}
    </View>
  );
}

export function CardHeader({ icon, title, right }: { icon: React.ReactNode; title: string; right?: React.ReactNode }) {
  const { c } = useApp();
  return (
    <View style={styles.row}>
      <View style={[styles.badge, { backgroundColor: c.tileStrong }]}>{icon}</View>
      <Txt size={type.title} weight="semibold" style={{ flex: 1 }} accessibilityRole="header">
        {title}
      </Txt>
      {right}
    </View>
  );
}

export function Tile({ label, value, sub, style, dim }: { label: string; value: string; sub?: string; style?: ViewStyle; dim?: boolean }) {
  const { c } = useApp();
  return (
    <View style={[{ backgroundColor: c.tile, borderRadius: radius.tile, padding: space.md, gap: 6, flex: 1, minWidth: 0 }, style]}>
      <Txt size={type.label} tone="muted" numberOfLines={2}>
        {label}
      </Txt>
      <Txt size={type.stat} weight="semibold" tone={dim ? 'muted' : 'ink'} numeric>
        {value}
      </Txt>
      {sub ? (
        <Txt size={type.label} tone="faint" numeric>
          {sub}
        </Txt>
      ) : null}
    </View>
  );
}

export function TileGrid({ children }: { children: React.ReactNode }) {
  const items = React.Children.toArray(children);
  const rows: React.ReactNode[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return (
    <View style={{ gap: space.sm }}>
      {rows.map((r, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: space.sm }}>
          {r}
          {r.length === 1 ? <View style={{ flex: 1 }} /> : null}
        </View>
      ))}
    </View>
  );
}

export type Verification = 'official' | 'community' | 'stale' | 'unavailable' | 'demo';

/** Verification is shown with an icon-free text label plus shape, never color alone. */
export function StatusChip({ kind }: { kind: Verification }) {
  const { c, t } = useApp();
  const color = kind === 'official' ? c.official : kind === 'community' ? c.community : kind === 'stale' ? c.stale : kind === 'demo' ? c.ink : c.unknown;
  const label = kind === 'official' ? t('official') : kind === 'community' ? t('community') : kind === 'stale' ? t('stale') : kind === 'demo' ? t('demoChip') : t('unavailable');
  return (
    <View
      style={[
        styles.chip,
        kind === 'official'
          ? { backgroundColor: color }
          : { borderWidth: 1.5, borderColor: color, borderStyle: kind === 'community' || kind === 'demo' ? 'dashed' : 'solid' },
      ]}
    >
      <Text style={{ fontFamily: font.bold, fontSize: 12, letterSpacing: 0.4, color: kind === 'official' ? c.officialInk : color }}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

export function SourceLine({ source, kind, detail }: { source: string; kind: Verification; detail?: string }) {
  const { c } = useApp();
  return (
    <View style={[styles.row, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line, paddingTop: space.sm, flexWrap: 'wrap' }]}>
      <StatusChip kind={kind} />
      <Txt size={type.caption + 2} tone="muted" style={{ flexShrink: 1 }}>
        {source}
        {detail ? ` · ${detail}` : ''}
      </Txt>
    </View>
  );
}

export function Button({
  label,
  onPress,
  icon,
  variant = 'soft',
  accessibilityLabel,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  variant?: 'soft' | 'solid';
  accessibilityLabel?: string;
  style?: ViewStyle;
}) {
  const { c } = useApp();
  const solid = variant === 'solid';
  return (
    <PressScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={[styles.button, { backgroundColor: solid ? c.accent : c.tileStrong }, style]}
    >
      {icon}
      <Txt size={type.body} weight="semibold" style={{ color: solid ? c.accentInk : c.ink }}>
        {label}
      </Txt>
    </PressScale>
  );
}

export function LinkChip({ label, url }: { label: string; url: string }) {
  const { c } = useApp();
  return (
    <PressScale
      accessibilityRole="link"
      onPress={() => Linking.openURL(url).catch(() => {})}
      style={[styles.linkChip, { backgroundColor: c.tileStrong }]}
    >
      <Txt size={type.caption + 1} weight="semibold">
        {label} ↗
      </Txt>
    </PressScale>
  );
}

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  badge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  chip: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.pill },
  button: {
    minHeight: 52,
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
  },
  linkChip: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, minHeight: 36, justifyContent: 'center' },
});
