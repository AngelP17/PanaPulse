import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useApp } from '../state/AppContext';
import { type } from '../theme/tokens';
import { Txt } from './ui';

/** PanaPulse mark: a heartbeat stroke in a rounded square, in the brand accent. */
export function PulseMark({ size = 32 }: { size?: number }) {
  const { c } = useApp();
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" accessibilityElementsHidden importantForAccessibility="no">
      <Rect x={2} y={2} width={28} height={28} rx={9} fill={c.accent} />
      <Path d="M5 17h6l2.5-6 4 11 3-8 1.5 3H27" fill="none" stroke={c.accentInk} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export type PulseState = 'live' | 'stale' | 'none';

export interface PulseNode {
  label: string;
  status: string;
  state: PulseState;
  /** 0..1 spike height; only drawn for live nodes backed by real activity data. */
  intensity?: number;
}

/**
 * Signature component. One line across the user's area: solid where an official source is current,
 * amber dots where it's stale, faint dashes where there's no data, and a spike sized by real activity.
 */
export function PulseRail({ nodes }: { nodes: PulseNode[] }) {
  const { c } = useApp();
  const [w, setW] = useState(0);
  const H = 64;
  const base = 42;
  const step = w / nodes.length;
  const x = (i: number) => step * i + step / 2;
  const tone = (st: PulseState) => (st === 'live' ? c.accent : st === 'stale' ? c.stale : c.faint);

  return (
    <View accessibilityRole="summary" accessibilityLabel={nodes.map((n) => `${n.label}: ${n.status}`).join('. ')}>
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: H }}>
        {w > 0 ? (
          <Svg width={w} height={H}>
            {nodes.map((n, i) => {
              const x0 = step * i;
              const x1 = step * (i + 1);
              const cx = x(i);
              if (n.state === 'live' && n.intensity && n.intensity > 0) {
                const h = 10 + Math.min(1, n.intensity) * 26;
                return (
                  <Path key={i} d={`M${x0} ${base} H${cx - 15} l5 -6 l5 12 l5 ${-h - 6} l4 ${h + 4} l3 -4 H${x1}`} stroke={c.accent} strokeWidth={2.6} fill="none" strokeLinejoin="round" strokeLinecap="round" />
                );
              }
              return (
                <Path
                  key={i}
                  d={`M${x0} ${base} H${x1}`}
                  stroke={tone(n.state)}
                  strokeWidth={n.state === 'none' ? 1.6 : 2.4}
                  strokeDasharray={n.state === 'live' ? undefined : n.state === 'stale' ? '1 5' : '3 6'}
                  strokeLinecap="round"
                />
              );
            })}
            {nodes.map((n, i) => (
              <Circle key={i} cx={x(i)} cy={base} r={6.5} fill={n.state === 'live' ? c.accent : c.card} stroke={tone(n.state)} strokeWidth={2} />
            ))}
          </Svg>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row' }}>
        {nodes.map((n) => (
          <View key={n.label} style={{ flex: 1, alignItems: 'center', gap: 3, paddingHorizontal: 2 }}>
            <Txt size={type.body - 1} weight="bold" numberOfLines={1}>
              {n.label}
            </Txt>
            <Txt
              size={type.caption + 1}
              weight="semibold"
              numberOfLines={2}
              style={{ textAlign: 'center', color: n.state === 'live' ? c.accent : n.state === 'stale' ? c.stale : c.muted }}
            >
              {n.status}
            </Txt>
          </View>
        ))}
      </View>
    </View>
  );
}
