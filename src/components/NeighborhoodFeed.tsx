import { Droplets, Zap } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { ago } from '../data/format';
import { neighborhoodFeed } from '../data/neighborhood';
import type { AnonymousReport } from '../data/neighborhood';
import { makeDemoScene } from '../data/demo';
import { useApp } from '../state/AppContext';
import { radius, space, type } from '../theme/tokens';
import { Button, Card, Txt } from './ui';

function AnonymousReportRow({ report }: { report: AnonymousReport }) {
  const { c, t, lang, now } = useApp();
  const Icon = report.service === 'electricity' ? Zap : Droplets;
  const description = report.note || (report.descriptionKey ? t(report.descriptionKey) : '');
  return (
    <View style={{ paddingVertical: space.sm, gap: space.xs, borderBottomColor: c.line, borderBottomWidth: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <View style={{ height: 34, width: 34, borderRadius: radius.pill, backgroundColor: c.tileStrong,
          alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={17} color={c.ink} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt size={type.label} weight="semibold">{t('neighborAnonymous')}</Txt>
          <Txt size={type.caption + 1} tone="muted">
            {report.corregimiento} · {ago(report.at, now, lang)}
          </Txt>
        </View>
      </View>
      <Txt size={type.body}>{description}</Txt>
    </View>
  );
}

/** Preview-only report feed, clearly scoped by the single app-level preview pill. */
export function NeighborhoodFeed({ limit = 3, onViewAll, header = true }: {
  limit?: number; onViewAll?: () => void; header?: boolean;
}) {
  const { t, now, demoScenario, demoSubmittedReports } = useApp();
  const scene = makeDemoScene(now, demoScenario);
  const feed = neighborhoodFeed(now, demoScenario, scene.communityReports, demoSubmittedReports);
  return (
    <Card style={{ gap: space.sm }}>
      {header ? (
        <Txt size={type.title} weight="semibold" accessibilityRole="header">{t('neighborFeedTitle')}</Txt>
      ) : null}
      {feed.slice(0, limit).length
        ? feed.slice(0, limit).map((entry) => <AnonymousReportRow key={entry.id} report={entry} />)
        : <Txt size={type.body} tone="muted">{t('neighborEmpty')}</Txt>}
      {onViewAll ? <Button label={t('neighborFeedAll')} onPress={onViewAll} /> : null}
    </Card>
  );
}
