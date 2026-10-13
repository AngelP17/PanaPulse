import { BadgeCheck, Clock, CloudOff, Percent, Users } from 'lucide-react-native';
import React from 'react';
import { Pressable, View } from 'react-native';
import { useApp } from '../state/AppContext';
import { space, type } from '../theme/tokens';
import { PressScale } from './motion';
import { Button, Card, StatusChip, Txt, Verification, styles } from './ui';

/** Small uppercase label above a headline. Typography does the hierarchy; no rules or accent bars. */
export function Eyebrow({ children, color }: { children: string; color?: string }) {
  const { c } = useApp();
  return (
    <Txt size={type.caption} weight="bold" style={{ letterSpacing: 1.2, color: color ?? c.muted }}>
      {children}
    </Txt>
  );
}

/**
 * The one primary card on Home. Answers: what happened (headline), when (detail),
 * who confirmed it and how fresh it is (verification chip + provenance), and what to do next (action).
 */
export function HeroCard({
  eyebrow,
  icon,
  headline,
  detail,
  alertLine,
  extra,
  verification,
  provenance,
  action,
  onAction,
}: {
  eyebrow: string;
  icon?: React.ReactNode;
  headline: string;
  detail: string;
  /** Only for a genuinely active issue (USGS PAGER orange/red). Rendered in alert red with its words. */
  alertLine?: string;
  extra?: string;
  verification: Verification;
  provenance: string;
  action: string;
  onAction: () => void;
}) {
  const { c } = useApp();
  return (
    <Card style={{ padding: space.xl, gap: space.lg }}>
      <View style={[styles.row, { gap: space.xs }]}>
        {icon}
        <Eyebrow color={alertLine ? c.alert : undefined}>{eyebrow}</Eyebrow>
      </View>
      <View style={{ gap: space.xs }}>
        <Txt size={type.hero - 14} weight="bold" accessibilityRole="header" style={{ lineHeight: 36, letterSpacing: -0.5 }}>
          {headline}
        </Txt>
        {alertLine ? (
          <Txt size={type.body} weight="bold" style={{ color: c.alert }}>
            {alertLine}
          </Txt>
        ) : null}
        <Txt size={type.body} tone="muted">
          {detail}
        </Txt>
        {extra ? (
          <Txt size={type.label} tone="muted" numeric>
            {extra}
          </Txt>
        ) : null}
      </View>
      <View style={[styles.row, { flexWrap: 'wrap', gap: space.xs }]}>
        <StatusChip kind={verification} />
        <Txt size={type.label} tone="muted" numeric style={{ flexShrink: 1 }}>
          {provenance}
        </Txt>
      </View>
      <Button label={action} variant="solid" onPress={onAction} />
    </Card>
  );
}

/** How a chip's fact is known. The icon says it in a shape, the words say it in full. */
export type PillKind = 'official' | 'forecast' | 'stale' | 'community' | 'demo';

export function StatusPill({ kind, label, onPress }: { kind: PillKind; label: string; onPress: () => void }) {
  const { c } = useApp();
  const icon =
    kind === 'official' ? <BadgeCheck size={17} color={c.official} strokeWidth={2.2} />
    : kind === 'stale' ? <Clock size={17} color={c.stale} strokeWidth={2.2} />
    : kind === 'community' ? <Users size={17} color={c.community} strokeWidth={2.2} />
    : <Percent size={17} color={c.ink} strokeWidth={2.2} />;
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.row, { gap: space.xs, minHeight: 44, paddingHorizontal: space.md, borderRadius: 999, backgroundColor: c.card, borderWidth: 1, borderColor: c.line }]}
    >
      {icon}
      <Txt size={type.label} weight="semibold" numberOfLines={1}>
        {label}
      </Txt>
    </PressScale>
  );
}

/** Every unavailable feed, collapsed into one quiet line instead of a slot each. */
export function OfflineLine({ text, action, onAction }: { text: string; action: string; onAction: () => void }) {
  const { c } = useApp();
  return (
    <View style={[styles.row, { paddingLeft: space.xs, gap: space.xs }]}>
      <CloudOff size={16} color={c.faint} />
      <Txt size={type.label} tone="muted" style={{ flex: 1 }}>
        {text}
      </Txt>
      <Pressable accessibilityRole="link" accessibilityLabel={action} onPress={onAction} hitSlop={8} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: space.xs }}>
        <Txt size={type.label} weight="semibold" style={{ color: c.accent }}>
          {action}
        </Txt>
      </Pressable>
    </View>
  );
}
