import { Activity, Check, MapPin, TrainFront, Zap } from 'lucide-react-native';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CORREGIMIENTOS } from '../data/services';
import { useApp } from '../state/AppContext';
import { radius, space, type } from '../theme/tokens';
import { PressScale } from '../components/motion';
import { Button, Card, Txt } from '../components/ui';

const NODE = 48;

/**
 * Offline-first welcome: one real preference form, never a fake location permission.
 *
 * The connected path (the product's own motif) runs from what the app shows to the one decision the
 * user makes first: their corregimiento. Nodes are decorative and carry no status meaning, so they
 * stay neutral (coral is reserved for interaction) and are hidden from screen readers.
 */
export function Onboarding() {
  const { c, t, lang, setLang, themePref, setThemePref, area, setArea, completeOnboarding } = useApp();
  const insets = useSafeAreaInsets();
  const steps = [
    { Icon: Activity, title: t('onboardQuake'), text: t('onboardQuakeDetail'), last: false },
    { Icon: Zap, title: t('onboardServices'), text: t('onboardServicesDetail'), last: false },
    { Icon: TrainFront, title: t('onboardCommute'), text: t('onboardCommuteDetail'), last: false },
    { Icon: MapPin, title: t('onboardAreaTitle'), text: t('onboardAreaHint'), last: true },
  ];
  return (
    <ScrollView keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        maxWidth: 560, width: '100%', alignSelf: 'center', gap: space.md,
        paddingHorizontal: space.md, paddingTop: insets.top + space.md,
        paddingBottom: insets.bottom + space.xl,
      }}>
      <View style={{ paddingHorizontal: space.xs, gap: space.xs }}>
        <Txt size={type.label} weight="semibold" tone="muted">{t('onboardEyebrow')}</Txt>
        <Txt size={type.hero - 4} weight="bold" accessibilityRole="header">
          {t('onboardTitle')}
        </Txt>
        <Txt size={type.body} tone="muted">{t('onboardSubtitle')}</Txt>
      </View>
      <View style={{ paddingHorizontal: space.sm, paddingTop: space.xs }}>
        {steps.map(({ Icon, title, text, last }) => (
          <View key={title} style={{ flexDirection: 'row', gap: space.md }}>
            <View style={{ width: NODE, alignItems: 'center' }}
              accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
              {!last ? (
                <View style={{ position: 'absolute', top: NODE + 4, bottom: 4, width: 2, borderRadius: 1,
                  backgroundColor: c.line }} />
              ) : null}
              <View style={{ width: NODE, height: NODE, borderRadius: NODE / 2,
                borderWidth: last ? 1.5 : 1, borderColor: last ? c.ink : c.line,
                backgroundColor: last ? c.tileStrong : c.tile,
                alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={22} color={c.ink} />
              </View>
            </View>
            <View style={{ flex: 1, gap: space.xxs, paddingTop: space.xs,
              paddingBottom: last ? space.xs : space.md }}>
              <Txt size={type.title} weight="semibold" accessibilityRole={last ? 'header' : undefined}>{title}</Txt>
              <Txt size={type.label} tone="muted">{text}</Txt>
            </View>
          </View>
        ))}
      </View>
      <Card style={{ gap: space.md }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
          {CORREGIMIENTOS.map((name) => {
            const selected = name === area;
            return (
              <PressScale key={name} accessibilityRole="button"
                accessibilityLabel={name} accessibilityState={{ selected }}
                onPress={() => setArea(name)}
                style={{ borderRadius: radius.pill, backgroundColor: selected ? c.navActive : c.tile,
                  minHeight: 44, paddingHorizontal: space.md,
                  alignItems: 'center', flexDirection: 'row', gap: space.xs }}>
                {selected ? <Check size={15} color={c.navActiveInk} /> : null}
                <Txt size={type.label} weight={selected ? 'semibold' : 'regular'}
                  style={{ color: selected ? c.navActiveInk : c.ink }}>{name}</Txt>
              </PressScale>
            );
          })}
        </View>
      </Card>
      <Card style={{ gap: space.md }}>
        <Txt size={type.title} weight="semibold">{t('onboardPreferences')}</Txt>
        <Txt size={type.label} tone="muted">{t('onboardLanguage')}</Txt>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {(['es','en'] as const).map((value) => (
            <View key={value} style={{ flex: 1 }}>
              <Button label={value === 'es' ? 'Español' : 'English'} variant={lang === value ? 'solid' : 'soft'}
                onPress={() => setLang(value)} />
            </View>
          ))}
        </View>
        <Txt size={type.label} tone="muted">{t('onboardAppearance')}</Txt>
        <View style={{ flexDirection: 'row', gap: space.xs }}>
          {(['auto','light','dark'] as const).map((value) => (
            <View key={value} style={{ flex: 1 }}>
              <PressScale accessibilityRole="button" accessibilityState={{ selected: themePref === value }}
                accessibilityLabel={t(value === 'auto' ? 'themeAuto' : value === 'light' ? 'themeLight' : 'themeDark')}
                onPress={() => setThemePref(value)}
                style={{ paddingHorizontal: space.xs, minHeight: 50, borderRadius: radius.tile,
                  backgroundColor: themePref === value ? c.navActive : c.tile,
                  justifyContent: 'center', alignItems: 'center' }}>
                <Txt size={type.label} weight="semibold"
                  style={{ color: themePref === value ? c.navActiveInk : c.ink }}>
                  {t(value === 'auto' ? 'themeAuto' : value === 'light' ? 'themeLight' : 'themeDark')}
                </Txt>
              </PressScale>
            </View>
          ))}
        </View>
      </Card>
      <Txt size={type.label} tone="muted">{t('onboardDisclaimer')}</Txt>
      <Button label={t('onboardGetStarted')} variant="solid" onPress={completeOnboarding} />
    </ScrollView>
  );
}
