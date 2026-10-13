import { Activity, Clock, Megaphone, TriangleAlert, Zap } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { Eyebrow, HeroCard, OfflineLine, PillKind, StatusPill } from '../components/glance';
import { SectionHeading } from '../components/section';
import { Button, Card, CardHeader, SourceLine, Txt, styles } from '../components/ui';
import { ago, clock, dayKey, dayStamp, place } from '../data/format';
import { joinList, locality, offlineSources, OfflineSource, seismicHero } from '../data/glance';
import { DemoCommuteCard, DemoControls, DemoUtilityCard, demoUtilityCopy } from './DemoScreens';
import { makeDemoScene } from '../data/demo';
import { powerFeedState, usePowerMaintenance } from '../data/maintenance';
import { powerSurfaceSource } from '../data/sourcePolicy';
import { useApp } from '../state/AppContext';
import { space, type } from '../theme/tokens';

const ZONE = 'Pueblo Nuevo';

/**
 * Home answers three things at a glance: is anything wrong near me, how sure are we, what to check next.
 * Order: area summary, one hero, up to three status chips, one offline line, one utility card, one secondary card.
 */
export function Home({ onOpenQuake }: { onOpenQuake: (id: string) => void }) {
  const { c, t, lang, seismic, now, go, demoEnabled, demoScenario } = useApp();
  const demo = makeDemoScene(now, demoScenario);
  const latestRecorded = seismic.earthquakes.length ? [...seismic.earthquakes].sort((a, b) => b.time - a.time)[0] : null;
  const { data: maintenance, state: maintenanceState } = usePowerMaintenance(ZONE);
  const power = powerFeedState(maintenance, maintenanceState);
  const powerSurface = powerSurfaceSource(power, demoEnabled);
  const cuts = maintenance?.notices.length ?? 0;
  const hero = useMemo(() => seismicHero(seismic, now), [seismic, now]);

  // Same-day times read as a clock; anything older carries its day so it can't pass for today.
  const when = (ms: number) => (dayKey(ms) === dayKey(now) ? clock(ms, lang) : dayStamp(ms, lang));

  const heroProps = (() => {
    if (hero.kind === 'notable') {
      const q = hero.quake;
      const mag = q.mag.toFixed(1);
      const loc = locality(q.place);
      return {
        icon: hero.severe ? <TriangleAlert size={16} color={c.alert} strokeWidth={2.4} /> : <Activity size={16} color={c.muted} strokeWidth={2.4} />,
        headline: loc ? t('heroQuakeNear', { mag, place: loc }) : t('heroQuakeAt', { mag, place: place(q.place, lang) }),
        alertLine: hero.severe ? t('heroPager', { level: t(q.alert === 'red' ? 'pagerRed' : 'pagerOrange') }) : undefined,
        detail: dayKey(q.time) === dayKey(now) ? t('heroRecordedAt', { time: clock(q.time, lang) }) : t('heroRecordedOn', { date: dayStamp(q.time, lang) }),
        verification: 'official' as const,
        provenance: t('heroProvenance', { time: when(seismic.fetchedAt) }),
        action: t('heroQuakeAction'),
        onAction: () => onOpenQuake(q.id),
      };
    }
    if (hero.kind === 'calm') {
      const q = hero.latest;
      return {
        icon: <Activity size={16} color={c.muted} strokeWidth={2.4} />,
        headline: t('heroCalmHeadline'),
        detail: t('heroCalmDetail'),
        extra: q ? t('heroCalmLatest', { mag: q.mag.toFixed(1), place: place(q.place, lang), when: ago(q.time, now, lang) }) : undefined,
        verification: 'official' as const,
        provenance: t('heroProvenance', { time: when(seismic.fetchedAt) }),
        action: t('heroCalmAction'),
        onAction: () => go('quakes'),
      };
    }
    return {
      icon: <Clock size={16} color={c.stale} strokeWidth={2.4} />,
      headline: t('heroStaleHeadline'),
      detail: t('heroStaleDetail'),
      verification: 'stale' as const,
      extra: latestRecorded ? t('heroLastRecorded', {
        mag: latestRecorded.mag.toFixed(1),
        place: place(latestRecorded.place, lang),
        when: dayStamp(latestRecorded.time, lang),
      }) : undefined,
      provenance: t('heroStaleProvenance', { time: dayStamp(seismic.fetchedAt, lang) }),
      action: t('heroStaleAction'),
      onAction: () => go('quakes'),
    };
  })();

  // Only statuses the data supports, at most three. A missing feed never becomes a chip.
  const pills: { kind: PillKind; label: string; onPress: () => void }[] = [];
  if (seismic.forecast) {
    pills.push({ kind: hero.kind === 'stale' ? 'stale' : 'forecast', label: t('chipAftershocks'), onPress: () => go('quakes') });
  }
  if (power === 'scheduled') {
    pills.push({ kind: 'official', label: cuts === 0 ? t('chipPowerNone') : cuts === 1 ? t('chipPowerCut') : t('chipPowerCuts', { n: cuts }), onPress: () => go('services') });
  } else if (power === 'stale') {
    pills.push({ kind: 'stale', label: t('chipPowerStale'), onPress: () => go('services') });
  }
  if (powerSurface === 'example') {
    pills.push({ kind: 'demo', label: t('demoStatusPower', {
      status: demoUtilityCopy(demo.power, 'power', t),
    }), onPress: () => go('services') });
  }
  if (demoEnabled && pills.length < 3) {
    pills.push({ kind: 'demo', label: t('demoStatusWater', {
      status: demoUtilityCopy(demo.water, 'water', t),
    }), onPress: () => go('services') });
  }

  const offline = offlineSources(power);
  const sourceName: Record<OfflineSource, string> = { power: t('power'), water: t('water'), metro: 'Metro', mibus: 'MiBus' };
  const offlineGoesTo = offline.some((s) => s === 'power' || s === 'water') ? 'services' : 'mobility';

  const powerHeadline =
    power === 'scheduled' ? (cuts === 0 ? t('scheduledEmpty') : cuts === 1 ? t('scheduledZoneOne') : t('scheduledZoneCount', { n: cuts }))
    : power === 'stale' ? t('powerStale')
    : maintenanceState === 'loading' ? t('loadingMaintenance')
    : t('powerNoFeed');

  return (
    <View style={{ gap: space.md }}>
      {/* Actual USGS information always leads, including in preview mode. */}
      {/* Area summary */}
      <View style={{ paddingHorizontal: space.xs, gap: 4 }}>
        <Eyebrow>{t('areaEyebrow')}</Eyebrow>
        <Txt size={type.hero} weight="bold" accessibilityRole="header" style={{ letterSpacing: -1 }}>
          {ZONE}
        </Txt>
        <Txt size={type.label} tone="muted" numeric>
          {t('lastData', { time: when(seismic.fetchedAt) })}
        </Txt>
      </View>

      {/* Alert hero: one primary card */}
      <HeroCard eyebrow={t('heroEyebrow')} {...heroProps} />

      {/* Status chips: meaningful, plain-language, at most three */}
      {pills.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          accessibilityLabel={t('chipsLabel')}
          style={{ marginHorizontal: -space.md }}
          contentContainerStyle={{ gap: space.xs, paddingHorizontal: space.md }}
        >
          {pills.slice(0, 3).map((p) => (
            <StatusPill key={p.label} {...p} />
          ))}
        </ScrollView>
      ) : null}

      {/* Every unavailable feed in one quiet line */}
      {offline.length ? (
        <OfflineLine
          text={t(demoEnabled ? 'previewSourceCoverage' : 'offlineLine', {
            sources: joinList(offline.map((s) => sourceName[s]), t('listAnd')),
          })}
          action={t('offlineAction')}
          onAction={() => go(demoEnabled ? 'settings' : offlineGoesTo)}
        />
      ) : null}

      {demoEnabled ? <DemoControls /> : null}
      {/* Contextual utility: scheduled power notices for the area */}
      <SectionHeading title={t('categoryServices')} subtitle={t('servicesSummaryHint')} />
      {powerSurface === 'example' ? (
        <DemoUtilityCard service="power" state={demo.power} onDetails={() => go('services')} />
      ) : (
      <Card>
        <CardHeader icon={<Zap size={18} color={c.ink} />} title={t('scheduledTitle')} />
        <Txt size={type.title + 3} weight="bold" style={{ color: power === 'stale' ? c.stale : power === 'scheduled' ? c.ink : c.muted }}>
          {powerHeadline}
        </Txt>
        <Txt size={type.label} tone="muted">
          {t('scheduledDisclaimer')}
        </Txt>
        <Button label={t('viewServices')} onPress={() => go('services')} />
        <SourceLine
          source={maintenance?.coverage.name ?? t('powerCardProvider')}
          kind={power === 'scheduled' ? 'official' : power === 'stale' ? 'stale' : 'unavailable'}
        />
      </Card>
      )}
      {demoEnabled ? (
        <>
          <SectionHeading title={t('categoryMobility')} subtitle={t('demoRealtimeDescription')} />
          <DemoCommuteCard onDetails={() => go('mobility')} />
        </>
      ) : null}

      {/* Secondary: community report */}
      <Card>
        <View style={styles.row}>
          <Megaphone size={20} color={c.community} />
          <Txt size={type.title} weight="bold" style={{ flex: 1 }} accessibilityRole="header">
            {t('reportHomeTitle')}
          </Txt>
        </View>
        <Txt size={type.body} tone="muted">
          {t('reportHomeHint')}
        </Txt>
        <Button label={t('reportHomeAction')} onPress={() => go('report')} />
      </Card>
    </View>
  );
}
