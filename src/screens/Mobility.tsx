import { Bus, TrainFront } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { Group, LinkChip, Row, Section, SourceLine, Txt, styles } from '../components/ui';
import { SERVICES } from '../data/services';
import { useApp } from '../state/AppContext';
import { space, type } from '../theme/tokens';

export function Mobility() {
  const { c, t } = useApp();
  return (
    <View style={{ gap: space.xl }}>
      <Txt size={type.display} weight="display" style={{ paddingHorizontal: space.xxs }} accessibilityRole="header">
        {t('mobilityTitle')}
      </Txt>
      <Section>
        <Group>
          <Row icon={<TrainFront size={20} color={c.muted} />} title={t('metroL1')} value={t('noLiveFeed')} />
          <Row icon={<TrainFront size={20} color={c.muted} />} title={t('metroL2')} value={t('noLiveFeed')} />
          <Row icon={<Bus size={20} color={c.muted} />} title={t('mibusRow')} subtitle="Metrobús" value={t('noLiveFeed')} />
        </Group>
        <SourceLine source="Metro de Panamá · MiBus" kind="unavailable" />
      </Section>
      <View style={{ gap: space.sm, paddingHorizontal: space.xxs }}>
        <Txt size={type.body} tone="muted">
          {t('mobilityNote')}
        </Txt>
        <View style={[styles.row, { flexWrap: 'wrap' }]}>
          <LinkChip label="Metro de Panamá" url={SERVICES.metro_l1.officialUrl} />
          <LinkChip label="MiBus" url={SERVICES.mibus.officialUrl} />
        </View>
        <Txt size={type.label} tone="faint">
          {t('mobilityPlan')}
        </Txt>
      </View>
    </View>
  );
}
