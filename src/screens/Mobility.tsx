import { Bus, Clock3, MapPin, TrainFront } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { Card, LinkChip, SourceLine, StatusChip, Txt, styles } from '../components/ui';
import { makeDemoScene, TransitId } from '../data/demo';
import { SERVICES } from '../data/services';
import { useApp } from '../state/AppContext';
import { radius, space, type } from '../theme/tokens';

export function Mobility() {
  const { c, t, demoEnabled, demoScenario, now } = useApp();
  const scene = makeDemoScene(now, demoScenario);
  const labels: Record<TransitId, string> = { metro1: t('metroL1'), metro2: t('metroL2'), mibus: t('mibus') };
  return (
    <View style={{ gap: space.md }}>
      <Txt size={type.hero - 10} weight="bold" style={{ paddingHorizontal: space.xs }} accessibilityRole="header">
        {t('mobilityTitle')}
      </Txt>
      {demoEnabled ? (
        <>
          <View accessibilityRole="text" style={{ backgroundColor: c.tileStrong, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: space.sm }}>
            <Txt size={type.label} weight="bold">{t('demoBanner')}</Txt>
            <Txt size={type.caption + 1} tone="muted">{t('demoBannerDetail')}</Txt>
          </View>
          <Card style={{ gap: space.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <MapPin size={20} color={c.accent} />
              <Txt size={type.title} weight="semibold">{t('demoTripTitle')}</Txt>
            </View>
            <Txt size={type.body} weight="bold">{t('tripHome')} → {t('tripWork')}</Txt>
            <View style={{ backgroundColor: c.tile, borderRadius: radius.tile, padding: space.md, gap: space.sm }}>
              {scene.transit.map((item, index) => (
                <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.xs }}>
                  <View style={{ width: 28, alignItems: 'center' }}>
                    {item.id === 'mibus' ? <Bus size={20} color={c.ink} /> : <TrainFront size={20} color={c.ink} />}
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt size={type.body} weight="semibold">{labels[item.id]}</Txt>
                    <Txt size={type.caption + 1} tone="muted">
                      {item.condition === 'delayed' ? t('demoDelay', { n: item.delayMinutes })
                        : item.condition === 'recovering' ? t('demoRecovering') : t('demoNormal')}
                    </Txt>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <Txt size={type.title} weight="bold" numeric>{t('demoEta', { n: item.arrivalMinutes })}</Txt>
                    <Txt size={type.caption} tone="muted">{t('demoArrival')}</Txt>
                  </View>
                </View>
              ))}
            </View>
            <SourceLine source={t('demoSource')} kind="unavailable" detail={t('demoNotice')} />
          </Card>
        </>
      ) : null}
      <Card style={{ gap: space.xs }}>
        <Txt size={type.title} weight="semibold">{demoEnabled ? t('demoSourceLabel') : t('mobilityNote')}</Txt>
        {([
          { key: 'l1', label: t('metroL1'), Icon: TrainFront },
          { key: 'l2', label: t('metroL2'), Icon: TrainFront },
          { key: 'bus', label: t('mibus'), Icon: Bus },
        ]).map(({ key, label, Icon }) => (
          <View key={key} style={[styles.row, { backgroundColor: c.tile, borderRadius: radius.tile, paddingHorizontal: space.md, minHeight: 56 }]}>
            <Icon size={20} color={c.muted} />
            <Txt size={type.body} weight="semibold" style={{ flex: 1 }}>{label}</Txt>
            <StatusChip kind="unavailable" />
          </View>
        ))}
        <View style={[styles.row, { flexWrap: 'wrap', marginTop: space.xs }]}>
          <LinkChip label="Metro de Panamá" url={SERVICES.metro_l1.officialUrl} />
          <LinkChip label="MiBus" url={SERVICES.mibus.officialUrl} />
        </View>
        <SourceLine source="Metro de Panamá · MiBus" kind="unavailable" />
      </Card>
    </View>
  );
}
