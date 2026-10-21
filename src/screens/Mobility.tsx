import { PREVIEW_ALLOWED } from '../data/runtime';
import { ArrowUpRight, Bus, TrainFront } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { Button, Card, LinkChip, SourceLine, Txt, styles } from '../components/ui';
import { DemoMobility } from './DemoScreens';
import { SERVICES } from '../data/services';
import { useApp } from '../state/AppContext';
import { space, type } from '../theme/tokens';

/**
 * Live Mobility starts with honest, useful official channels rather than
 * three duplicate missing-feed cards. Preview uses the complete demo flow.
 */
export function Mobility() {
  const { c, t, demoEnabled, setDemoEnabled } = useApp();
  if (demoEnabled) return <DemoMobility />;
  return (
    <View style={{ gap: space.md }}>
      <View style={{ paddingHorizontal: space.xs, gap: space.xs }}>
        <Txt size={type.hero - 10} weight="bold" accessibilityRole="header">
          {t('mobilityTitle')}
        </Txt>
        <Txt size={type.label} tone="muted">{t('mobilityAreaCaption')}</Txt>
      </View>
      <Card style={{ padding: space.xl, gap: space.md }}>
        <View style={[styles.row, { gap: space.sm }]}>
          <TrainFront size={23} color={c.ink} />
          <Txt size={type.label} weight="semibold" tone="muted" style={{ flex: 1 }}>
            {t('mobilityProviderEyebrow')}
          </Txt>
          <ArrowUpRight size={19} color={c.muted} />
        </View>
        <Txt size={type.title + 6} weight="bold" accessibilityRole="header">
          {t('mobilityProviderHeadline')}
        </Txt>
        <Txt size={type.body} tone="muted">
          {t('mobilityProviderDetail')}
        </Txt>
        <View style={[styles.row, { flexWrap: 'wrap', gap: space.sm }]}>
          <LinkChip label="Metro de Panamá" url={SERVICES.metro_l1.officialUrl} />
          <LinkChip label="MiBus" url={SERVICES.mibus.officialUrl} />
        </View>
        <SourceLine source="Metro de Panamá · MiBus" kind="unavailable"
          detail={t('mobilityProviderScope')} />
      </Card>
      {PREVIEW_ALLOWED ? <Card style={{ gap: space.sm }}>
        <View style={[styles.row, { gap: space.sm }]}>
          <Bus size={19} color={c.ink} />
          <Txt size={type.title} weight="semibold" style={{ flex: 1 }}>
            {t('mobilityPreviewTitle')}
          </Txt>
        </View>
        <Txt size={type.body} tone="muted">
          {t('mobilityPreviewDescription')}
        </Txt>
        <Button label={t('mobilityPreviewAction')} variant="solid"
          onPress={() => setDemoEnabled(true)} />
      </Card> : null}
    </View>
  );
}
