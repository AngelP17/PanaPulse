import { ChevronDown, Droplets, Megaphone, Zap } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { PulseRail } from '../components/pulse';
import { Button, Group, Row, Section, SourceLine, StatusChip, Surface, Txt, styles } from '../components/ui';
import { ago, clock, dayStamp, longDate, pct, shortDate } from '../data/format';
import { naturgyPublishedThrough, noticesFor, providerFor } from '../data/utilities';
import { bin } from '../data/usgs';
import { useApp } from '../state/AppContext';
import { space, type } from '../theme/tokens';

export function Home() {
  const { c, t, lang, seismic, now, go, open, zone } = useApp();
  const f = seismic.forecast;
  const main = useMemo(() => seismic.earthquakes.find((q) => q.id === f?.mainshockId) ?? null, [seismic, f]);
  const w6 = bin(f, '1 Week', 6);
  const d6 = bin(f, '1 Day', 6);
  const w7 = bin(f, '1 Week', 7);
  const power = providerFor(zone);
  const notices = noticesFor(zone, now);
  const powerSub =
    power.provider === 'border'
      ? t('powerBorder')
      : t(power.verified ? 'powerVerified' : 'powerInferred', { name: power.name });
  const day = (ms: number) => dayStamp(ms, lang).split(',')[0];

  const dataNote =
    seismic.mode === 'live'
      ? t('liveNote', { time: clock(seismic.fetchedAt, lang) })
      : t('snapshotNote', { time: dayStamp(seismic.fetchedAt, lang) });

  return (
    <View style={{ gap: space.xl }}>
      {/* Zone header: the app is organized around where you are. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('myZone')}: ${zone}. ${t('changeZone')}`}
        onPress={() => open('zone')}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, gap: 2, paddingHorizontal: space.xxs })}
      >
        <Txt size={type.label} weight="bold" tone="muted" style={{ letterSpacing: 0.6 }}>
          {t('myZone').toUpperCase()}
        </Txt>
        <View style={[styles.row, { gap: 6 }]}>
          <Txt size={type.display} weight="display">
            {zone}
          </Txt>
          <ChevronDown size={24} color={c.accent} strokeWidth={2.4} />
        </View>
        <Txt size={type.caption + 1} tone="faint" numeric>
          {dataNote}
        </Txt>
      </Pressable>

      <Section title={t('pulseTitle')}>
        <Surface style={{ paddingHorizontal: space.sm, paddingVertical: space.md, gap: space.xs }}>
          <PulseRail
            nodes={[
              {
                label: t('power'),
                status: notices.length ? t('powerScheduled') : t('powerNone'),
                live: true,
                intensity: notices.length ? 0.3 : 0,
              },
              { label: t('water'), status: t('noSignal'), live: false },
              { label: t('metro'), status: t('noSignal'), live: false },
              { label: t('mibus'), status: t('noSignal'), live: false },
              {
                label: t('quakes'),
                status: f ? t('activeSequence') : t('noSignal'),
                live: true,
                intensity: w6 ? Math.min(1, w6.probability / 0.4) : 0,
              },
            ]}
          />
          <Txt size={type.caption} tone="faint" style={{ textAlign: 'center' }}>
            {t('pulseLegend')}
          </Txt>
        </Surface>
      </Section>

      {f && w6 ? (
        <Section title={t('sequenceTitle')}>
          <Surface>
            {main ? (
              <Txt size={type.label} tone="muted">
                {t('sequenceLead', { mag: main.mag.toFixed(1), date: longDate(main.time, lang) })}
              </Txt>
            ) : null}
            <View style={{ gap: 4 }}>
              <Txt size={type.hero} weight="display" numeric accessibilityLabel={`${pct(w6.probability)} ${t('heroCaption')}`}>
                {pct(w6.probability)}
              </Txt>
              <Txt size={type.body} weight="semibold">
                {t('heroCaption')}
              </Txt>
            </View>
            <View style={[styles.row, { gap: space.lg, flexWrap: 'wrap' }]}>
              {d6 ? <Stat label={t('m6day')} value={pct(d6.probability)} /> : null}
              {w7 ? <Stat label={t('m7week')} value={pct(w7.probability)} /> : null}
            </View>
            <Txt size={type.label} tone="muted">
              {t('forecastCaveat')}
            </Txt>
            <Button label={t('seeQuakes')} onPress={() => go('quakes')} />
          </Surface>
          <SourceLine source="USGS" kind="official" detail={t('issued', { time: dayStamp(f.creationTime, lang) })} />
        </Section>
      ) : null}

      <Section title={t('services')}>
        <Group>
          <Row
            icon={<Zap size={20} color={notices.length ? c.accent : c.muted} />}
            title={t('power')}
            subtitle={powerSub}
            value={<Txt size={type.label} weight="bold" tone={notices.length ? 'accent' : 'muted'}>{notices.length ? t('powerScheduled') : t('powerNone')}</Txt>}
          />
          {notices.slice(0, 3).map((n) => (
            <Row
              key={`${n.start}-${n.place}`}
              title={t('noticeLine', { day: day(n.start), from: clock(n.start, lang), to: clock(n.end, lang) })}
              subtitle={`${t('noticeAffected', { place: n.place, n: n.affected })} · ${n.task}`}
              value={<StatusChip kind="official" />}
            />
          ))}
          <Row icon={<Droplets size={20} color={c.muted} />} title={t('water')} subtitle={t('waterProvider')} value={t('unavailable')} />
          <Row
            icon={<Megaphone size={20} color={c.accent} />}
            title={t('reportCta')}
            subtitle={t('reportCtaSub')}
            onPress={() => go('reports')}
            chevron
          />
        </Group>
        <SourceLine
          source={power.provider === 'naturgy' ? t('powerSource', { name: 'Naturgy' }) : power.provider === 'ensa' ? t('powerSource', { name: 'ENSA' }) : 'Naturgy · ENSA'}
          kind="official"
          detail={t('updated', { ago: ago(power.sourceFetchedAt, now, lang) })}
        />
        <Txt size={type.caption + 1} tone="muted" style={{ paddingHorizontal: space.xxs }}>
          {t('powerScope')}
          {power.provider !== 'ensa' && !notices.length ? ` ${t('naturgyThrough', { date: shortDate(naturgyPublishedThrough, lang) })}` : ''}{' '}
          {t('servicesNote')}
        </Txt>
      </Section>

      <Txt size={type.caption} tone="faint" style={{ paddingHorizontal: space.xxs }}>
        USGS · {t('updated', { ago: ago(seismic.fetchedAt, now, lang) })}
      </Txt>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 0 }}>
      <Txt size={type.heading} weight="displaySemi" numeric>
        {value}
      </Txt>
      <Txt size={type.caption + 1} tone="muted">
        {label}
      </Txt>
    </View>
  );
}
