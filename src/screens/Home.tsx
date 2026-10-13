import { Activity, Bus, Droplets, TrainFront, Zap } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { bin } from '../data/usgs';
import { ago, clock, dayStamp, longDate, pct, place, shortDate } from '../data/format';
import { SERVICES } from '../data/services';
import { useApp } from '../state/AppContext';
import { radius, space, type } from '../theme/tokens';
import { Button, Card, CardHeader, LinkChip, SourceLine, Tile, TileGrid, Txt, styles } from '../components/ui';

export function Home({ onOpenQuake }: { onOpenQuake: (id: string) => void }) {
  const { c, t, lang, seismic, now, go, askFromHome } = useApp();
  const f = seismic.forecast;
  const main = useMemo(
    () => seismic.earthquakes.find((q) => q.id === f?.mainshockId) ?? null,
    [seismic, f],
  );
  const recent = seismic.earthquakes.slice(0, 4);

  const d6 = bin(f, '1 Day', 6);
  const w6 = bin(f, '1 Week', 6);
  const d7 = bin(f, '1 Day', 7);
  const w7 = bin(f, '1 Week', 7);
  const d5 = bin(f, '1 Day', 5);

  const dataNote =
    seismic.mode === 'live'
      ? t('liveNote', { time: clock(seismic.fetchedAt, lang) })
      : t('snapshotNote', { time: dayStamp(seismic.fetchedAt, lang) });

  return (
    <View style={{ gap: space.md }}>
      <View style={{ paddingHorizontal: space.xs, gap: 2 }}>
        <Txt size={type.label} weight="semibold" tone="muted">
          {t('city')}
        </Txt>
        <Txt size={type.caption + 1} tone="faint" numeric>
          {dataNote}
        </Txt>
      </View>

      {/* Hark-style action cards: a verb chip followed by the thing it acts on. */}
      <Suggestion verb={t('ask')} text={t('sugAsk')} onPress={() => askFromHome(t('sugAskPrompt'))} />
      <Suggestion verb={t('review')} text={t('sugReview')} onPress={() => go('quakes')} />
      <Suggestion verb={t('report')} text={t('sugReport')} onPress={() => go('report')} />

      {f ? (
        <Card>
          <CardHeader icon={<Activity size={18} color={c.ink} />} title={t('aftershocks')} />
          {main ? (
            <Txt size={type.body} tone="muted">
              {t('aftershockLead', { mag: main.mag.toFixed(1), date: longDate(main.time, lang) })}
            </Txt>
          ) : null}
          <TileGrid>
            <Tile label={`M6+ · ${t('next24')}`} value={d6 ? pct(d6.probability) : '–'} />
            <Tile label={`M6+ · ${t('nextWeek')}`} value={w6 ? pct(w6.probability) : '–'} />
            <Tile label={`M7+ · ${t('next24')}`} value={d7 ? pct(d7.probability) : '–'} dim />
            <Tile label={`M7+ · ${t('nextWeek')}`} value={w7 ? pct(w7.probability) : '–'} dim />
            <Tile
              label={`${t('m5Count')} · ${t('next24')}`}
              value={d5 ? t('about', { n: d5.median }) : '–'}
              sub={d5 ? t('range', { a: d5.p95min, b: d5.p95max }) : undefined}
            />
            <Tile label={t('issued')} value={clock(f.creationTime, lang)} sub={shortDate(f.creationTime, lang)} />
          </TileGrid>
          <Txt size={type.label} tone="muted">
            {t('forecastCaveat')}
          </Txt>

          <Txt size={type.body} weight="semibold" style={{ marginTop: space.xs }}>
            {t('recentQuakes')}
          </Txt>
          <View style={{ gap: space.xs }}>
            {recent.map((q) => (
              <Pressable
                key={q.id}
                accessibilityRole="button"
                accessibilityLabel={`M${q.mag.toFixed(1)}, ${place(q.place, lang)}, ${clock(q.time, lang)}`}
                onPress={() => onOpenQuake(q.id)}
                style={({ pressed }) => [
                  styles.row,
                  { backgroundColor: c.tile, borderRadius: radius.tile, paddingHorizontal: space.md, minHeight: 56, opacity: pressed ? 0.75 : 1 },
                ]}
              >
                <Txt size={type.body} weight="bold" numeric style={{ width: 40 }}>
                  {q.mag.toFixed(1)}
                </Txt>
                <Txt size={type.body} style={{ flex: 1 }} numberOfLines={1}>
                  {place(q.place, lang)}
                </Txt>
                <Txt size={type.label} tone="muted" numeric>
                  {clock(q.time, lang)}
                </Txt>
              </Pressable>
            ))}
          </View>
          <Button label={t('seeAll')} onPress={() => go('quakes')} />
          <SourceLine
            source="USGS"
            kind="official"
            detail={t('updated', { ago: ago(seismic.fetchedAt, now, lang) })}
          />
        </Card>
      ) : null}

      <Card>
        <CardHeader icon={<Zap size={18} color={c.ink} />} title={t('services')} />
        <TileGrid>
          <ServiceTile icon={<Zap size={18} color={c.muted} />} name={t('power')} provider={SERVICES.electricity.provider} />
          <ServiceTile icon={<Droplets size={18} color={c.muted} />} name={t('water')} provider={SERVICES.water.provider} />
        </TileGrid>
        <Txt size={type.label} tone="muted">
          {t('noSourceBody', { source: lang === 'es' ? 'Naturgy, ENSA e IDAAN' : 'Naturgy, ENSA and IDAAN' })}
        </Txt>
        <SourceLine source="Naturgy · ENSA · IDAAN" kind="unavailable" />
      </Card>

      <Card>
        <CardHeader icon={<TrainFront size={18} color={c.ink} />} title={t('mobility')} />
        <View style={{ gap: space.xs }}>
          <MobilityRow icon={<TrainFront size={18} color={c.muted} />} name={t('metroL1')} />
          <MobilityRow icon={<TrainFront size={18} color={c.muted} />} name={t('metroL2')} />
          <MobilityRow icon={<Bus size={18} color={c.muted} />} name={t('mibus')} />
        </View>
        <Txt size={type.label} tone="muted">
          {t('mobilityNote')}
        </Txt>
        <View style={[styles.row, { flexWrap: 'wrap' }]}>
          <LinkChip label="Metro de Panamá" url={SERVICES.metro_l1.officialUrl} />
          <LinkChip label="MiBus" url={SERVICES.mibus.officialUrl} />
        </View>
        <SourceLine source="Metro de Panamá · MiBus" kind="unavailable" />
      </Card>
    </View>
  );
}

function Suggestion({ verb, text, onPress }: { verb: string; text: string; onPress: () => void }) {
  const { c } = useApp();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${verb} ${text}`}
      onPress={onPress}
      style={({ pressed }) => [
        { backgroundColor: c.card, borderRadius: radius.card, paddingHorizontal: space.lg, paddingVertical: space.lg, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Txt size={type.body + 1} weight="medium" style={{ lineHeight: 30 }}>
        <Txt size={type.body} weight="semibold" style={{ backgroundColor: c.tileStrong, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' }}>
          {` ${verb} `}
        </Txt>
        {`  ${text}`}
      </Txt>
    </Pressable>
  );
}

function ServiceTile({ icon, name, provider }: { icon: React.ReactNode; name: string; provider: string }) {
  const { c, t } = useApp();
  return (
    <View style={{ flex: 1, minWidth: 0, backgroundColor: c.tile, borderRadius: radius.tile, padding: space.md, gap: 6 }}>
      <View style={styles.row}>
        {icon}
        <Txt size={type.body} weight="semibold">
          {name}
        </Txt>
      </View>
      <Txt size={type.title} weight="semibold" tone="muted">
        {t('unavailable')}
      </Txt>
      <Txt size={type.caption + 1} tone="faint" numberOfLines={1}>
        {provider}
      </Txt>
    </View>
  );
}

function MobilityRow({ icon, name }: { icon: React.ReactNode; name: string }) {
  const { c, t } = useApp();
  return (
    <View style={[styles.row, { backgroundColor: c.tile, borderRadius: radius.tile, paddingHorizontal: space.md, minHeight: 52 }]}>
      {icon}
      <Txt size={type.body} style={{ flex: 1 }}>
        {name}
      </Txt>
      <Txt size={type.label} tone="muted">
        {t('noLiveFeed')}
      </Txt>
    </View>
  );
}
