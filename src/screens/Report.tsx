import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { CheckCircle2, Droplets, Zap } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { CORREGIMIENTOS } from '../data/services';
import { ago } from '../data/format';
import { useApp } from '../state/AppContext';
import { font, radius, space, type } from '../theme/tokens';
import { PressScale } from '../components/motion';
import { Button, Card, StatusChip, Txt, styles } from '../components/ui';

interface LocalReport {
  service: 'electricity' | 'water';
  corregimiento: string;
  note: string;
  at: number;
}
const KEY = 'panapulse.reports.v1';

async function loadReports(): Promise<LocalReport[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function Report() {
  const { c, t, lang, now } = useApp();
  const [service, setService] = useState<'electricity' | 'water'>('electricity');
  const [where, setWhere] = useState('Pueblo Nuevo');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const [mine, setMine] = useState<LocalReport[]>([]);

  useEffect(() => {
    loadReports().then(setMine);
  }, []);

  const submit = async () => {
    const r: LocalReport = { service, corregimiento: where, note: note.trim().slice(0, 200), at: Date.now() };
    const next = [r, ...mine].slice(0, 20);
    setMine(next);
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* still shown for this session */
    }
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
          {t('reportLead')}
        </Txt>
      </View>

      {saved ? (
        <Card>
          <View style={styles.row}>
            <CheckCircle2 size={24} color={c.official} />
            <Txt size={type.title} weight="semibold" style={{ flex: 1 }}>
              {t('saved')}
            </Txt>
          </View>
          <Txt size={type.body} tone="muted">
            {t('savedBody')}
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
          <Button label={t('submit')} variant="solid" onPress={submit} />
        </Card>
      )}

      {mine.length > 0 ? (
        <Card style={{ gap: space.xs }}>
          <Txt size={type.body} weight="semibold">
            {t('myReports')}
          </Txt>
          {mine.slice(0, 5).map((r) => (
            <View key={r.at} style={[styles.row, { backgroundColor: c.tile, borderRadius: radius.tile, padding: space.sm, paddingHorizontal: space.md, minHeight: 52 }]}>
              {r.service === 'electricity' ? <Zap size={18} color={c.muted} /> : <Droplets size={18} color={c.muted} />}
              <Txt size={type.body} style={{ flex: 1 }} numberOfLines={1}>
                {r.corregimiento}
              </Txt>
              <Txt size={type.label} tone="muted">
                {ago(r.at, now, lang)}
              </Txt>
              <StatusChip kind="community" />
            </View>
          ))}
        </Card>
      ) : null}
    </View>
  );
}
