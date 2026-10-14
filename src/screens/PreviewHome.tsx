import { Activity, Droplets, Megaphone, TrainFront, Zap } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { DemoCommuteCard, DemoControls } from './DemoScreens';
import { SectionHeading } from '../components/section';
import { Button, Card, CardHeader, SourceLine, Txt } from '../components/ui';
import { makeDemoScene } from '../data/demo';
import { NeighborhoodFeed } from '../components/NeighborhoodFeed';
import { dayStamp, place } from '../data/format';
import { useApp } from '../state/AppContext';
import { radius, space, type } from '../theme/tokens';

/**
 * One cohesive product walkthrough. The persistent preview pill in Shell
 * scopes fictional service information, and the last-known USGS panel is REAL.
 */
export function PreviewHome({ onOpenQuake }: { onOpenQuake: (id: string) => void }) {
  const { c, t, lang, now, demoScenario, demoReports, demoCommuteSaved, seismic, go, area } = useApp();
  const scene = makeDemoScene(now, demoScenario);
  const latest = seismic.earthquakes.length
    ? [...seismic.earthquakes].sort((a, b) => b.time - a.time)[0]
    : null;
  const issue = demoScenario === 'disruption';
  const recovering = demoScenario === 'recovery';
  const headline = issue ? t('previewPowerIncident')
    : recovering ? t('previewPowerRecover')
    : t('previewUpdateHeadline');
  const detail = issue ? t('previewPowerIncidentDetail')
    : recovering ? t('previewPowerRecoverDetail')
    : t('previewUpdateDetail');
  const power = issue ? t('previewPowerIssue') : recovering ? t('previewPowerRestoring') : t('previewPowerPlan');
  const water = issue ? t('previewWaterIssue') : recovering ? t('previewWaterRecover') : t('previewWaterGood');

  return (
    <View style={{ gap: space.md }}>
      <View style={{ paddingHorizontal: space.xs, gap: 3 }}>
        <Txt size={type.label} tone="muted">{t('areaEyebrow')}</Txt>
        <Txt size={type.hero} weight="bold" accessibilityRole="header" style={{ letterSpacing: -1 }}>{area}</Txt>
        <Txt size={type.label} tone="muted">{t('previewHomeCaption')}</Txt>
      </View>

      <Card style={{ padding: space.xl, gap: space.md }}>
        <Txt size={type.caption + 1} weight="semibold" tone="muted">{t('previewHomeHeading')}</Txt>
        <Txt size={type.hero - 15} weight="bold" accessibilityRole="header" style={{ letterSpacing: -0.5 }}>{headline}</Txt>
        <Txt size={type.body} tone="muted">{detail}</Txt>
        <Button label={t('previewQuickAction')} variant="solid" onPress={() => go('services')} />
      </Card>

      <DemoControls />

      <SectionHeading title={t('categoryServices')} subtitle={t('previewHomeCaption')} />
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Card style={{ gap: space.sm, padding: space.md, minHeight: 128 }}>
            <Zap size={21} color={c.ink} />
            <Txt size={type.label} tone="muted">{t('power')}</Txt>
            <Txt size={type.body} weight="bold">{power}</Txt>
          </Card>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Card style={{ gap: space.sm, padding: space.md, minHeight: 128 }}>
            <Droplets size={21} color={c.ink} />
            <Txt size={type.label} tone="muted">{t('water')}</Txt>
            <Txt size={type.body} weight="bold">{water}</Txt>
          </Card>
        </View>
      </View>
      <Button label={t('viewServices')} onPress={() => go('services')} />

      <SectionHeading title={t('categoryMobility')} subtitle={t('previewTransitMeta')} />
      {demoCommuteSaved ? (
        <DemoCommuteCard onDetails={() => go('mobility')} />
      ) : (
        <Card>
          <CardHeader title={t('demoTripTitle')} icon={<TrainFront size={20} color={c.ink} />} />
          <Txt size={type.label} tone="muted">{t('previewRouteNotSaved')}</Txt>
          <Button label={t('previewSaveRoute')} onPress={() => go('mobility')} />
        </Card>
      )}

      <SectionHeading title={t('previewSectionCommunity')} subtitle={t('categoryCommunityHint')} />
      <NeighborhoodFeed limit={2} onViewAll={() => go('report')} />

      <SectionHeading title={t('categorySeismic')} subtitle={t('categorySeismicHint')} />
      <Card style={{ gap: space.sm }}>
        <CardHeader title="USGS" icon={<Activity size={19} color={c.ink} />} />
        {latest ? (
          <>
            <Txt size={type.title + 2} weight="bold">
              M{latest.mag.toFixed(1)} · {place(latest.place, lang)}
            </Txt>
            <Txt size={type.label} tone="muted" numeric>{dayStamp(latest.time, lang)}</Txt>
          </>
        ) : (
          <Txt size={type.label} tone="muted">{t('heroStaleDetail')}</Txt>
        )}
        <SourceLine source="USGS" kind={seismic.mode === 'live' && now - seismic.fetchedAt < 20 * 60 * 1000 ? 'official' : 'stale'} detail={dayStamp(seismic.fetchedAt, lang)} />
        <Button label={t('heroQuakeAction')} onPress={() => latest ? onOpenQuake(latest.id) : go('quakes')} />
      </Card>
    </View>
  );
}
