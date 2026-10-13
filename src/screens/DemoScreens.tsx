import { Bus, Droplets, TrainFront, Zap } from 'lucide-react-native';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { PressScale } from '../components/motion';
import { Button, Card, CardHeader, LinkChip, SourceLine, StatusChip, Txt } from '../components/ui';
import type { DemoScenario, DemoUtilityState, TransitId } from '../data/demo';
import { makeDemoScene } from '../data/demo';
import { SERVICES } from '../data/services';
import { useApp } from '../state/AppContext';
import { radius, space, type } from '../theme/tokens';

/** One small control strip for the whole preview. Demo labels belong to example facts, not real sources. */
export function DemoControls() {
  const { c, t, demoScenario, setDemoScenario } = useApp();
  const scenarios: { id: DemoScenario; label: string }[] = [
    { id: 'everyday', label: t('demoEveryday') },
    { id: 'disruption', label: t('demoDisruption') },
    { id: 'recovery', label: t('demoRecovery') },
  ];
  return (
    <View style={{ borderRadius: radius.tile, backgroundColor: c.tileStrong, padding: space.sm, gap: space.xs }}>
      <Txt size={type.caption + 1} weight="semibold" tone="muted">{t('demoPreviewTitle')}</Txt>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        accessibilityLabel={t('demoChange')} contentContainerStyle={{ gap: space.xs }}>
        {scenarios.map((s) => {
          const selected = demoScenario === s.id;
          return (
            <PressScale key={s.id} onPress={() => setDemoScenario(s.id)} accessibilityRole="button"
              accessibilityState={{ selected }} accessibilityLabel={s.label}
              style={{ minHeight: 44, justifyContent: 'center', borderRadius: radius.pill,
                backgroundColor: selected ? c.navActive : c.card, paddingHorizontal: space.md }}>
              <Txt size={type.label} weight="semibold" style={{ color: selected ? c.navActiveInk : c.ink }}>
                {s.label}
              </Txt>
            </PressScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function demoUtilityCopy(state: DemoUtilityState, service: 'power' | 'water', t: ReturnType<typeof useApp>['t']): string {
  if (service === 'power') {
    return state === 'interrupted' ? t('demoPowerInterrupted')
      : state === 'recovering' ? t('demoPowerRecovering') : t('demoPowerScheduled');
  }
  return state === 'interrupted' ? t('demoWaterInterrupted')
    : state === 'recovering' ? t('demoWaterRecovering') : t('demoWaterNormal');
}

/** Fallback example card only. Real current provider data takes precedence in the calling screen. */
export function DemoUtilityCard({
  service, state, onDetails,
}: { service: 'power' | 'water'; state: DemoUtilityState; onDetails?: () => void }) {
  const { c, t } = useApp();
  return (
    <Card style={{ gap: space.sm }}>
      <CardHeader icon={service === 'power' ? <Zap size={20} color={c.ink} /> : <Droplets size={20} color={c.ink} />}
        title={service === 'power' ? t('power') : t('water')} right={<StatusChip kind="demo" />} />
      <Txt size={type.title + 3} weight="bold">{demoUtilityCopy(state, service, t)}</Txt>
      <Txt size={type.label} tone="muted">{t('demoRealtimeDescription')}</Txt>
      <SourceLine source={t('demoExampleProvider')} kind="demo" />
      {onDetails ? <Button label={t('viewServices')} onPress={onDetails} /> : null}
    </Card>
  );
}

/** A product-preview route, not a saved commute or an operator arrival estimate. */
export function DemoCommuteCard({ onDetails }: { onDetails: () => void }) {
  const { c, t, now, demoScenario } = useApp();
  const scene = makeDemoScene(now, demoScenario);
  return (
    <Card style={{ gap: space.sm }}>
      <CardHeader icon={<TrainFront size={20} color={c.ink} />} title={t('demoTripTitle')}
        right={<StatusChip kind="demo" />} />
      <Txt size={type.body} weight="semibold">{t('tripHome')} → {t('tripWork')}</Txt>
      <Txt size={type.title + 3} weight="bold" numeric>
        {t('metroL1')} · {t('demoEta', { n: scene.transit[0].arrivalMinutes })}
      </Txt>
      <Txt size={type.label} tone="muted">{t('demoArrival')} · {t('demoSource')}</Txt>
      <Button label={t('tabMobility')} onPress={onDetails} />
    </Card>
  );
}

/** Transit currently has no authorized live ETA integration. Preview is always individually labeled. */
export function DemoMobility() {
  const { c, t, demoScenario, now } = useApp();
  const scene = makeDemoScene(now, demoScenario);
  const labels: Record<TransitId, string> = { metro1: t('metroL1'), metro2: t('metroL2'), mibus: t('mibus') };
  return (
    <View style={{ gap: space.md }}>
      <Txt size={type.hero - 10} weight="bold" accessibilityRole="header">{t('mobilityTitle')}</Txt>
      <DemoControls />
      <Card>
        <CardHeader icon={<TrainFront size={20} color={c.ink} />} title={t('demoTripTitle')}
          right={<StatusChip kind="demo" />} />
        <Txt size={type.body} weight="semibold">{t('tripHome')} → {t('tripWork')}</Txt>
        <View style={{ backgroundColor: c.tile, borderRadius: radius.tile, padding: space.md, gap: space.sm }}>
          {scene.transit.map((item) => (
            <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 76 }}>
              {item.id === 'mibus' ? <Bus size={22} color={c.ink} /> : <TrainFront size={22} color={c.ink} />}
              <View style={{ flex: 1, gap: 3 }}>
                <Txt size={type.body} weight="semibold">{labels[item.id]}</Txt>
                <Txt size={type.caption + 1} tone="muted">
                  {item.condition === 'delayed' ? t('demoDelay', { n: item.delayMinutes })
                    : item.condition === 'recovering' ? t('demoRecovering') : t('demoNormal')}
                </Txt>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                <Txt size={type.title + 2} weight="bold" numeric>{t('demoEta', { n: item.arrivalMinutes })}</Txt>
                <Txt size={type.caption} tone="muted">{t('demoArrival')}</Txt>
              </View>
            </View>
          ))}
        </View>
        <SourceLine source={t('demoSource')} kind="demo" detail={t('demoNotice')} />
      </Card>
      <Card style={{ gap: space.sm }}>
        <Txt size={type.body} weight="semibold">{t('realSourceLinksTitle')}</Txt>
        <Txt size={type.label} tone="muted">{t('realTransitUnconnected')}</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
          <LinkChip label="Metro de Panamá" url={SERVICES.metro_l1.officialUrl} />
          <LinkChip label="MiBus" url={SERVICES.mibus.officialUrl} />
        </View>
      </Card>
    </View>
  );
}
