import { Bus, TrainFront } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { Card, LinkChip, SourceLine, StatusChip, Txt, styles } from '../components/ui';
import { DemoMobility } from './DemoScreens';
import { SERVICES } from '../data/services';
import { useApp } from '../state/AppContext';
import { radius, space, type } from '../theme/tokens';

/** No transit live ETA provider is connected yet, so preview is optional and visibly fictional. */
export function Mobility() {
  const { c, t, demoEnabled } = useApp();
  if (demoEnabled) return <DemoMobility />;
  const rows = [
    { key: 'l1', label: t('metroL1'), Icon: TrainFront },
    { key: 'l2', label: t('metroL2'), Icon: TrainFront },
    { key: 'bus', label: t('mibus'), Icon: Bus },
  ];
  return (
    <View style={{ gap: space.md }}>
      <Txt size={type.hero - 10} weight="bold" accessibilityRole="header">{t('mobilityTitle')}</Txt>
      <Card style={{ gap: space.sm }}>
        <Txt size={type.body} tone="muted">{t('mobilityNote')}</Txt>
        {rows.map(({ key, label, Icon }) => (
          <View key={key} style={[styles.row, { backgroundColor: c.tile, borderRadius: radius.tile, paddingHorizontal: space.md, minHeight: 56 }]}>
            <Icon size={20} color={c.muted} />
            <Txt size={type.body} weight="semibold" style={{ flex: 1 }}>{label}</Txt>
            <StatusChip kind="unavailable" />
          </View>
        ))}
        <View style={[styles.row, { flexWrap: 'wrap' }]}>
          <LinkChip label="Metro de Panamá" url={SERVICES.metro_l1.officialUrl} />
          <LinkChip label="MiBus" url={SERVICES.mibus.officialUrl} />
        </View>
      </Card>
      <SourceLine source="Metro de Panamá · MiBus" kind="unavailable" />
    </View>
  );
}
