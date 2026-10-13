import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Linking, Pressable, StyleSheet, Text, TextProps, View, ViewProps, ViewStyle } from 'react-native';
import { useApp } from '../state/AppContext';
import { font, radius, space, type } from '../theme/tokens';

type Tone = 'ink' | 'muted' | 'faint' | 'accent' | 'official' | 'community' | 'alert';

export function Txt({
  size = type.body,
  weight = 'regular',
  tone = 'ink',
  style,
  numeric,
  ...rest
}: TextProps & { size?: number; weight?: keyof typeof font; tone?: Tone; numeric?: boolean }) {
  const { c } = useApp();
  const display = weight === 'display' || weight === 'displaySemi';
  return (
    <Text
      {...rest}
      style={[
        {
          color: c[tone],
          fontFamily: font[weight],
          fontSize: size,
          lineHeight: Math.round(size * (display ? (size >= 48 ? 1.0 : 1.15) : 1.45)),
          letterSpacing: display && size >= 26 ? -0.6 : 0,
          fontVariant: numeric ? ['tabular-nums'] : undefined,
        },
        style,
      ]}
    />
  );
}

/** Background: a quiet two-stop wash. Atmosphere only, never a status cue. */
export function Scene({ children }: { children: React.ReactNode }) {
  const { c } = useApp();
  return (
    <LinearGradient colors={[c.sky[0], c.sky[1]]} style={StyleSheet.absoluteFill}>
      {children}
    </LinearGradient>
  );
}

export function Section({ title, right, children, style }: { title?: string; right?: React.ReactNode; children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[{ gap: space.xs }, style]}>
      {title ? (
        <View style={[styles.row, { paddingHorizontal: space.xxs, justifyContent: 'space-between' }]}>
          <Txt size={type.label} weight="bold" tone="muted" accessibilityRole="header" style={{ letterSpacing: 0.6 }}>
            {title.toUpperCase()}
          </Txt>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** One surface per group; rows inside are separated by hairlines, not boxed individually. */
export function Group({ children, style, ...rest }: ViewProps) {
  const { c } = useApp();
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View {...rest} style={[{ backgroundColor: c.surface, borderRadius: radius.card, overflow: 'hidden' }, style]}>
      {items.map((child, i) => (
        <View key={i} style={i > 0 ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line, marginLeft: space.md } : undefined}>
          {child}
        </View>
      ))}
    </View>
  );
}

export function Row({
  icon,
  title,
  subtitle,
  value,
  onPress,
  chevron,
  accessibilityLabel,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  value?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  accessibilityLabel?: string;
}) {
  const body = (
    <View style={[styles.row, { minHeight: 60, paddingVertical: space.sm, paddingRight: space.md }]}>
      {icon ? <View style={{ width: 28, alignItems: 'center', marginLeft: -2 }}>{icon}</View> : null}
      <View style={{ flex: 1, minWidth: 0, marginLeft: icon ? 0 : 0 }}>
        <Txt size={type.body} weight="semibold" numberOfLines={1}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt size={type.label} tone="muted" numberOfLines={2}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {typeof value === 'string' ? (
        <Txt size={type.label} weight="semibold" tone="muted">
          {value}
        </Txt>
      ) : (
        value
      )}
      {chevron ? <ChevronRightIcon /> : null}
    </View>
  );
  if (!onPress) return <View style={{ paddingLeft: space.md }}>{body}</View>;
  return <PressRow onPress={onPress} label={accessibilityLabel ?? title}>{body}</PressRow>;
}

function ChevronRightIcon() {
  const { c } = useApp();
  return <ChevronRight size={18} color={c.faint} />;
}

function PressRow({ onPress, label, children }: { onPress: () => void; label: string; children: React.ReactNode }) {
  const { c } = useApp();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({ paddingLeft: space.md, backgroundColor: pressed ? c.raised : 'transparent' })}
    >
      {children}
    </Pressable>
  );
}

export function Surface({ style, children, ...rest }: ViewProps) {
  const { c } = useApp();
  return (
    <View {...rest} style={[{ backgroundColor: c.surface, borderRadius: radius.card, padding: space.lg, gap: space.md }, style]}>
      {children}
    </View>
  );
}

export type Verification = 'official' | 'community' | 'unavailable';

/** Verification shown by text label plus shape (solid / dashed / outline), never color alone. */
export function StatusChip({ kind }: { kind: Verification }) {
  const { c, t } = useApp();
  const color = kind === 'official' ? c.official : kind === 'community' ? c.community : c.unknown;
  const label = kind === 'official' ? t('official') : kind === 'community' ? t('community') : t('unavailable');
  return (
    <View
      style={[
        styles.chip,
        kind === 'official'
          ? { backgroundColor: color }
          : { borderWidth: 1.5, borderColor: color, borderStyle: kind === 'community' ? 'dashed' : 'solid' },
      ]}
    >
      <Text style={{ fontFamily: font.bold, fontSize: 11, letterSpacing: 0.5, color: kind === 'official' ? c.officialInk : color }}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

export function SourceLine({ source, kind, detail }: { source: string; kind: Verification; detail?: string }) {
  return (
    <View style={[styles.row, { flexWrap: 'wrap', paddingHorizontal: space.xxs }]}>
      <StatusChip kind={kind} />
      <Txt size={type.caption + 1} tone="muted" style={{ flexShrink: 1 }}>
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
  variant = 'secondary',
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
}) {
  const { c } = useApp();
  const primary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: primary ? c.accent : c.accentSoft, opacity: pressed ? 0.75 : 1 },
        style,
      ]}
    >
      {icon}
      <Txt size={type.body} weight="bold" style={{ color: primary ? c.accentInk : c.accent }}>
        {label}
      </Txt>
    </Pressable>
  );
}

export function LinkChip({ label, url }: { label: string; url: string }) {
  const { c } = useApp();
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => Linking.openURL(url).catch(() => {})}
      style={({ pressed }) => [styles.linkChip, { borderColor: c.line, backgroundColor: pressed ? c.raised : c.surface }]}
    >
      <Txt size={type.label} weight="semibold" tone="accent">
        {label} ↗
      </Txt>
    </Pressable>
  );
}

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  button: {
    minHeight: 50,
    borderRadius: radius.tile,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
  },
  linkChip: { paddingHorizontal: 14, minHeight: 40, borderRadius: radius.pill, justifyContent: 'center', borderWidth: 1 },
});
