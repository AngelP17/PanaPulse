import { Droplets, ExternalLink, Megaphone, Zap } from 'lucide-react-native';
import React from 'react';
import { Linking, View } from 'react-native';
import { Button, Card, CardHeader, StatusChip, Txt } from '../components/ui';
import { SectionHeading } from '../components/section';
import { NeighborhoodFeed } from '../components/NeighborhoodFeed';
import { makeDemoScene } from '../data/demo';
import { DemoControls, DemoUtilityCard, PreviewServices } from './DemoScreens';
import { usePowerMaintenance, powerFeedState } from '../data/maintenance';
import { powerSurfaceSource } from '../data/sourcePolicy';
import { useApp } from '../state/AppContext';
import { radius, space, type } from '../theme/tokens';

export function Services() {
  const { c, t, lang, go, demoEnabled, demoScenario, now, area: ZONE } = useApp();
  const demo = makeDemoScene(now, demoScenario);
  const { data, state } = usePowerMaintenance(ZONE);
  const powerSource = powerSurfaceSource(powerFeedState(data, state), demoEnabled);
  const current = powerSource === 'official';
  const notices = data?.notices ?? [];
  const fmt = new Intl.DateTimeFormat(lang === 'es' ? 'es-PA' : 'en-US', {
    timeZone: 'America/Panama', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  });
  if (demoEnabled && powerSource === 'example') return <PreviewServices />;
  return (
    <View style={{ gap: space.md }}>
      <View style={{ paddingHorizontal: space.xs, gap: space.xs }}>
        <Txt size={type.hero - 10} weight="bold" accessibilityRole="header">{t('categoryServices')}</Txt>
        <Txt size={type.body} tone="muted">{ZONE} · {t('serviceScope')}</Txt>
      </View>
      {demoEnabled ? <DemoControls /> : null}
      <SectionHeading title={t(powerSource === 'example' ? 'power' : 'scheduledMaintenance')}
        subtitle={t(demoEnabled && state !== 'ready' ? 'demoRealtimeDescription' : 'scheduledOnlyCaption')} />
      {demoEnabled && state !== 'ready' ? <DemoUtilityCard service="power" state={demo.power} /> : (
      <Card>
        <CardHeader icon={<Zap size={19} color={c.stale} />} title={t('power')}
          right={<StatusChip kind={current && notices.length ? 'official' : 'unavailable'} />} />
        <Txt size={type.body} tone="muted">
          {current ? (notices.length ? t('scheduledNearYou') : t('noPlannedNoticesExplain'))
            : state === 'loading' ? t('loadingMaintenance')
            : state === 'error' ? t('maintenanceFetchFailed') : t('maintenanceNotConnected')}
        </Txt>
        {notices.slice(0, 10).map((n) => (
          <View key={n.id} style={{ backgroundColor: c.tile, borderRadius: radius.tile, padding: space.md, gap: space.xs }}>
            <Txt size={type.body} weight="semibold">{n.place}</Txt>
            <Txt size={type.label} tone="muted">
              {n.provider} · {fmt.format(new Date(n.start))} - {fmt.format(new Date(n.end))}
            </Txt>
            <StatusChip kind={n.source_freshness === 'current' ? 'official' : 'stale'} />
            <Button label={t('openOfficial')} onPress={() => Linking.openURL(n.source_url).catch(() => {})}
              icon={<ExternalLink size={16} color={c.ink} />} />
          </View>
        ))}
        <Txt size={type.caption + 1} tone="muted">{t('notServiceConfirmation')}</Txt>
        {data?.sources.map((source) => (
          <Txt key={source.provider} size={type.caption} tone="muted">
            {source.provider.toUpperCase()} · {source.last_success_at ? fmt.format(new Date(source.last_success_at)) : t('unavailable')}
          </Txt>
        ))}
      </Card>
      )}
      <Card style={{ gap: space.xs }}>
        <Txt size={type.label} weight="semibold" tone="muted">{t('realSourceLinksTitle')}</Txt>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <View style={{ flex: 1 }}><Button label="Naturgy" onPress={() => Linking.openURL('https://www.naturgy.com.pa/cronogramas-mantenimiento/').catch(() => {})} /></View>
          <View style={{ flex: 1 }}><Button label="ENSA" onPress={() => Linking.openURL('https://ensa.com.pa/mantenimientos-programados/').catch(() => {})} /></View>
        </View>
      </Card>
      <SectionHeading title={t('categoryWater')} subtitle={t('waterCategoryHint')} />
      {demoEnabled ? <DemoUtilityCard service="water" state={demo.water} /> : (
      <Card>
        <CardHeader icon={<Droplets size={19} color={c.muted} />} title="IDAAN" right={<StatusChip kind="unavailable" />} />
        <Txt size={type.body} tone="muted">{t('waterOfficial')}</Txt>
        <Txt size={type.label} tone="muted">{t('waterCommunity')}</Txt>
      </Card>
      )}
      {demoEnabled ? (
        <Button label={t('openOfficial')} onPress={() => Linking.openURL('https://www.idaan.gob.pa/').catch(() => {})} />
      ) : null}
      <SectionHeading title={t('categoryCommunity')} subtitle={t('categoryCommunityHint')} />
      {demoEnabled ? (
        <NeighborhoodFeed limit={3} onViewAll={() => go('report')} />
      ) : (
        <Button label={t('reportCta')} icon={<Megaphone size={18} color={c.community} />} onPress={() => go('report')} />
      )}
    </View>
  );
}
