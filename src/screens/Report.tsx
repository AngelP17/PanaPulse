import AsyncStorage from '@react-native-async-storage/async-storage';
import { CheckCircle2, ChevronDown, Droplets, Zap } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Button, Group, Row, Section, StatusChip, Surface, Txt, styles } from '../components/ui';
import { ago } from '../data/format';
import { useApp } from '../state/AppContext';
import { font, radius, space, type } from '../theme/tokens';

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
  const { c, t, lang, now, zone, open } = useApp();
  const [service, setService] = useState<'electricity' | 'water'>('electricity');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const [mine, setMine] = useState<LocalReport[]>([]);

  useEffect(() => {
    loadReports().then(setMine);
  }, []);

  const submit = async () => {
    const r: LocalReport = { service, corregimiento: zone, note: note.trim().slice(0, 200), at: Date.now() };
    const next = [r, ...mine].slice(0, 20);
    setMine(next);
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* still shown for this session */
    }
    setSaved(true);
    setNote('');
  };

  return (
    <View style={{ gap: space.xl }}>
      <View style={{ paddingHorizontal: space.xxs, gap: space.xs }}>
        <Txt size={type.display} weight="display" accessibilityRole="header">
          {t('reportTitle')}
        </Txt>
        <Txt size={type.body} tone="muted">
          {t('reportLead')}
        </Txt>
      </View>

      {saved ? (
        <Surface>
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
        </Surface>
      ) : (
        <Surface>
          <Txt size={type.label} weight="bold" tone="muted" style={{ letterSpacing: 0.6 }}>
            {t('whatService').toUpperCase()}
          </Txt>
          <View style={{ flexDirection: 'row', gap: space.sm }} accessibilityRole="radiogroup">
            {(['electricity', 'water'] as const).map((s) => {
              const active = service === s;
              const Icon = s === 'electricity' ? Zap : Droplets;
              return (
                <Pressable
                  key={s}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  onPress={() => setService(s)}
                  style={({ pressed }) => ({
                    flex: 1,
                    minHeight: 84,
                    borderRadius: radius.tile,
                    padding: space.md,
                    gap: 8,
                    borderWidth: 2,
                    borderColor: active ? c.accent : c.line,
                    backgroundColor: active ? c.accentSoft : c.raised,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Icon size={22} color={active ? c.accent : c.ink} />
                  <Txt size={type.title} weight="semibold" tone={active ? 'accent' : 'ink'}>
                    {s === 'electricity' ? t('power') : t('water')}
                  </Txt>
                </Pressable>
              );
            })}
          </View>

          <Txt size={type.label} weight="bold" tone="muted" style={{ letterSpacing: 0.6, marginTop: space.xs }}>
            {t('where').toUpperCase()}
          </Txt>
          <Group style={{ backgroundColor: c.raised }}>
            <Row title={zone} onPress={() => open('zone')} value={<ChevronDown size={18} color={c.accent} />} accessibilityLabel={`${t('where')}: ${zone}. ${t('changeZone')}`} />
          </Group>

          <Txt size={type.label} weight="bold" tone="muted" style={{ letterSpacing: 0.6, marginTop: space.xs }}>
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
            style={{ minHeight: 84, borderRadius: radius.tile, backgroundColor: c.raised, padding: space.md, color: c.ink, fontFamily: font.medium, fontSize: type.body, textAlignVertical: 'top' }}
          />
          <Button label={t('submit')} variant="primary" onPress={submit} />
        </Surface>
      )}

      {mine.length > 0 ? (
        <Section title={t('myReports')}>
          <Group>
            {mine.slice(0, 5).map((r) => (
              <Row
                key={r.at}
                icon={r.service === 'electricity' ? <Zap size={18} color={c.muted} /> : <Droplets size={18} color={c.muted} />}
                title={r.corregimiento}
                subtitle={ago(r.at, now, lang)}
                value={<StatusChip kind="community" />}
              />
            ))}
          </Group>
        </Section>
      ) : null}
    </View>
  );
}
