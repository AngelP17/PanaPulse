import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useApp } from '../state/AppContext';
import { space, type } from '../theme/tokens';
import { Txt } from './ui';

/** Brand mark: a single heartbeat stroke inside a rounded square. */
export function PulseMark({ size = 30 }: { size?: number }) {
  const { c } = useApp();
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" accessibilityElementsHidden importantForAccessibility="no">
      <Path d="M8 2h16a6 6 0 0 1 6 6v16a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z" fill={c.accent} />
      <Path
        d="M5 17h6l2.5-6 4 11 3-8 1.5 3H27"
        fill="none"
        stroke={c.accentInk}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export interface PulseNode {
  label: string;
  status: string;
  live: boolean; // an official source is connected and current
  intensity?: number; // 0..1, drawn as spike height; only for live nodes with real activity
}

/**
 * Signature component: one line across the user's area. Solid where an official source
 * reports, dotted where there is no signal, with a spike sized by real activity
 * (for quakes: the USGS M6+ one-week probability).
 */
export function PulseRail({ nodes }: { nodes: PulseNode[] }) {
  const { c } = useApp();
  const [w, setW] = useState(0);
  const H = 58;
  const base = 38;
  const n = nodes.length;
  const step = w / n;
  const x = (i: number) => step * i + step / 2;

  const segments = nodes.map((node, i) => {
    const x0 = step * i;
    const x1 = step * (i + 1);
    const cx = x(i);
    if (node.live && node.intensity && node.intensity > 0) {
      const h = 8 + Math.min(1, node.intensity) * 26; // spike height from real data
      const d = `M${x0} ${base} H${cx - 14} l5 -6 l5 ${6 + 6} l4 ${-h - 6} l4 ${h + 4} l3 -4 H${x1}`;
      return <Path key={i} d={d} stroke={c.accent} strokeWidth={2.2} fill="none" strokeLinejoin="round" strokeLinecap="round" />;
    }
    return (
      <Path
        key={i}
        d={`M${x0} ${base} H${x1}`}
        stroke={node.live ? c.accent : c.faint}
        strokeWidth={node.live ? 2.2 : 1.6}
        strokeDasharray={node.live ? undefined : '2 5'}
        strokeLinecap="round"
      />
    );
  });

  return (
    <View accessibilityRole="summary" accessibilityLabel={nodes.map((nd) => `${nd.label}: ${nd.status}`).join('. ')}>
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height: H }}>
        {w > 0 ? (
          <Svg width={w} height={H}>
            {segments}
            {nodes.map((node, i) => (
              <Circle
                key={i}
                cx={x(i)}
                cy={base}
                r={5.5}
                fill={node.live ? c.accent : c.surface}
                stroke={node.live ? c.accent : c.faint}
                strokeWidth={1.8}
              />
            ))}
          </Svg>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row' }}>
        {nodes.map((node) => (
          <View key={node.label} style={{ flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: 2 }}>
            <Txt size={type.label} weight="bold" numberOfLines={1}>
              {node.label}
            </Txt>
            <Txt size={type.caption} tone={node.live ? 'accent' : 'faint'} weight="semibold" numberOfLines={2} style={{ textAlign: 'center' }}>
              {node.status}
            </Txt>
          </View>
        ))}
      </View>
      <View style={{ height: space.xxs }} />
    </View>
  );
}
