import { Activity, Bus, Droplets, Megaphone, TrainFront, Zap } from 'lucide-react-native';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { HeroCard, Eyebrow, StatusPill } from '../components/glance';
import { SectionHeading } from '../components/section';
import { PressScale } from '../components/motion';
import { Button, Card, CardHeader, SourceLine, StatusChip, Txt, styles } from '../components/ui';
import { makeDemoScene, DemoScenario, DemoUtilityState, TransitId } from '../data/demo';
import { useApp } from '../state/AppContext';
import { radius, space, type } from '../theme/tokens';

/**
 * Demonstration surfaces REPLACE live-source surfaces while Demo Mode is enabled.
 * No card below implies that a provider confirmed any simulated fact.
 */
function DemoBanner() {
  const { c, t, demoScenario, setDemoScenario } = useApp();
  const scenarios: { id: DemoScenario; label: string }[] = [
    { id: 'everyday', label: t('demoEveryday') },
    { id: 'disruption', label: t('demoDisruption') },
    { id: 'recovery', label: t('demoRecovery') },
  ];
  return (
    <View style={{ borderRadius: radius.tile, backgroundColor: c.tileStrong, padding: space.md, gap: space.sm }}>
      <Txt size={type.label} weight="bold" accessibilityRole="header">{t('demoBanner')}</Txt>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        accessibilityLabel={t('demoChange')} contentContainerStyle={{ gap: space.xs }}>
        {scenarios.map((s) => (
          <PressScale key={s.id} onPress={() => setDemoScenario(s.id)}
            accessibilityRole="button" accessibilityLabel={s.label}
            accessibilityState={{ selected: demoScenario === s.id }}
            style={{ minHeight: 44, justifyContent: 'center', borderRadius: radius.pill,
              backgroundColor: demoScenario === s.id ? c.navActive : c.card,
              paddingHorizontal: space.md }}>
            <Txt size={type.label} weight="semibold"
              style={{ color: demoScenario === s.id ? c.navActiveInk : c.ink }}>{s.label}</Txt>
          </PressScale>
        ))}
      </ScrollView>
      <Txt size={type.caption + 1} tone="muted">{t('demoBannerDetail')}</Txt>
    </View>
  );
}

function utilityCopy(state: DemoUtilityState, service: 'power' | 'water', t: ReturnType<typeof useApp>['t']) {
  if (service === 'power') return state === 'interrupted' ? t('demoPowerInterrupted')
    : state === 'recovering' ? t('demoPowerRecovering') : t('demoPowerScheduled');
  return state === 'interrupted' ? t('demoWaterInterrupted')
    : state === 'recovering' ? t('demoWaterRecovering') : t('demoWaterNormal');
}

export function DemoHome() {
  const { c, t, now, demoScenario, go } = useApp();
  const scene = makeDemoScene(now, demoScenario);
  const power = utilityCopy(scene.power, 'power', t);
  const water = utilityCopy(scene.water, 'water', t);
  const transit = scene.transit[0];
  return (
    <View style={{ gap: space.md }}>
      <DemoBanner />
      <View style={{ paddingHorizontal: space.xs, gap: 3 }}>
        <Eyebrow>{t('areaEyebrow')}</Eyebrow>
        <Txt size={type.hero} weight="bold" accessibilityRole="header" style={{ letterSpacing: -1 }}>Pueblo Nuevo</Txt>
        <Txt size={type.label} tone="muted">{t('demoSource')}</Txt>
      </View>
      <HeroCard eyebrow={t('demoQuakeOverview')} icon={<Activity size={18} color={c.ink} />}
        headline={t('demoQuakeHero', { mag: scene.quake.magnitude.toFixed(1), place: scene.quake.location })}
        detail={t('demoQuakeDetail', { n: scene.quake.minutesAgo })}
        verification="demo" provenance={t('demoSource')}
        action={t('demoQuakeAction')} onAction={() => go('quakes')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: space.xs, paddingVertical: space.xxs }}>
        <StatusPill kind="demo" label={t('demoStatusPower', { status: power })} onPress={() => go('services')} />
        <StatusPill kind="demo" label={t('demoStatusWater', { status: water })} onPress={() => go('services')} />
        <StatusPill kind="demo" label={t('demoStatusMobility', { status: transit.condition === 'delayed' ? t('demoTransitDelayed') :
          transit.condition === 'recovering' ? t('demoTransitRecovering') : t('demoTransitOnTime') })}
          onPress={() => go('mobility')} />
      </ScrollView>
      <SectionHeading title={t('categoryServices')} subtitle={t('demoRealtimeDescription')} />
      <Card style={{ gap: space.md }}>
        <View style={styles.row}>
          <Zap size={20} color={c.ink} />
          <Txt size={type.body} weight="semibold" style={{ flex: 1 }}>{t('power')}</Txt>
          <StatusChip kind="demo" />
        </View>
        <Txt size={type.title + 3} weight="bold">{power}</Txt>
        <Txt size={type.label} tone="muted">{t('demoNotice')}</Txt>
        <Button label={t('viewServices')} onPress={() => go('services')} />
      </Card>
      <Card style={{ gap: space.sm }}>
        <CardHeader icon={<TrainFront size={20} color={c.ink} />} title={t('demoTripTitle')} />
        <Txt size={type.body} weight="semibold">{t('tripHome')} → {t('tripWork')}</Txt>
        <Txt size={type.title + 4} weight="bold" numeric>
          {t('metroL1')} · {t('demoEta', { n: transit.arrivalMinutes })}
        </Txt>
        <Txt size={type.label} tone="muted">{t('demoArrival')} · {t('demoSource')}</Txt>
        <Button label={t('tabMobility')} onPress={() => go('mobility')} />
      </Card>
      <Card style={{ gap: space.sm }}>
        <CardHeader icon={<Megaphone size={18} color={c.ink} />} title={t('reportHomeTitle')} />
        <Txt size={type.body} weight="semibold">{t('demoDemoCount', { n: scene.communityReports })}</Txt>
        <Txt size={type.label} tone="muted">{t('demoNotice')}</Txt>
        <Button label={t('reportHomeAction')} onPress={() => go('report')} />
      </Card>
    </View>
  );
}

export function DemoMobility() {
  const { c, t, demoScenario, now } = useApp();
  const scene = makeDemoScene(now, demoScenario);
  const labels: Record<TransitId, string> = { metro1: t('metroL1'), metro2: t('metroL2'), mibus: t('mibus') };
  return (
    <View style={{ gap: space.md }}>
      <DemoBanner />
      <Txt size={type.hero - 10} weight="bold" accessibilityRole="header">{t('mobilityTitle')}</Txt>
      <Card>
        <CardHeader icon={<TrainFront size={20} color={c.ink} />} title={t('demoTripTitle')} />
        <Txt size={type.body} weight="semibold">{t('tripHome')} → {t('tripWork')}</Txt>
        <View style={{ backgroundColor: c.tile, borderRadius: radius.tile, padding: space.md, gap: space.sm }}>
          {scene.transit.map((item) => (
            <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 76 }}>
              {item.id === 'mibus' ? <Bus size={22} color={c.ink} /> : <TrainFront size={22} color={c.ink} />}
              <View style={{ flex: 1, gap: 3 }}>
                <Txt size={type.body} weight="semibold">{labels[item.id]}</Txt>
                <Txt size={type.caption + 1} tone="muted">
                  {item.condition === 'delayed' ? t('demoDelay', { n: item.delayMinutes }) :
                    item.condition === 'recovering' ? t('demoRecovering') : t('demoNormal')}
                </Txt>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                <Txt size={type.title + 4} weight="bold" numeric>{t('demoEta', { n: item.arrivalMinutes })}</Txt>
                <Txt size={type.caption} tone="muted">{t('demoArrival')}</Txt>
              </View>
            </View>
          ))}
        </View>
        <SourceLine source={t('demoSource')} kind="demo" detail={t('demoNotice')} />
      </Card>
    </View>
  );
}

function DemoUtilityCard({ service, state }: { service: 'power' | 'water'; state: DemoUtilityState }) {
  const { c, t } = useApp();
  const name = service === 'power' ? t('power') : t('water');
  return (
    <Card>
      <CardHeader
        icon={service === 'power' ? <Zap size={20} color={c.ink} /> : <Droplets size={20} color={c.ink} />}
        title={name} right={<StatusChip kind="demo" />} />
      <Txt size={type.title + 5} weight="bold">{utilityCopy(state, service, t)}</Txt>
      <Txt size={type.body} tone="muted">{t('demoRealtimeDescription')}</Txt>
      <SourceLine kind="demo" source={t('demoExampleProvider')} detail={t('demoNotice')} />
    </Card>
  );
}

export function DemoServices() {
  const { c, t, now, demoScenario, go } = useApp();
  const scene = makeDemoScene(now, demoScenario);
  return (
    <View style={{ gap: space.md }}>
      <DemoBanner />
      <Txt size={type.hero - 10} weight="bold" accessibilityRole="header">{t('categoryServices')}</Txt>
      <SectionHeading title={t('demoOverviewTitle')} subtitle={t('demoRealtimeDescription')} />
      <DemoUtilityCard service="power" state={scene.power} />
      <DemoUtilityCard service="water" state={scene.water} />
      <Card style={{ gap: space.sm }}>
        <CardHeader icon={<Megaphone size={20} color={c.ink} />} title={t('categoryCommunity')} />
        <Txt size={type.body} weight="semibold">{t('demoDemoCount', { n: scene.communityReports })}</Txt>
        <Txt size={type.label} tone="muted">{t('demoNotice')}</Txt>
        <Button label={t('reportHomeAction')} onPress={() => go('report')} />
      </Card>
    </View>
  );
}

export function DemoQuakes() {
  const { c, t, now, demoScenario, setDemoEnabled } = useApp();
  const scene = makeDemoScene(now, demoScenario);
  return (
    <View style={{ gap: space.md }}>
      <DemoBanner />
      <Txt size={type.hero - 10} weight="bold" accessibilityRole="header">{t('quakesTitle')}</Txt>
      <Card>
        <CardHeader icon={<Activity size={20} color={c.ink} />} title={t('demoQuakeListTitle')}
          right={<StatusChip kind="demo" />} />
        <Txt size={type.stat + 3} weight="bold" numeric>{t('demoChip')} · M{scene.quake.magnitude.toFixed(1)}</Txt>
        <Txt size={type.title} weight="semibold">{scene.quake.location}</Txt>
        <Txt size={type.body} tone="muted">{t('demoQuakeDetail', { n: scene.quake.minutesAgo })}</Txt>
        <SourceLine source={t('demoSource')} kind="demo" detail={t('demoQuakeSub')} />
      </Card>
      <Txt size={type.label} tone="muted">{t('demoForecastUnavailable')}</Txt>
      {/* Real USGS events are hidden in Demo Mode: always say how to get them back. */}
      <Card style={{ gap: space.sm }}>
        <Txt size={type.body} weight="semibold">{t('demoSourcesDetail')}</Txt>
        <Button label={t('demoTurnOff')} onPress={() => setDemoEnabled(false)} />
      </Card>
    </View>
  );
}
