import { Activity, Clock3, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ago, clock, dayKey, dayLabel, dayStamp, pct, place } from '../data/format';
import type { Quake } from '../data/usgs';
import { filterQuakes, SeismicMagnitudeFilter } from '../data/seismicView';
import { LIVE_MAX_AGE_MS } from '../data/glance';
import { SectionHeading } from '../components/section';
import { PressScale } from '../components/motion';
import { useApp } from '../state/AppContext';
import { radius, space, type } from '../theme/tokens';
import { Button, Card, SourceLine, Tile, TileGrid, Txt, styles } from '../components/ui';

/**
 * Seismic chapter, rebuilt around one genuine featured observation, official
 * issued forecast windows, and a browsable event catalog. No invented events.
 */
export function Quakes({ onOpenQuake }: { onOpenQuake: (id: string) => void }) {
  const { c, t, lang, seismic, now } = useApp();
  const [minimum, setMinimum] = useState<SeismicMagnitudeFilter>('all');
  const filtered = useMemo(() => filterQuakes(seismic.earthquakes, minimum),
    [seismic.earthquakes, minimum]);
  const latest = filtered[0] ?? null;
  const rest = filtered.slice(1);
  const groups = useMemo(() => {
    const out: { key: string; label: string; items: Quake[] }[] = [];
    for (const quake of rest) {
      const key = dayKey(quake.time);
      let group = out.find((item) => item.key === key);
      if (!group) {
        group = { key, label: dayLabel(quake.time, now, lang), items: [] };
        out.push(group);
      }
      group.items.push(quake);
    }
    return out;
  }, [rest, lang, now]);

  const forecast = seismic.forecast;
  const isCurrent = seismic.mode === 'live' && now >= seismic.fetchedAt
    && now - seismic.fetchedAt <= LIVE_MAX_AGE_MS;
  // Catalog ingestion freshness and USGS OAF issuance freshness are independent.
  const forecastRecent = !!forecast && isCurrent && now >= forecast.creationTime
    && now - forecast.creationTime <= 24 * 60 * 60 * 1000;
  const dataTime = dayStamp(seismic.fetchedAt, lang);
  const options: { value: SeismicMagnitudeFilter; label: string }[] = [
    { value: 'all', label: t('seismicFilterAll') },
    { value: 5, label: 'M5+' },
    { value: 6, label: 'M6+' },
  ];

  return (
    <View style={{ gap: space.md }}>
      <View style={{ gap: space.xs, paddingHorizontal: space.xs }}>
        <Txt size={type.hero - 10} weight="bold" accessibilityRole="header">
          {t('quakesTitle')}
        </Txt>
        <Txt size={type.label} tone="muted">
          {t(isCurrent ? 'seismicLiveDataset' : 'seismicArchivedDataset', { time: dataTime })}
        </Txt>
      </View>

      <View style={{ gap: space.sm }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          accessibilityLabel={t('seismicFilterTitle')}
          contentContainerStyle={{ gap: space.xs, alignItems: 'center', paddingRight: space.md }}>
          {options.map(({ value, label }) => {
            const active = minimum === value;
            return (
              <PressScale key={String(value)} accessibilityRole="button"
                accessibilityLabel={label} accessibilityState={{ selected: active }}
                onPress={() => setMinimum(value)}
                style={{
                  minHeight: 44, minWidth: 65, paddingHorizontal: space.md,
                  borderRadius: radius.pill, borderWidth: 1, borderColor: c.line,
                  backgroundColor: active ? c.navActive : c.tileStrong,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                <Txt size={type.label} weight="semibold"
                  style={{ color: active ? c.navActiveInk : c.ink }}>{label}</Txt>
              </PressScale>
            );
          })}
        </ScrollView>
        <Txt size={type.label} tone="muted" style={{ paddingHorizontal: space.xs }}>
          {t('seismicFilterResults', { n: filtered.length })}
        </Txt>
      </View>

      {latest ? (
        <Card style={{ padding: space.xl, gap: space.md }}>
          <View style={[styles.row, { gap: space.sm }]}>
            <Activity size={19} color={c.ink} />
            <Txt size={type.label} weight="semibold" tone="muted" style={{ flex: 1 }}>
              {t('seismicLatest')}
            </Txt>
          </View>
          <View style={{ gap: space.xs }}>
            <Txt size={type.hero + 5} weight="bold" numeric
              style={{ letterSpacing: -1.5 }} accessibilityRole="header">
              M{latest.mag.toFixed(1)}
            </Txt>
            <Txt size={type.title + 3} weight="semibold">
              {place(latest.place, lang)}
            </Txt>
            <Txt size={type.label} tone="muted" numeric>
              {dayStamp(latest.time, lang)}
            </Txt>
          </View>
          <Button label={t('heroQuakeAction')} variant="solid"
            onPress={() => onOpenQuake(latest.id)} />
          <SourceLine source="USGS" kind={isCurrent ? 'official' : 'stale'} detail={dataTime} />
        </Card>
      ) : (
        <Card style={{ gap: space.sm }}>
          <Clock3 size={22} color={c.muted} />
          <Txt size={type.title} weight="semibold">{t('seismicNoMatches')}</Txt>
          <Txt size={type.body} tone="muted">{t('seismicNoMatchesHint')}</Txt>
        </Card>
      )}

      {forecast ? (
        <>
          <SectionHeading title={t('forecastTable')}
            subtitle={t(forecastRecent ? 'seismicForecastLiveHint' : 'seismicForecastArchivedHint')} />
          <Card style={{ gap: space.md }}>
            <View style={[styles.row, { paddingHorizontal: space.xs, gap: space.xs }]}>
              <Txt size={type.caption} tone="muted" weight="semibold"
                style={{ flex: 1.15 }}>{t('magnitude')}</Txt>
              {(['seismicFirstDay', 'seismicFirstWeek', 'seismicFirstMonth'] as const).map((key) => (
                <Txt key={key} size={type.caption} tone="muted" weight="semibold"
                  style={{ flex: 1, textAlign: 'right' }}>{t(key)}</Txt>
              ))}
            </View>
            {[5, 6, 7].map((magnitude) => (
              <View key={magnitude} style={[styles.row, {
                backgroundColor: c.tile, borderRadius: radius.tile, paddingHorizontal: space.sm,
                paddingVertical: space.sm, minHeight: 50, gap: space.xs,
              }]}>
                <Txt size={type.body} weight="bold" style={{ flex: 1.15 }}>M{magnitude}+</Txt>
                {['1 Day', '1 Week', '1 Month'].map((window) => {
                  const bin = forecast.windows.find((w) => w.label === window)
                    ?.bins.find((item) => item.magnitude === magnitude);
                  return (
                    <Txt key={window} size={type.label} weight="semibold" numeric
                      style={{ flex: 1, textAlign: 'right' }}>
                      {bin ? pct(bin.probability) : '–'}
                    </Txt>
                  );
                })}
              </View>
            ))}
            <Txt size={type.label} tone="muted">{t('seismicForecastWindowsIssued')}</Txt>
            <Txt size={type.label} tone="muted">{t('forecastCaveat')}</Txt>
            {!forecastRecent ? (
              <Txt size={type.label} tone="muted">{t('archivedForecastWarning')}</Txt>
            ) : null}
            <SourceLine source="USGS OAF" kind={forecastRecent ? 'official' : 'stale'}
              detail={`${t('issued')} ${dayStamp(forecast.creationTime, lang)}`} />
          </Card>
        </>
      ) : null}

      {rest.length ? (
        <>
          <SectionHeading title={t('seismicMoreEvents')}
            subtitle={t('seismicMoreEventsHint')} />
          {groups.map((group) => (
            <Card key={group.key} style={{ gap: space.xs }}>
              <Txt size={type.label} weight="semibold" tone="muted">
                {group.label} · {group.items.length}
              </Txt>
              {group.items.map((quake) => (
                <QuakeRow key={quake.id} q={quake} onPress={() => onOpenQuake(quake.id)} />
              ))}
            </Card>
          ))}
        </>
      ) : null}

      {!filtered.length ? (
        <Button label={t('seismicResetFilter')} onPress={() => setMinimum('all')} />
      ) : null}
      <Txt size={type.caption + 1} tone="muted" style={{ paddingHorizontal: space.xs }}>
        {t('seismicCatalogScope')}
      </Txt>
    </View>
  );
}

function QuakeRow({ q, onPress }: { q: Quake; onPress: () => void }) {
  const { c, lang } = useApp();
  return (
    <Pressable accessibilityRole="button"
      accessibilityLabel={`M${q.mag.toFixed(1)}, ${place(q.place, lang)}, ${clock(q.time, lang)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, {
        backgroundColor: c.tile, borderRadius: radius.tile, padding: space.sm,
        paddingHorizontal: space.md, minHeight: 64, gap: space.sm,
        opacity: pressed ? 0.75 : 1,
      }]}>
      <View style={{
        minWidth: 60, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
        backgroundColor: c.tileStrong,
      }}>
        <Txt size={type.body} weight="bold" numeric>M{q.mag.toFixed(1)}</Txt>
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Txt size={type.body} weight="semibold" numberOfLines={2}>
          {place(q.place, lang)}
        </Txt>
        <Txt size={type.caption + 1} tone="muted" numeric>
          {clock(q.time, lang)}
        </Txt>
      </View>
    </Pressable>
  );
}

export function QuakeSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { c, t, lang, seismic } = useApp();
  const insets = useSafeAreaInsets();
  const q = seismic.earthquakes.find((x) => x.id === id) ?? null;
  return (
    <Modal visible={!!q} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: c.scrim }} onPress={onClose} accessibilityLabel={t('close')} />
      {q ? (
        <View
          style={{
            backgroundColor: c.sheet,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            padding: space.lg,
            paddingBottom: insets.bottom + space.lg,
            gap: space.md,
            maxHeight: '85%',
          }}
        >
          <ScrollView contentContainerStyle={{ gap: space.md }}>
            <View style={styles.row}>
              <Txt size={type.hero} weight="bold" numeric style={{ flex: 1 }}>
                M{q.mag.toFixed(1)}
              </Txt>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('close')}
                onPress={onClose}
                style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.tile, alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={22} color={c.ink} />
              </Pressable>
            </View>
            <Txt size={type.title} weight="semibold">
              {place(q.place, lang)}
            </Txt>
            <Txt size={type.body} tone="muted" numeric>
              {dayStamp(q.time, lang)}
            </Txt>
            <TileGrid>
              <Tile label={t('depth')} value={q.depthKm != null ? `${Math.round(q.depthKm)} km` : '–'} />
              <Tile label={t('pager')} value={q.alert ?? t('pagerNone')} />
              <Tile label={t('coords')} value={`${Math.abs(q.lat).toFixed(2)}° ${q.lat >= 0 ? 'N' : 'S'}`} sub={`${Math.abs(q.lon).toFixed(2)}° ${q.lon >= 0 ? 'E' : lang === 'es' ? 'O' : 'W'}`} />
              <Tile label={t('reviewStatus')} value={q.status === 'reviewed' ? '✓' : q.status} sub={q.status === 'reviewed' ? t('reviewed') : undefined} />
            </TileGrid>
            <Button
              label={t('openUsgs')}
              variant="solid"
              onPress={() => Linking.openURL(`https://earthquake.usgs.gov/earthquakes/eventpage/${q.id}`).catch(() => {})}
            />
            <SourceLine source={`USGS · ${q.id}`} kind="official" />
          </ScrollView>
        </View>
      ) : null}
    </Modal>
  );
}
