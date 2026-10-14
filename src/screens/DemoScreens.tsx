import { Bus, Droplets, Megaphone, TrainFront, Zap } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useStackedPair } from '../components/layout';
import { PressScale } from '../components/motion';
import { Button, Card, CardHeader, LinkChip, Txt } from '../components/ui';
import type { DemoScenario, DemoUtilityState, TransitId } from '../data/demo';
import { makeDemoScene } from '../data/demo';
import { useApp } from '../state/AppContext';
import { NeighborhoodFeed } from '../components/NeighborhoodFeed';
import { previewServiceNotices } from '../data/previewNotices';
import { ago } from '../data/format';
import { radius, space, type } from '../theme/tokens';
import { CORREGIMIENTOS } from '../data/services';

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
      <View accessibilityLabel={t('demoChange')} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
        {choices.map(({ id, label }) => {
          const selected = demoScenario === id;
          return (
            <PressScale key={id} onPress={() => setDemoScenario(id)}
              accessibilityRole="button" accessibilityLabel={label}
              accessibilityState={{ selected }}
              style={{ minHeight: 44, justifyContent: 'center', alignItems: 'center', flexGrow: 1, paddingHorizontal: space.md,
                borderRadius: radius.pill, backgroundColor: selected ? c.navActive : c.card }}>
              <Txt size={type.label} weight="semibold" style={{ color: selected ? c.navActiveInk : c.ink }}>{label}</Txt>
            </PressScale>
          );
        })}
      </View>
    </View>
  );
}

export function demoUtilityCopy(state: DemoUtilityState, service: 'power' | 'water', t: ReturnType<typeof useApp>['t']) {
  if (service === 'power') return state === 'interrupted' ? t('previewPowerIssue')
    : state === 'recovering' ? t('previewPowerRestoring') : t('previewPowerPlan');
  return state === 'interrupted' ? t('previewWaterIssue')
    : state === 'recovering' ? t('previewWaterRecover') : t('previewWaterGood');
}

export function DemoUtilityCard({ service, state, onDetails, compact = false }: {
  service: 'power' | 'water'; state: DemoUtilityState; onDetails?: () => void;
  /** Used in a two-column pair: smaller headline and padding so long words never break mid-word. */
  compact?: boolean;
}) {
  const { c, t } = useApp();
  const name = service === 'power' ? t('power') : t('water');
  return (
    <Card style={compact ? { gap: space.sm, padding: space.md, flex: 1 } : { gap: space.sm }}>
      <CardHeader icon={service === 'power' ? <Zap size={20} color={c.ink} /> : <Droplets size={20} color={c.ink} />}
        title={name} />
      <Txt size={compact ? type.body : type.title + 4} weight="bold">{demoUtilityCopy(state, service, t)}</Txt>
      {compact ? null : <Txt size={type.label} tone="muted">{t('previewHomeCaption')}</Txt>}
      {onDetails ? <Button label={t('viewServices')} onPress={onDetails} /> : null}
    </Card>
  );
}

/** Home and Mobility read the exact same saved journey and selected route. */
export function DemoCommuteCard({ onDetails }: { onDetails: () => void }) {
  const { c, t, now, demoScenario, commute } = useApp();
  const scene = makeDemoScene(now, demoScenario);
  const active = scene.transit.find((item) => item.id === commute.preferred) ?? scene.transit[0];
  const modeLabel = commute.preferred === 'mibus' ? t('journeyRouteMibus')
    : commute.preferred === 'metro2' ? t('journeyRouteMetro2') : t('journeyRouteMetro1');
  return (
    <Card style={{ gap: space.sm }}>
      <CardHeader icon={<TrainFront size={20} color={c.ink} />} title={t('tripTitle')} />
      <Txt size={type.body} weight="semibold">{commute.origin} → {commute.destination}</Txt>
      <Txt size={type.title + 4} weight="bold" numeric>
        {modeLabel} · {t('demoEta', { n: active.arrivalMinutes })}
      </Txt>
      <Txt size={type.label} tone="muted">{t('previewArrival')} · {t('previewTransitMeta')}</Txt>
      <Button label={t('tabMobility')} onPress={onDetails} />
    </Card>
  );
}

/**
 * All routes here are PREVIEW examples only. Origin, destination, chosen mode and
 * saved status persist and are reused by Home, never masquerading as live GTFS.
 */
export function DemoMobility() {
  const { c, t, demoScenario, now, commute, setCommute, area } = useApp();
  const [editingOrigin, setEditingOrigin] = useState(false);
  const [editingDestination, setEditingDestination] = useState(false);
  const scene = makeDemoScene(now, demoScenario);
  const names: Record<TransitId, string> = {
    metro1: t('journeyRouteMetro1'), metro2: t('journeyRouteMetro2'), mibus: t('journeyRouteMibus'),
  };
  const places = ['Albrook', 'San Miguelito', '5 de Mayo', 'Tocumen', 'Vía España', 'Betania'];
  const modes: TransitId[] = ['metro1', 'metro2', 'mibus'];
  const currentRoute = scene.transit.find((item) => item.id === commute.preferred) ?? scene.transit[0];
  return (
    <View style={{ gap: space.md }}>
      <Txt size={type.hero - 10} weight="bold" accessibilityRole="header">{t('mobilityTitle')}</Txt>
      <DemoControls />
      <Card style={{ gap: space.md }}>
        <CardHeader icon={<TrainFront size={20} color={c.ink} />} title={t('tripTitle')} />
        <View style={{ gap: space.sm }}>
          <Txt size={type.label} tone="muted">{t('journeyOrigin')}</Txt>
          <PressScale onPress={() => setEditingOrigin(!editingOrigin)} accessibilityRole="button"
            accessibilityLabel={t('journeyPickOrigin')}
            style={{ padding: space.md, minHeight: 50, justifyContent: 'center',
              borderRadius: radius.tile, backgroundColor: c.tileStrong }}>
            <Txt size={type.body} weight="semibold">{commute.origin}</Txt>
          </PressScale>
          {editingOrigin ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.xs }}>
              {[area, ...CORREGIMIENTOS.filter((x) => x !== area)].map((place) => (
                <PressScale key={place} accessibilityRole="button" accessibilityLabel={place}
                  onPress={() => { setCommute({ origin: place }); setEditingOrigin(false); }}
                  style={{ minHeight: 44, justifyContent: 'center', borderRadius: radius.pill,
                    paddingHorizontal: space.md, backgroundColor: c.tile }}>
                  <Txt size={type.label}>{place}</Txt>
                </PressScale>
              ))}
            </ScrollView>
          ) : null}
          <Txt size={type.label} tone="muted">{t('journeyDestination')}</Txt>
          <PressScale onPress={() => setEditingDestination(!editingDestination)} accessibilityRole="button"
            accessibilityLabel={t('journeyPickDestination')}
            style={{ padding: space.md, minHeight: 50, justifyContent: 'center',
              borderRadius: radius.tile, backgroundColor: c.tileStrong }}>
            <Txt size={type.body} weight="semibold">{commute.destination}</Txt>
          </PressScale>
          {editingDestination ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.xs }}>
              {places.filter((x) => x !== commute.origin).map((place) => (
                <PressScale key={place} accessibilityRole="button" accessibilityLabel={place}
                  onPress={() => { setCommute({ destination: place }); setEditingDestination(false); }}
                  style={{ minHeight: 44, justifyContent: 'center', borderRadius: radius.pill,
                    paddingHorizontal: space.md, backgroundColor: c.tile }}>
                  <Txt size={type.label}>{place}</Txt>
                </PressScale>
              ))}
            </ScrollView>
          ) : null}
        </View>
        <Button label={t(commute.saved ? 'previewRemoveRoute' : 'previewSaveRoute')}
          onPress={() => setCommute({ saved: !commute.saved })} />
        <Txt size={type.caption + 1} tone="muted">{t(commute.saved ? 'previewRouteSaved' : 'previewRouteNotSaved')}</Txt>
      </Card>
      <Card style={{ gap: space.sm }}>
        <Txt size={type.title} weight="semibold" accessibilityRole="header">{t('journeyRouteOptions')}</Txt>
        {modes.map((id) => {
          const entry = scene.transit.find((item) => item.id === id);
          const active = commute.preferred === id;
          return (
            <PressScale key={id} onPress={() => setCommute({ preferred: id })}
              accessibilityRole="button" accessibilityLabel={names[id]}
              accessibilityState={{ selected: active }}
              style={{ minHeight: 66, padding: space.md, borderRadius: radius.tile,
                backgroundColor: active ? c.tileStrong : c.tile,
                borderWidth: active ? 1 : 0, borderColor: c.accent,
                flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
              {id === 'mibus' ? <Bus size={20} color={c.ink} /> : <TrainFront size={20} color={c.ink} />}
              <View style={{ flex: 1, gap: 2 }}>
                <Txt size={type.body} weight="semibold">{names[id]}</Txt>
                <Txt size={type.caption + 1} tone="muted">
                  {entry?.condition === 'delayed' ? t('previewTransitDelayed')
                    : entry?.condition === 'recovering' ? t('previewTransitRecover')
                    : t('previewTransitOnTime')}
                </Txt>
              </View>
              <Txt size={type.title} weight="bold" numeric>
                {t('demoEta', { n: entry?.arrivalMinutes ?? 0 })}
              </Txt>
            </PressScale>
          );
        })}
      </Card>
      <Card style={{ gap: space.sm }}>
        <Txt size={type.title} weight="semibold">{t('journeyStops')}</Txt>
        {[commute.origin, t('journeyLegTransfer'), commute.destination].map((label, index) => (
          <View key={index} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: space.md }}>
            <View style={{ width: 10, height: 10, borderRadius: 5,
              backgroundColor: index === 1 ? c.muted : c.accent }} />
            <Txt size={type.body} style={{ flex: 1 }}>{label}</Txt>
            {index === 1 ? <Txt size={type.label} tone="muted" numeric>
              {t('journeyETA', { n: currentRoute.arrivalMinutes })}
            </Txt> : null}
          </View>
        ))}
        <Txt size={type.caption + 1} tone="muted">{t('journeyStopsCaption')}</Txt>
      </Card>
    </View>
  );
}

export function PreviewServices() {
  const { c, t, lang, now, demoScenario, go, area } = useApp();
  const [selected, setSelected] = useState<string | null>(null);
  const stacked = useStackedPair();
  const scene = makeDemoScene(now, demoScenario);
  const notices = previewServiceNotices(now, demoScenario, area);
  const selectedNotice = notices.find((n) => n.id === selected);
  return (
    <View style={{ gap: space.md }}>
      <View style={{ gap: space.xs }}>
        <Txt size={type.hero - 10} weight="bold" accessibilityRole="header">{t('categoryServices')}</Txt>
        <Txt size={type.label} tone="muted">{t('previewHomeCaption')}</Txt>
      </View>
      <DemoControls />
      {selectedNotice ? (
        <Card style={{ gap: space.md }}>
          <Button label={t('servicePreviewBack')} onPress={() => setSelected(null)} />
          <CardHeader title={t(selectedNotice.headline)}
            icon={selectedNotice.service === 'electricity'
              ? <Zap size={20} color={c.ink} /> : <Droplets size={20} color={c.ink} />} />
          <Txt size={type.body} tone="muted">{selectedNotice.corregimiento} · {ago(selectedNotice.postedAt, now, lang)}</Txt>
          <Txt size={type.body}>{t(selectedNotice.detail)}</Txt>
          <Txt size={type.label} tone="muted">{t('servicePreviewDisclaimer')}</Txt>
          <Button label={t('servicePreviewToReports')} onPress={() => go('report')} />
        </Card>
      ) : (
        <>
          <View style={{ flexDirection: stacked ? 'column' : 'row', gap: space.sm }}>
            <View style={{ flex: stacked ? undefined : 1, minWidth: 0 }}><DemoUtilityCard compact service="power" state={scene.power} /></View>
            <View style={{ flex: stacked ? undefined : 1, minWidth: 0 }}><DemoUtilityCard compact service="water" state={scene.water} /></View>
          </View>
          <Card style={{ gap: space.sm }}>
            <Txt size={type.title} weight="semibold" accessibilityRole="header">{t('servicePreviewNotices')}</Txt>
            <Txt size={type.label} tone="muted">{t('servicePreviewIntro')}</Txt>
            {notices.map((notice) => (
              <PressScale key={notice.id} accessibilityRole="button"
                accessibilityLabel={t(notice.headline)}
                onPress={() => setSelected(notice.id)}
                style={{ minHeight: 76, backgroundColor: c.tile, borderRadius: radius.tile,
                  padding: space.md, flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                {notice.service === 'electricity'
                  ? <Zap size={20} color={c.ink} /> : <Droplets size={20} color={c.ink} />}
                <View style={{ flex: 1, gap: 3 }}>
                  <Txt size={type.body} weight="semibold">{t(notice.headline)}</Txt>
                  <Txt size={type.label} tone="muted">{notice.corregimiento} · {ago(notice.postedAt, now, lang)}</Txt>
                </View>
              </PressScale>
            ))}
          </Card>
          <NeighborhoodFeed limit={3} onViewAll={() => go('report')} />
          <Card style={{ gap: space.xs }}>
            <Txt size={type.label} weight="semibold" tone="muted">{t('realSourceLinksTitle')}</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
              <LinkChip label="Naturgy" url="https://www.naturgy.com.pa/cronogramas-mantenimiento/" />
              <LinkChip label="ENSA" url="https://ensa.com.pa/mantenimientos-programados/" />
              <LinkChip label="IDAAN" url="https://www.idaan.gob.pa/" />
            </View>
          </Card>
          <Button label={t('previewSourceDetails')} onPress={() => go('settings')} />
        </>
      )}
    </View>
  );
}
