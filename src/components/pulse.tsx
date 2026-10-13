import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useApp } from '../state/AppContext';
import { mark, type } from '../theme/tokens';
import { Txt } from './ui';

/** Custom PanaPulse P: the same connected-path geometry as the brand-kit app icon. */
export function PulseMark({ size = 36 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256" accessibilityElementsHidden importantForAccessibility="no">
      <Rect x={0} y={0} width={256} height={256} rx={62} fill={mark.tile} />
      <Path
        d="M 74 196 L 74 106 C 74 72 94 60 129 60 L 145 60 C 181 60 197 76 197 105 C 197 136 178 151 142 151 L 112 151"
        stroke={mark.letter} strokeWidth={34} strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
      <Path d="M 55 150 L 111 101 L 155 101" stroke={mark.spark} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Circle cx={155} cy={101} r={11} fill={mark.spark} />
    </Svg>
  );
}

export type PulseState = 'live' | 'scheduled' | 'stale' | 'none';

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
  const tone = (st: PulseState) => (st === 'live' || st === 'scheduled' ? c.accent : st === 'stale' ? c.stale : c.faint);

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
                  strokeDasharray={n.state === 'live' ? undefined : n.state === 'scheduled' ? '5 5' : n.state === 'stale' ? '1 5' : '3 6'}
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
              style={{ textAlign: 'center', color: n.state === 'live' || n.state === 'scheduled' ? c.accent : n.state === 'stale' ? c.stale : c.muted }}
            >
              {n.status}
            </Txt>
          </View>
        ))}
      </View>
    </View>
  );
}
