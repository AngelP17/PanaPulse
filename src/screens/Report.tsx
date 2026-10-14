import * as Haptics from 'expo-haptics';
import { CheckCircle2, Droplets, Zap } from 'lucide-react-native';
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { CORREGIMIENTOS } from '../data/services';
import { makeDemoScene } from '../data/demo';
import { NeighborhoodFeed } from '../components/NeighborhoodFeed';
import { ago } from '../data/format';
import { useApp } from '../state/AppContext';
import { font, radius, space, type } from '../theme/tokens';
import { PressScale } from '../components/motion';
import { Button, Card, StatusChip, Txt, styles } from '../components/ui';

export function Report() {
  const { c, t, lang, now, demoEnabled, demoScenario, demoReports, area, reports, addReport, removeReport } = useApp();
  const demo = makeDemoScene(now, demoScenario);
  // Same scenario/count as Home and Services, so demo surfaces cannot contradict each other.
  const demoCommunityCount = demo.communityReports + demoReports;
  const [service, setService] = useState<'electricity' | 'water'>('electricity');
  const [where, setWhere] = useState(area);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  // Live mode shows only what was written outside preview; preview text stays inside the preview.
  const mine = reports.filter((r) => r.scope === 'device');

  const submit = () => {
    addReport({ service, corregimiento: where, note });
    setSaved(true);
    setNote('');
    // One haptic for the one committed action, alongside the visible "saved" card. Never the only feedback.
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  return (
    <View style={{ gap: space.md }}>
      <View style={{ paddingHorizontal: space.xs, gap: space.xs }}>
        <Txt size={type.hero - 10} weight="bold" accessibilityRole="header">
          {t('reportTitle')}
        </Txt>
        <Txt size={type.body} tone="muted">
          {t(demoEnabled ? 'previewReportHint' : 'reportLead')}
        </Txt>
      </View>

      {demoEnabled ? (
        <NeighborhoodFeed limit={20} />
      ) : null}
      {saved ? (
        <Card>
          <View style={styles.row}>
            <CheckCircle2 size={24} color={c.official} />
            <Txt size={type.title} weight="semibold" style={{ flex: 1 }}>
              {t(demoEnabled ? 'previewReportSaved' : 'saved')}
            </Txt>
          </View>
          <Txt size={type.body} tone="muted">
            {t(demoEnabled ? 'previewReportSavedBody' : 'savedBody')}
          </Txt>
          <Button label={t('newOne')} onPress={() => setSaved(false)} />
        </Card>
      ) : (
        <Card>
          <Txt size={type.label} weight="semibold" tone="muted">
            {t('whatService').toUpperCase()}
          </Txt>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            {(['electricity', 'water'] as const).map((s) => {
              const active = service === s;
              const Icon = s === 'electricity' ? Zap : Droplets;
              return (
                <PressScale
                  key={s}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  onPress={() => setService(s)}
                  style={{ flex: 1, minHeight: 88, borderRadius: radius.tile, padding: space.md, gap: 8, backgroundColor: active ? c.navActive : c.tile }}
                >
                  <Icon size={22} color={active ? c.navActiveInk : c.ink} />
                  <Txt size={type.title} weight="semibold" style={{ color: active ? c.navActiveInk : c.ink }}>
                    {s === 'electricity' ? t('power') : t('water')}
                  </Txt>
                </PressScale>
              );
            })}
          </View>

          <Txt size={type.label} weight="semibold" tone="muted" style={{ marginTop: space.xs }}>
            {t('where').toUpperCase()}
          </Txt>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.xs }}>
            {CORREGIMIENTOS.map((name) => {
              const active = where === name;
              return (
                <Pressable
                  key={name}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  onPress={() => setWhere(name)}
                  style={{ paddingHorizontal: space.md, minHeight: 44, justifyContent: 'center', borderRadius: radius.pill, backgroundColor: active ? c.navActive : c.tile }}
                >
                  <Txt size={type.label} weight="semibold" style={{ color: active ? c.navActiveInk : c.ink }}>
                    {name}
                  </Txt>
                </Pressable>
              );
            })}
          </ScrollView>

          <Txt size={type.label} weight="semibold" tone="muted" style={{ marginTop: space.xs }}>
            {t('note').toUpperCase()}
          </Txt>
          <TextInput
            nativeID="report-note"
            value={note}
            onChangeText={(v) => setNote(v.slice(0, 200))}
            placeholder={t('notePlaceholder')}
            placeholderTextColor={c.faint}
            multiline
            accessibilityLabel={t('note')}
            style={{ minHeight: 84, borderRadius: radius.tile, backgroundColor: c.tile, padding: space.md, color: c.ink, fontFamily: font.medium, fontSize: type.body, textAlignVertical: 'top' }}
          />
          <Txt size={type.caption + 1} tone="muted">{t('neighborPrivacy')}</Txt>
          <Button label={t('submit')} variant="solid" onPress={submit} />
        </Card>
      )}

      {!demoEnabled && mine.length > 0 ? (
        <Card style={{ gap: space.sm }}>
          <Txt size={type.title} weight="semibold">{t('myReports')}</Txt>
          <Txt size={type.caption + 1} tone="muted">{t('neighborMyLocalOnly')}</Txt>
          {mine.slice(0, 10).map((r) => (
            <View key={r.id}
              style={{ borderBottomWidth: 1, borderBottomColor: c.line, paddingVertical: space.sm, gap: space.xs }}>
              <View style={styles.row}>
                {r.service === 'electricity'
                  ? <Zap size={18} color={c.ink} />
                  : <Droplets size={18} color={c.ink} />}
                <Txt size={type.body} weight="semibold" style={{ flex: 1 }}>{r.corregimiento}</Txt>
                <Txt size={type.label} tone="muted">{ago(r.at, now, lang)}</Txt>
              </View>
              {r.note ? <Txt size={type.body}>{r.note}</Txt> : null}
              <Pressable accessibilityRole="button" accessibilityLabel={t('deleteReport')} onPress={() => removeReport(r.id)}
                hitSlop={8} style={{ alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' }}>
                <Txt size={type.label} weight="semibold" style={{ color: c.accent }}>{t('deleteReport')}</Txt>
              </Pressable>
            </View>
          ))}
        </Card>
      ) : null}
    </View>
  );
}
