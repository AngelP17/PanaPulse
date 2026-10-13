import { Bus, Droplets, Megaphone, TrainFront, Zap } from 'lucide-react-native';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { PressScale } from '../components/motion';
import { Button, Card, CardHeader, LinkChip, Txt } from '../components/ui';
import type { DemoScenario, DemoUtilityState, TransitId } from '../data/demo';
import { makeDemoScene } from '../data/demo';
import { useApp } from '../state/AppContext';
import { radius, space, type } from '../theme/tokens';

/** One global Preview indicator is in the Shell; content here reads like a real product. */
export function DemoControls() {
  const { c, t, demoScenario, setDemoScenario } = useApp();
  const choices: { id: DemoScenario; label: string }[] = [
    { id: 'everyday', label: t('demoEveryday') },
    { id: 'disruption', label: t('demoDisruption') },
    { id: 'recovery', label: t('demoRecovery') },
  ];
  return (
    <View style={{ borderRadius: radius.tile, backgroundColor: c.tileStrong, padding: space.sm, gap: space.xs }}>
      <Txt size={type.caption + 1} weight="semibold" tone="muted">{t('previewControlsTitle')}</Txt>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: space.xs }} accessibilityLabel={t('demoChange')}>
        {choices.map(({ id, label }) => {
          const selected = demoScenario === id;
          return (
            <PressScale key={id} onPress={() => setDemoScenario(id)}
              accessibilityRole="button" accessibilityLabel={label}
              accessibilityState={{ selected }}
              style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: space.md,
                borderRadius: radius.pill, backgroundColor: selected ? c.navActive : c.card }}>
              <Txt size={type.label} weight="semibold" style={{ color: selected ? c.navActiveInk : c.ink }}>{label}</Txt>
            </PressScale>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function demoUtilityCopy(state: DemoUtilityState, service: 'power' | 'water', t: ReturnType<typeof useApp>['t']) {
  if (service === 'power') return state === 'interrupted' ? t('previewPowerIssue')
    : state === 'recovering' ? t('previewPowerRestoring') : t('previewPowerPlan');
  return state === 'interrupted' ? t('previewWaterIssue')
    : state === 'recovering' ? t('previewWaterRecover') : t('previewWaterGood');
}

export function DemoUtilityCard({ service, state, onDetails }: {
  service: 'power' | 'water'; state: DemoUtilityState; onDetails?: () => void;
}) {
  const { c, t } = useApp();
  const name = service === 'power' ? t('power') : t('water');
  return (
    <Card style={{ gap: space.sm }}>
      <CardHeader icon={service === 'power' ? <Zap size={20} color={c.ink} /> : <Droplets size={20} color={c.ink} />}
        title={name} />
      <Txt size={type.title + 4} weight="bold">{demoUtilityCopy(state, service, t)}</Txt>
      <Txt size={type.label} tone="muted">{t('previewHomeCaption')}</Txt>
      {onDetails ? <Button label={t('viewServices')} onPress={onDetails} /> : null}
    </Card>
  );
}

export function DemoCommuteCard({ onDetails }: { onDetails: () => void }) {
  const { c, t, now, demoScenario } = useApp();
  const scene = makeDemoScene(now, demoScenario);
  return (
    <Card style={{ gap: space.sm }}>
      <CardHeader icon={<TrainFront size={20} color={c.ink} />} title={t('tripTitle')} />
      <Txt size={type.body} weight="semibold">{t('tripHome')} → {t('tripWork')}</Txt>
      <Txt size={type.title + 4} weight="bold" numeric>
        {t('metroL1')} · {t('demoEta', { n: scene.transit[0].arrivalMinutes })}
      </Txt>
      <Txt size={type.label} tone="muted">{t('previewArrival')} · {t('previewTransitMeta')}</Txt>
      <Button label={t('tabMobility')} onPress={onDetails} />
    </Card>
  );
}

export function DemoMobility() {
  const { c, t, demoScenario, now, demoCommuteSaved, setDemoCommuteSaved } = useApp();
  const scene = makeDemoScene(now, demoScenario);
  const names: Record<TransitId, string> = { metro1: t('metroL1'), metro2: t('metroL2'), mibus: t('mibus') };
  return (
    <View style={{ gap: space.md }}>
      <Txt size={type.hero - 10} weight="bold" accessibilityRole="header">{t('mobilityTitle')}</Txt>
      <DemoControls />
      <Card style={{ gap: space.md }}>
        <CardHeader icon={<TrainFront size={20} color={c.ink} />} title={t('tripTitle')} />
        <Txt size={type.body} weight="semibold">{t('tripHome')} → {t('tripWork')}</Txt>
        <Txt size={type.label} tone="muted">{t(demoCommuteSaved ? 'previewRouteSaved' : 'previewRouteNotSaved')}</Txt>
        <Button label={t(demoCommuteSaved ? 'previewRemoveRoute' : 'previewSaveRoute')}
          onPress={() => setDemoCommuteSaved(!demoCommuteSaved)} />
        <View style={{ backgroundColor: c.tile, padding: space.md, borderRadius: radius.tile, gap: space.md }}>
          {scene.transit.map((item) => (
            <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 62 }}>
              {item.id === 'mibus' ? <Bus size={22} color={c.ink} /> : <TrainFront size={22} color={c.ink} />}
              <View style={{ flex: 1, gap: 3 }}>
                <Txt size={type.body} weight="semibold">{names[item.id]}</Txt>
                <Txt size={type.label} tone="muted">
                  {item.condition === 'delayed' ? t('previewTransitDelayed')
                    : item.condition === 'recovering' ? t('previewTransitRecover')
                    : t('previewTransitOnTime')}
                </Txt>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                <Txt size={type.title + 3} weight="bold" numeric>{t('demoEta', { n: item.arrivalMinutes })}</Txt>
                <Txt size={type.caption} tone="muted">{t('previewArrival')}</Txt>
              </View>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}

export function PreviewServices() {
  const { c, t, now, demoScenario, demoReports, go } = useApp();
  const scene = makeDemoScene(now, demoScenario);
  return (
    <View style={{ gap: space.md }}>
      <Txt size={type.hero - 10} weight="bold" accessibilityRole="header">{t('categoryServices')}</Txt>
      <Txt size={type.label} tone="muted">{t('previewHomeCaption')}</Txt>
      <DemoControls />
      <DemoUtilityCard service="power" state={scene.power} />
      <DemoUtilityCard service="water" state={scene.water} />
      <Card style={{ gap: space.sm }}>
        <CardHeader icon={<Megaphone size={20} color={c.ink} />} title={t('previewSectionCommunity')} />
        <Txt size={type.title + 3} weight="bold" numeric>
          {t('previewReports', { n: scene.communityReports + demoReports })}
        </Txt>
        <Button label={t('reportHomeAction')} onPress={() => go('report')} />
      </Card>
      <Card style={{ gap: space.xs }}>
        <Txt size={type.label} weight="semibold" tone="muted">{t('realSourceLinksTitle')}</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
          <LinkChip label="Naturgy" url="https://www.naturgy.com.pa/cronogramas-mantenimiento/" />
          <LinkChip label="ENSA" url="https://ensa.com.pa/mantenimientos-programados/" />
          <LinkChip label="IDAAN" url="https://www.idaan.gob.pa/" />
        </View>
      </Card>
      <Button label={t('previewSourceDetails')} onPress={() => go('settings')} />
    </View>
  );
}
