import { Activity, Droplets, Megaphone, TrainFront, Zap } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { PulseRail } from '../components/pulse';
import { Button, Card, CardHeader, SourceLine, StatusChip, Tile, TileGrid, Txt, styles } from '../components/ui';
import { ago, clock, dayStamp, longDate, pct, place } from '../data/format';
import { bin } from '../data/usgs';
import { usePowerMaintenance } from '../data/maintenance';
import { SectionHeading } from '../components/section';
import { useApp } from '../state/AppContext';
import { radius, space, type } from '../theme/tokens';

const MAPS_TRIP =
  'https://www.google.com/maps/dir/?api=1&origin=Pueblo+Nuevo,+Panam%C3%A1&destination=Albrook,+Panam%C3%A1&travelmode=transit';

export function Home({ onOpenQuake }: { onOpenQuake: (id: string) => void }) {
  const { c, t, lang, seismic, now, go } = useApp();
  const { data: maintenance, state: maintenanceState } = usePowerMaintenance('Pueblo Nuevo');
  const plannedCuts = maintenance?.notices ?? [];
  const currentSource = maintenanceState === 'ready' && maintenance?.sources.every((s) => s.freshness === 'current') === true;
  const f = seismic.forecast;
  const main = useMemo(() => seismic.earthquakes.find((q) => q.id === f?.mainshockId) ?? null, [seismic, f]);
  const recent = seismic.earthquakes.slice(0, 3);
  const d6 = bin(f, '1 Day', 6);
  const w6 = bin(f, '1 Week', 6);
  const d7 = bin(f, '1 Day', 7);
  const w7 = bin(f, '1 Week', 7);

  const dataNote =
    seismic.mode === 'live'
      ? t('liveNote', { time: clock(seismic.fetchedAt, lang) })
      : t('snapshotNote', { time: dayStamp(seismic.fetchedAt, lang) });

  return (
    <View style={{ gap: space.md }}>
      <View style={{ paddingHorizontal: space.xs, gap: 2 }}>
        <Txt size={type.label} weight="semibold" tone="muted">
          {t('myZone')}
        </Txt>
        <Txt size={type.hero} weight="bold" accessibilityRole="header" style={{ letterSpacing: -1 }}>
          Pueblo Nuevo
        </Txt>
        <Txt size={type.caption + 1} tone="muted" numeric>
          {dataNote}
        </Txt>
      </View>

      {/* Signature: the area's pulse, one line through five services. */}
      <Card featured>
        <CardHeader icon={<Activity size={18} color={c.accent} />} title={t('pulseTitle')} />
        <PulseRail
          nodes={[
            { label: t('power'), status: currentSource ? (plannedCuts.length ? t('scheduledBrief') : t('pulseNoPlans')) : t('pulsePowerStale'), state: 'stale' },
            { label: t('water'), status: t('pulseNone'), state: 'none' },
            { label: 'Metro', status: t('pulseNoFeed'), state: 'none' },
            { label: 'MiBus', status: t('pulseNoFeed'), state: 'none' },
            { label: t('pulseQuakes'), status: f ? t('pulseActive') : t('pulseNone'), state: f ? 'live' : 'none', intensity: w6 ? Math.min(1, w6.probability / 0.4) : 0 },
          ]}
        />
        <Txt size={type.caption + 1} tone="muted">
          {t('pulseLegend')}
        </Txt>
      </Card>

      <SectionHeading title={t('categoryServices')} subtitle={t('categoryServicesHint')} />
      {/* Separate floating cards for power and water, each with its own verification line. */}
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Card style={{ flex: 1, minWidth: 0, padding: space.md, gap: space.xs }}>
          <View style={styles.row}>
            <Zap size={18} color={c.stale} />
            <Txt size={type.body} weight="bold">
              {t('power')}
            </Txt>
          </View>
          <Txt size={type.label} tone="muted" numberOfLines={1}>
            {t('powerCardProvider')}
          </Txt>
          <Txt size={type.title} weight="bold" style={{ color: c.stale }}>
            {currentSource ? (plannedCuts.length ? t('scheduledCount', { n: plannedCuts.length }) : t('noPlannedNotices')) : t('powerCardState')}
          </Txt>
          <StatusChip kind={currentSource && plannedCuts.length ? "official" : "unavailable"} />
          <Txt size={type.caption} tone="muted">
            {currentSource ? t('maintenanceOnly') : t('maintenanceUnavailable')}
          </Txt>
        </Card>
        <Card style={{ flex: 1, minWidth: 0, padding: space.md, gap: space.xs }}>
          <View style={styles.row}>
            <Droplets size={18} color={c.muted} />
            <Txt size={type.body} weight="bold">
              {t('water')}
            </Txt>
          </View>
          <Txt size={type.label} tone="muted">
            IDAAN
          </Txt>
          <Txt size={type.title} weight="bold" tone="muted">
            {t('waterCardState')}
          </Txt>
          <View style={{ gap: 6 }}>
            <View style={[styles.row, { gap: 6 }]}>
              <StatusChip kind="unavailable" />
            </View>
            <Txt size={type.caption} tone="muted">
              {t('waterOfficial')}
            </Txt>
            <Txt size={type.caption} tone="muted">
              {t('waterCommunity')}
            </Txt>
          </View>
        </Card>
      </View>

      <Button label={t('serviceDetails')} onPress={() => go('services')} />

      <SectionHeading title={t('categoryMobility')} subtitle={t('categoryMobilityHint')} />
      {/* Everyday use: the commute, as a station timeline. No invented times. */}
      <Card style={{ backgroundColor: c.card }}>
        <CardHeader
          icon={<TrainFront size={18} color={c.ink} />}
          title={t('tripTitle')}
          right={
            <Txt size={type.caption + 1} tone="muted">
              {t('tripExample')}
            </Txt>
          }
        />
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <View style={{ alignItems: 'center', width: 20 }}>
            <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: c.accent }} />
            <View style={{ width: 4, height: 44, backgroundColor: c.accent, opacity: 0.85 }} />
            <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 4, borderColor: c.accent }} />
          </View>
          <View style={{ flex: 1, justifyContent: 'space-between' }}>
            <Txt size={type.body} weight="bold" style={{ lineHeight: 18 }}>
              {t('tripHome')}
            </Txt>
            <Txt size={type.label} tone="muted">
              {t('tripLeg')}
            </Txt>
            <Txt size={type.body} weight="bold" style={{ lineHeight: 18 }}>
              {t('tripWork')}
            </Txt>
          </View>
        </View>
        <Txt size={type.label} tone="muted">
          {t('tripNote')}
        </Txt>
        <Button label={t('tripMaps')} variant="solid" onPress={() => Linking.openURL(MAPS_TRIP).catch(() => {})} />
      </Card>

      <SectionHeading title={t('categorySeismic')} subtitle={t('categorySeismicHint')} />
      {f ? (
        <Card>
          <CardHeader icon={<Activity size={18} color={c.ink} />} title={t('aftershocks')} />
          {main ? (
            <Txt size={type.body} tone="muted">
              {t('aftershockLead', { mag: main.mag.toFixed(1), date: longDate(main.time, lang) })}
            </Txt>
          ) : null}
          <TileGrid>
            <Tile label={`M6+ · ${t('nextWeek')}`} value={w6 ? pct(w6.probability) : '–'} />
            <Tile label={`M6+ · ${t('next24')}`} value={d6 ? pct(d6.probability) : '–'} />
          </TileGrid>
          <Txt size={type.label} tone="muted">
            {t('forecastCaveat')}
          </Txt>
          <Button label={t('seeAll')} onPress={() => go('quakes')} />
          <SourceLine source="USGS" kind="official" detail={`${t('issued')} ${dayStamp(f.creationTime, lang)} · ${t('updated', { ago: ago(seismic.fetchedAt, now, lang) })}`} />
        </Card>
      ) : null}

      <Button label={t('reportCta')} icon={<Megaphone size={18} color={c.community} />} onPress={() => go('report')} />
    </View>
  );
}
