import * as Haptics from 'expo-haptics';
import { CheckCircle2, ChevronLeft, Droplets, Zap } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { CORREGIMIENTOS } from '../data/services';
import { makeDemoScene } from '../data/demo';
import { ago } from '../data/format';
import type { AnonymousReport } from '../data/neighborhood';
import { activityFeed, filterActivity } from '../data/reportsView';
import type { ScopeFilter, ServiceFilter } from '../data/reportsView';
import { useApp } from '../state/AppContext';
import { font, radius, space, type } from '../theme/tokens';
import { PressScale } from '../components/motion';
import { Button, Card, Txt, styles } from '../components/ui';

type Tab = 'feed' | 'new';

export function Report() {
  const { c, t, lang, now, demoEnabled, demoScenario, area, reports, addReport, removeReport } = useApp();
  const [tab, setTab] = useState<Tab>('feed');
  const [filterService, setFilterService] = useState<ServiceFilter>('all');
  const [scope, setScope] = useState<ScopeFilter>('area');
  const [openId, setOpenId] = useState<string | null>(null);
  const [service, setService] = useState<'electricity' | 'water'>('electricity');
  const [where, setWhere] = useState(area);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  const scene = makeDemoScene(now, demoScenario);
  // Live mode lists only what the user wrote on this device. Preview adds clearly labeled examples.
  const all = useMemo(
    () => activityFeed({ previewOn: demoEnabled, now, scenario: demoScenario, exampleCount: scene.communityReports, area, local: reports }),
    [demoEnabled, now, demoScenario, scene.communityReports, area, reports],
  );
  const items = filterActivity(all, filterService, scope, area);
  const open = openId ? all.find((r) => r.id === openId) : undefined;

  const submit = () => {
    addReport({ service, corregimiento: where, note });
    setNote('');
    setSaved(true);
    setTab('feed');
    setScope('city');
    setFilterService('all');
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const chip = (label: string, active: boolean, onPress: () => void) => (
    <Pressable key={label} accessibilityRole="radio" accessibilityState={{ selected: active }} onPress={onPress}
      style={{ paddingHorizontal: space.md, minHeight: 44, justifyContent: 'center', borderRadius: radius.pill, backgroundColor: active ? c.navActive : c.tile }}>
      <Txt size={type.label} weight="semibold" style={{ color: active ? c.navActiveInk : c.ink }}>{label}</Txt>
    </Pressable>
  );

  const badge = (r: AnonymousReport) => (
    <View style={{ alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: space.sm, paddingVertical: 3,
      borderWidth: 1, borderStyle: r.origin === 'local' ? 'solid' : 'dashed', borderColor: c.line }}>
      <Txt size={type.caption} weight="semibold" tone="muted">{t(r.origin === 'local' ? 'badgeYours' : 'badgeExample')}</Txt>
    </View>
  );
  const text = (r: AnonymousReport) => r.note || (r.descriptionKey ? t(r.descriptionKey) : '');
  const serviceName = (r: AnonymousReport) => t(r.service === 'electricity' ? 'power' : 'water');

  const header = (
    <View style={{ paddingHorizontal: space.xs, gap: space.xs }}>
      <Txt size={type.hero - 10} weight="bold" accessibilityRole="header">{t('reportTitle')}</Txt>
      <Txt size={type.body} tone="muted">{t(demoEnabled ? 'previewReportHint' : 'reportLead')}</Txt>
    </View>
  );

  if (open) {
    const Icon = open.service === 'electricity' ? Zap : Droplets;
    return (
      <View style={{ gap: space.md }}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('reportBack')} onPress={() => setOpenId(null)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs, minHeight: 44 }}>
          <ChevronLeft size={20} color={c.accent} />
          <Txt size={type.body} weight="semibold" style={{ color: c.accent }}>{t('reportBack')}</Txt>
        </Pressable>
        <Card style={{ gap: space.sm }}>
          <Txt size={type.label} weight="semibold" tone="muted" accessibilityRole="header">{t('reportDetailTitle').toUpperCase()}</Txt>
          <View style={styles.row}>
            <Icon size={22} color={c.ink} />
            <Txt size={type.title} weight="semibold" style={{ flex: 1 }}>{serviceName(open)} · {open.corregimiento}</Txt>
          </View>
          <Txt size={type.body}>{text(open)}</Txt>
          <Txt size={type.label} tone="muted">{ago(open.at, now, lang)} · {new Date(open.at).toLocaleString(lang === 'es' ? 'es-PA' : 'en-US')}</Txt>
          {badge(open)}
          <Txt size={type.caption + 1} tone="muted">{t('reportNotOfficial')}</Txt>
          {open.origin === 'local' ? (
            <Button label={t('deleteReport')} onPress={() => { removeReport(open.id); setOpenId(null); }} />
          ) : null}
        </Card>
      </View>
    );
  }

  return (
    <View style={{ gap: space.md }}>
      {header}
      <View style={{ flexDirection: 'row', gap: space.xs }}>
        {chip(t('reportTabFeed'), tab === 'feed', () => setTab('feed'))}
        {chip(t('reportTabNew'), tab === 'new', () => { setTab('new'); setSaved(false); })}
      </View>

      {tab === 'feed' ? (
        <>
          {saved ? (
            <Card>
              <View style={styles.row}>
                <CheckCircle2 size={22} color={c.official} />
                <Txt size={type.body} weight="semibold" style={{ flex: 1 }}>{t('reportSavedBanner')}</Txt>
              </View>
            </Card>
          ) : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
            {chip(t('filterAll'), filterService === 'all', () => setFilterService('all'))}
            {chip(t('power'), filterService === 'electricity', () => setFilterService('electricity'))}
            {chip(t('water'), filterService === 'water', () => setFilterService('water'))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
            {chip(`${t('scopeArea')} · ${area}`, scope === 'area', () => setScope('area'))}
            {chip(t('scopeCity'), scope === 'city', () => setScope('city'))}
          </View>
          <Card style={{ gap: space.xs }}>
            {items.length ? items.slice(0, 30).map((r) => {
              const Icon = r.service === 'electricity' ? Zap : Droplets;
              return (
                <Pressable key={r.id} accessibilityRole="button" accessibilityLabel={`${serviceName(r)}, ${r.corregimiento}, ${text(r)}`}
                  onPress={() => setOpenId(r.id)}
                  style={{ paddingVertical: space.sm, gap: space.xs, borderBottomColor: c.line, borderBottomWidth: 1, minHeight: 56 }}>
                  <View style={styles.row}>
                    <Icon size={18} color={c.ink} />
                    <Txt size={type.label} weight="semibold" style={{ flex: 1 }}>{serviceName(r)} · {r.corregimiento}</Txt>
                    <Txt size={type.label} tone="muted">{ago(r.at, now, lang)}</Txt>
                  </View>
                  <Txt size={type.body} numberOfLines={2}>{text(r)}</Txt>
                  {badge(r)}
                </Pressable>
              );
            }) : (
              <View style={{ gap: space.sm }}>
                <Txt size={type.body} tone="muted">{t(all.length ? 'reportEmptyFilter' : 'reportEmptyLive')}</Txt>
                {all.length ? <Button label={t('reportClearFilters')} onPress={() => { setFilterService('all'); setScope('city'); }} /> : <Button label={t('reportTabNew')} onPress={() => setTab('new')} />}
              </View>
            )}
          </Card>
          <Txt size={type.caption + 1} tone="muted" style={{ paddingHorizontal: space.xs }}>{t('reportNotOfficial')}</Txt>
        </>
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
    </View>
  );
}
