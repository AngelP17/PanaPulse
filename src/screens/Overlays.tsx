import { Check, Sparkles, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ask, ChatError, detectTransport, MAX_INPUT, Transport, Turn } from '../chat/engine';
import { Composer } from '../components/chrome';
import { Group, Row, Section, Txt, styles } from '../components/ui';
import { CORREGIMIENTOS } from '../data/services';
import { Lang } from '../i18n/strings';
import { ThemePref, useApp } from '../state/AppContext';
import { radius, space, type } from '../theme/tokens';

/** Full-screen layer with its own top bar. Used for chat, settings and the zone picker. */
function Layer({ title, children, footer, scrollRef }: { title: string; children: React.ReactNode; footer?: React.ReactNode; scrollRef?: React.RefObject<ScrollView | null> }) {
  const { c, t, open } = useApp();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.sky[0] }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.row, { paddingTop: insets.top + space.xs, paddingHorizontal: space.md, paddingBottom: space.xs, borderBottomWidth: 1, borderBottomColor: c.line }]}>
        <Txt size={type.title + 2} weight="display" style={{ flex: 1 }} accessibilityRole="header">
          {title}
        </Txt>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('close')}
          onPress={() => open(null)}
          style={({ pressed }) => ({ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? c.raised : 'transparent' })}
        >
          <X size={24} color={c.ink} />
        </Pressable>
      </View>
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: space.md, paddingBottom: space.xxl, gap: space.lg, maxWidth: 560, width: '100%', alignSelf: 'center' }}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollRef?.current?.scrollToEnd({ animated: true })}
      >
        {children}
      </ScrollView>
      {footer ?? <View style={{ height: insets.bottom }} />}
    </KeyboardAvoidingView>
  );
}

export function ChatLayer() {
  const { c, t, lang, seismic, turns, setTurns, zone } = useApp();
  const [draft, setDraft] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transport, setTransport] = useState<Transport | null>(null);
  const ctl = useRef<AbortController | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    detectTransport().then(setTransport);
    return () => ctl.current?.abort();
  }, []);

  const submit = useCallback(
    async (q: string) => {
      if (busy) return;
      if (q.length > MAX_INPUT) return setError(t('chatTooLong', { n: MAX_INPUT }));
      setError(null);
      const history: Turn[] = [...turns, { role: 'user', content: q }];
      setTurns(history);
      setBusy(true);
      setDraft(null);
      ctl.current = new AbortController();
      try {
        const a = await ask(history, seismic, lang, { signal: ctl.current.signal, onText: setDraft, zone });
        setTurns([...history, { role: 'assistant', content: a.text, quick: a.quick }]);
      } catch (e) {
        const code = e instanceof ChatError ? e.code : 'failed';
        if (code !== 'cancelled') setError(code === 'unavailable' || code === 'not_granted' ? t('chatUnavailable') : t('chatError'));
      } finally {
        setDraft(null);
        setBusy(false);
      }
    },
    [busy, turns, setTurns, seismic, lang, t, zone],
  );

  return (
    <Layer title={t('chatTitle')} scrollRef={scrollRef} footer={<Composer onSubmit={submit} disabled={busy} />}>
      <Txt size={type.label} tone="muted">
        {t('chatIntro')} {t('chatScope')}.
      </Txt>
      {turns.length === 0 ? (
        <View style={{ gap: space.xs }}>
          {[t('chatSuggest1'), t('chatSuggest2'), t('chatSuggest3')].map((s) => (
            <Pressable
              key={s}
              accessibilityRole="button"
              onPress={() => submit(s)}
              disabled={busy}
              style={({ pressed }) => ({
                borderWidth: 1,
                borderColor: c.line,
                backgroundColor: pressed ? c.raised : c.surface,
                borderRadius: radius.tile,
                paddingHorizontal: space.md,
                minHeight: 50,
                justifyContent: 'center',
              })}
            >
              <Txt size={type.body} weight="semibold">
                {s}
              </Txt>
            </Pressable>
          ))}
        </View>
      ) : null}
      {turns.map((m, i) => (
        <Bubble key={i} turn={m} />
      ))}
      {busy ? <Bubble turn={{ role: 'assistant', content: draft || t('chatThinking') }} muted={!draft} /> : null}
      {error ? (
        <Txt size={type.label} tone="alert" weight="semibold">
          {error}
        </Txt>
      ) : null}
      {transport === 'none' ? (
        <Txt size={type.caption + 1} tone="faint">
          {t('chatUnavailable')}
        </Txt>
      ) : null}
    </Layer>
  );
}

function Bubble({ turn, muted }: { turn: Turn; muted?: boolean }) {
  const { c, t } = useApp();
  const mine = turn.role === 'user';
  return (
    <View style={{ alignSelf: mine ? 'flex-end' : 'stretch', maxWidth: mine ? '85%' : '100%', gap: 4 }}>
      <View
        style={{
          backgroundColor: mine ? c.accent : c.surface,
          borderRadius: radius.tile + 4,
          paddingHorizontal: space.md,
          paddingVertical: space.sm,
        }}
        accessibilityLiveRegion={mine ? undefined : 'polite'}
      >
        <Txt size={type.body} weight="medium" tone={muted ? 'muted' : 'ink'} style={mine ? { color: c.accentInk } : undefined} selectable>
          {turn.content}
        </Txt>
      </View>
      {turn.quick ? (
        <View style={[styles.row, { gap: 4, paddingHorizontal: 4 }]}>
          <Sparkles size={12} color={c.faint} />
          <Txt size={type.caption} tone="faint">
            {t('quickBadge')}
          </Txt>
        </View>
      ) : null}
    </View>
  );
}

function Choice<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  const { c } = useApp();
  return (
    <Group>
      {options.map((o) => (
        <Row
          key={o.id}
          title={o.label}
          onPress={() => onChange(o.id)}
          value={o.id === value ? <Check size={20} color={c.accent} strokeWidth={2.6} /> : undefined}
          accessibilityLabel={o.label}
        />
      ))}
    </Group>
  );
}

export function SettingsLayer() {
  const { t, lang, themePref, setPrefs } = useApp();
  return (
    <Layer title={t('settings')}>
      <Section title={t('language')}>
        <Choice<Lang>
          value={lang}
          onChange={(l) => setPrefs({ lang: l })}
          options={[
            { id: 'es', label: 'Español' },
            { id: 'en', label: 'English' },
          ]}
        />
      </Section>
      <Section title={t('appearance')}>
        <Choice<ThemePref>
          value={themePref}
          onChange={(tp) => setPrefs({ themePref: tp })}
          options={[
            { id: 'auto', label: t('themeAuto') },
            { id: 'light', label: t('themeLight') },
            { id: 'dark', label: t('themeDark') },
          ]}
        />
      </Section>
      <Section title={t('dataSources')}>
        <Txt size={type.body} tone="muted" style={{ paddingHorizontal: space.xxs }}>
          {t('dataSourcesBody')}
        </Txt>
        <Txt size={type.caption + 1} tone="faint" style={{ paddingHorizontal: space.xxs }}>
          {t('version')}
        </Txt>
      </Section>
    </Layer>
  );
}

export function ZoneLayer() {
  const { t, zone, setPrefs, open } = useApp();
  return (
    <Layer title={t('pickZone')}>
      <Choice<string>
        value={zone}
        onChange={(z) => {
          setPrefs({ zone: z });
          open(null);
        }}
        options={[...CORREGIMIENTOS].sort((a, b) => a.localeCompare(b, 'es')).map((z) => ({ id: z, label: z }))}
      />
    </Layer>
  );
}
