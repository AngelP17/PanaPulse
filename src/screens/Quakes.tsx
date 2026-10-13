import { X } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Linking, Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Group, Section, SourceLine, Surface, Txt, styles } from '../components/ui';
import { ago, clock, dayKey, dayLabel, dayStamp, pct, place } from '../data/format';
import { bin, type Quake } from '../data/usgs';
import { useApp } from '../state/AppContext';
import { radius, space, type } from '../theme/tokens';

export function Quakes({ onOpenQuake }: { onOpenQuake: (id: string) => void }) {
  const { c, t, lang, seismic, now } = useApp();
  const f = seismic.forecast;
  const w6 = bin(f, '1 Week', 6);
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

  return (
    <View style={{ gap: space.xl }}>
      <View style={{ paddingHorizontal: space.xxs, gap: 2 }}>
        <Txt size={type.display} weight="display" accessibilityRole="header">
          {t('quakesTitle')}
        </Txt>
        <Txt size={type.label} tone="muted">
          {t('quakesSub', { n: seismic.earthquakes.length })}
        </Txt>
      </View>

      {f ? (
        <Section title={t('forecastTable')}>
          <Surface style={{ gap: space.sm }}>
            {w6 ? (
              <View style={{ gap: 2, marginBottom: space.xs }}>
                <Txt size={type.hero - 8} weight="display" numeric>
                  {pct(w6.probability)}
                </Txt>
                <Txt size={type.body} weight="semibold">
                  {t('heroCaption')}
                </Txt>
              </View>
            ) : null}
            <View style={[styles.row, { paddingBottom: 4 }]}>
              <Txt size={type.caption} tone="faint" weight="bold" style={{ flex: 1 }}>
                {t('magnitude').toUpperCase()}
              </Txt>
              {(['next24', 'nextWeek', 'nextMonth'] as const).map((k) => (
                <Txt key={k} size={type.caption} tone="faint" weight="bold" style={{ width: 74, textAlign: 'right' }}>
                  {t(k).toUpperCase()}
                </Txt>
              ))}
            </View>
            {[5, 6, 7].map((m) => (
              <View key={m} style={[styles.row, { borderTopWidth: 1, borderTopColor: c.line, minHeight: 46 }]}>
                <Txt size={type.body} weight="bold" style={{ flex: 1 }}>
                  M{m}+
                </Txt>
                {['1 Day', '1 Week', '1 Month'].map((label) => {
                  const b = bin(f, label, m);
                  const emphasize = m === 6 && label === '1 Week';
                  return (
                    <Txt key={label} size={type.body} weight={emphasize ? 'bold' : 'medium'} tone={emphasize ? 'accent' : 'ink'} numeric style={{ width: 74, textAlign: 'right' }}>
                      {b ? pct(b.probability) : '–'}
                    </Txt>
                  );
                })}
              </View>
            ))}
            <Txt size={type.label} tone="muted">
              {t('forecastCaveat')}
            </Txt>
          </Surface>
          <SourceLine source="USGS OAF" kind="official" detail={t('issued', { time: dayStamp(f.creationTime, lang) })} />
        </Section>
      ) : null}

      {groups.map((g) => (
        <Section key={g.key} title={`${g.label} · ${g.items.length}`}>
          <Group>
            {g.items.map((q) => (
              <QuakeRow key={q.id} q={q} onPress={() => onOpenQuake(q.id)} />
            ))}
          </Group>
        </Section>
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
      style={({ pressed }) => [styles.row, { paddingLeft: space.md, paddingRight: space.md, minHeight: 56, backgroundColor: pressed ? c.raised : 'transparent' }]}
    >
      <View
        style={{
          width: 46,
          height: 30,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: strong ? c.alert : c.raised,
        }}
      >
        <Txt size={type.label + 1} weight="bold" numeric style={{ color: strong ? c.alertInk : c.ink }}>
          {q.mag.toFixed(1)}
        </Txt>
      </View>
      <Txt size={type.body} style={{ flex: 1 }} numberOfLines={1}>
        {place(q.place, lang)}
      </Txt>
      <Txt size={type.label} tone="muted" numeric>
        {clock(q.time, lang)}
      </Txt>
    </Pressable>
  );
}

export function QuakeSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { c, t, lang, seismic } = useApp();
  const insets = useSafeAreaInsets();
  const q = seismic.earthquakes.find((x) => x.id === id) ?? null;
  return (
    <Modal visible={!!q} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(4,10,18,0.5)' }} onPress={onClose} accessibilityLabel={t('close')} />
      {q ? (
        <View
          style={{
            backgroundColor: c.surface,
            borderTopLeftRadius: radius.card,
            borderTopRightRadius: radius.card,
            padding: space.lg,
            paddingBottom: insets.bottom + space.lg,
            maxHeight: '85%',
          }}
        >
          <ScrollView contentContainerStyle={{ gap: space.md }}>
            <View style={styles.row}>
              <Txt size={type.hero - 16} weight="display" numeric style={{ flex: 1 }}>
                M{q.mag.toFixed(1)}
              </Txt>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('close')}
                onPress={onClose}
                style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.raised, alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={22} color={c.ink} />
              </Pressable>
            </View>
            <View>
              <Txt size={type.title} weight="semibold">
                {place(q.place, lang)}
              </Txt>
              <Txt size={type.body} tone="muted" numeric>
                {dayStamp(q.time, lang)}
              </Txt>
            </View>
            <Group style={{ backgroundColor: c.raised }}>
              <Detail label={t('depth')} value={q.depthKm != null ? `${Math.round(q.depthKm)} km` : '–'} />
              <Detail label={t('pager')} value={q.alert ?? t('pagerNone')} />
              <Detail
                label={t('coords')}
                value={`${Math.abs(q.lat).toFixed(2)}° ${q.lat >= 0 ? 'N' : 'S'}, ${Math.abs(q.lon).toFixed(2)}° ${q.lon >= 0 ? 'E' : lang === 'es' ? 'O' : 'W'}`}
              />
              <Detail label={t('reviewStatus')} value={q.status === 'reviewed' ? t('reviewed') : q.status} />
            </Group>
            <Button
              label={t('openUsgs')}
              variant="primary"
              onPress={() => Linking.openURL(`https://earthquake.usgs.gov/earthquakes/eventpage/${q.id}`).catch(() => {})}
            />
            <SourceLine source={`USGS · ${q.id}`} kind="official" />
          </ScrollView>
        </View>
      ) : null}
    </Modal>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={[styles.row, { minHeight: 50, paddingRight: space.md, justifyContent: 'space-between', paddingLeft: space.md, marginLeft: -space.md }]}>
      <Txt size={type.body} tone="muted">
        {label}
      </Txt>
      <Txt size={type.body} weight="semibold" numeric style={{ flexShrink: 1, textAlign: 'right' }}>
        {value}
      </Txt>
    </View>
  );
}
