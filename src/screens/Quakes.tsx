import { X } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Linking, Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ago, clock, dayKey, dayLabel, dayStamp, pct, place } from '../data/format';
import type { Quake } from '../data/usgs';
import { useApp } from '../state/AppContext';
import { radius, space, type } from '../theme/tokens';
import { Button, Card, SourceLine, Tile, TileGrid, Txt, styles } from '../components/ui';

export function Quakes({ onOpenQuake }: { onOpenQuake: (id: string) => void }) {
  const { c, t, lang, seismic, now } = useApp();
  const groups = useMemo(() => {
    const out: { key: string; label: string; items: Quake[] }[] = [];
    for (const q of seismic.earthquakes) {
      const k = dayKey(q.time);
      let g = out.find((x) => x.key === k);
      if (!g) out.push((g = { key: k, label: dayLabel(q.time, now, lang), items: [] }));
      g.items.push(q);
    }
    return out;
  }, [seismic, now, lang]);

  const f = seismic.forecast;

  return (
    <View style={{ gap: space.md }}>
      <View style={{ paddingHorizontal: space.xs, gap: 2 }}>
        <Txt size={type.hero - 10} weight="bold" accessibilityRole="header">
          {t('quakesTitle')}
        </Txt>
        <Txt size={type.label} tone="muted">
          {t('quakesSub', { n: seismic.earthquakes.length })}
        </Txt>
      </View>

      {f ? (
        <Card>
          <Txt size={type.title} weight="semibold">
            {t('forecastTable')}
          </Txt>
          <View style={{ gap: 2 }}>
            <View style={[styles.row, { paddingHorizontal: space.sm }]}>
              <Txt size={type.caption} tone="faint" weight="semibold" style={{ flex: 1.3 }}>
                {t('magnitude').toUpperCase()}
              </Txt>
              {['next24', 'nextWeek', 'nextMonth'].map((k) => (
                <Txt key={k} size={type.caption} tone="faint" weight="semibold" style={{ flex: 1, textAlign: 'right' }}>
                  {t(k as any).toUpperCase()}
                </Txt>
              ))}
            </View>
            {[5, 6, 7].map((m) => (
              <View key={m} style={[styles.row, { backgroundColor: c.tile, borderRadius: 14, paddingHorizontal: space.sm, minHeight: 46 }]}>
                <Txt size={type.body} weight="bold" style={{ flex: 1.3 }}>
                  M{m}+
                </Txt>
                {['1 Day', '1 Week', '1 Month'].map((label) => {
                  const b = f.windows.find((w) => w.label === label)?.bins.find((x) => x.magnitude === m);
                  return (
                    <Txt key={label} size={type.body} weight="semibold" numeric style={{ flex: 1, textAlign: 'right' }}>
                      {b ? pct(b.probability) : '–'}
                    </Txt>
                  );
                })}
              </View>
            ))}
          </View>
          <Txt size={type.label} tone="muted">
            {t('forecastCaveat')}
          </Txt>
          <SourceLine source="USGS OAF" kind="official" detail={`${t('issued')} ${dayStamp(f.creationTime, lang)}`} />
        </Card>
      ) : null}

      {groups.map((g) => (
        <Card key={g.key} style={{ gap: space.xs }}>
          <Txt size={type.body} weight="semibold" tone="muted" style={{ marginBottom: 4 }}>
            {g.label} · {g.items.length}
          </Txt>
          {g.items.map((q) => (
            <QuakeRow key={q.id} q={q} onPress={() => onOpenQuake(q.id)} />
          ))}
        </Card>
      ))}
      <SourceLine source="USGS" kind="official" detail={t('updated', { ago: ago(seismic.fetchedAt, now, lang) })} />
    </View>
  );
}

function QuakeRow({ q, onPress }: { q: Quake; onPress: () => void }) {
  const { c, lang } = useApp();
  const strong = q.mag >= 6;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`M${q.mag.toFixed(1)}, ${place(q.place, lang)}, ${clock(q.time, lang)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { backgroundColor: c.tile, borderRadius: radius.tile, padding: space.sm, paddingHorizontal: space.md, minHeight: 56, opacity: pressed ? 0.75 : 1 }]}
    >
      <View
        style={{
          width: 48,
          height: 34,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: strong ? c.alert : c.tileStrong,
        }}
      >
        <Txt size={type.body} weight="bold" numeric style={{ color: strong ? c.officialInk : c.ink }}>
          {q.mag.toFixed(1)}
        </Txt>
      </View>
      <Txt size={type.body} style={{ flex: 1 }} numberOfLines={2}>
        {place(q.place, lang)}
      </Txt>
      <Txt size={type.label} tone="muted" numeric>
        {clock(q.time, lang)}
      </Txt>
    </Pressable>
  );
}

export function QuakeSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { c, t, lang, seismic, theme } = useApp();
  const insets = useSafeAreaInsets();
  const q = seismic.earthquakes.find((x) => x.id === id) ?? null;
  return (
    <Modal visible={!!q} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(8,12,24,0.45)' }} onPress={onClose} accessibilityLabel={t('close')} />
      {q ? (
        <View
          style={{
            backgroundColor: theme === 'dark' ? '#1E2740' : '#F4F6FB',
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
