import { ShieldCheck } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { ask, ChatError, detectTransport, MAX_INPUT, MODEL, Transport, Turn } from '../chat/engine';
import { useApp } from '../state/AppContext';
import { radius, space, type } from '../theme/tokens';
import { Txt, styles } from '../components/ui';

export interface ChatHandle {
  submit: (q: string) => void;
}

export const Chat = React.forwardRef<ChatHandle, { onBusy: (b: boolean) => void }>(function Chat({ onBusy }, ref) {
  const { c, t, lang, seismic, pendingQuestion, takePendingQuestion } = useApp();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState<string | null>(null); // streaming answer
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transport, setTransport] = useState<Transport | null>(null);
  const ctl = useRef<AbortController | null>(null);

  useEffect(() => {
    detectTransport().then(setTransport);
    return () => ctl.current?.abort();
  }, []);

  useEffect(() => onBusy(busy), [busy, onBusy]);

  const submit = useCallback(
    async (q: string) => {
      if (busy) return;
      if (q.length > MAX_INPUT) {
        setError(t('chatTooLong', { n: MAX_INPUT }));
        return;
      }
      setError(null);
      const history: Turn[] = [...turns, { role: 'user', content: q }];
      setTurns(history);
      setBusy(true);
      setDraft(null);
      ctl.current = new AbortController();
      try {
        const answer = await ask(history, seismic, lang, { signal: ctl.current.signal, onText: setDraft });
        setTurns([...history, { role: 'assistant', content: answer }]);
      } catch (e) {
        const code = e instanceof ChatError ? e.code : 'failed';
        if (code === 'cancelled') return;
        setError(code === 'unavailable' || code === 'not_granted' ? t('chatUnavailable') : t('chatError'));
        setTurns(history.slice(0, -1).concat({ role: 'user', content: q }));
      } finally {
        setDraft(null);
        setBusy(false);
      }
    },
    [busy, turns, seismic, lang, t],
  );

  React.useImperativeHandle(ref, () => ({ submit }), [submit]);

  // A question asked from the Home composer or a suggestion card.
  useEffect(() => {
    if (!pendingQuestion) return;
    const q = takePendingQuestion();
    if (q) submit(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQuestion]);

  const suggestions = [t('chatSuggest1'), t('chatSuggest2'), t('chatSuggest3')];

  return (
    <View style={{ gap: space.md }}>
      <View style={[styles.row, { paddingHorizontal: space.xs }]}>
        <ShieldCheck size={16} color={c.muted} />
        <Txt size={type.caption + 1} tone="muted">
          {t('chatScope', { model: transport === 'server' ? 'Haiku 5.5' : transport === 'artifact' ? 'Haiku 5.5 / Claude' : MODEL })}
        </Txt>
      </View>

      <Bubble role="assistant" text={t('chatIntro')} />

      {turns.length === 0 ? (
        <View style={{ gap: space.xs }}>
          {suggestions.map((s) => (
            <Pressable
              key={s}
              accessibilityRole="button"
              onPress={() => submit(s)}
              disabled={busy || transport === 'none'}
              style={({ pressed }) => [
                { alignSelf: 'flex-end', backgroundColor: c.nav, borderRadius: radius.pill, paddingHorizontal: space.lg, paddingVertical: space.sm, minHeight: 48, justifyContent: 'center', opacity: pressed ? 0.75 : transport === 'none' ? 0.5 : 1 },
              ]}
            >
              <Txt size={type.body} weight="medium">
                {s}
              </Txt>
            </Pressable>
          ))}
        </View>
      ) : null}

      {turns.map((m, i) => (
        <Bubble key={i} role={m.role} text={m.content} />
      ))}
      {busy ? <Bubble role="assistant" text={draft || t('chatThinking')} muted={!draft} /> : null}
      {error ? (
        <View style={{ backgroundColor: c.card, borderRadius: radius.tile, padding: space.md, borderWidth: 1.5, borderColor: c.alert }}>
          <Txt size={type.label} tone="alert" weight="semibold">
            {error}
          </Txt>
        </View>
      ) : null}
      {transport === 'none' && !error ? (
        <Txt size={type.label} tone="muted" style={{ paddingHorizontal: space.xs }}>
          {t('chatUnavailable')}
        </Txt>
      ) : null}
    </View>
  );
});

function Bubble({ role, text, muted }: { role: 'user' | 'assistant'; text: string; muted?: boolean }) {
  const { c } = useApp();
  const mine = role === 'user';
  return (
    <View
      style={{
        alignSelf: mine ? 'flex-end' : 'flex-start',
        maxWidth: '86%',
        backgroundColor: mine ? c.bubbleUser : c.card,
        borderRadius: 26,
        borderBottomRightRadius: mine ? 8 : 26,
        borderBottomLeftRadius: mine ? 26 : 8,
        paddingHorizontal: space.lg,
        paddingVertical: space.md,
      }}
      accessibilityLiveRegion={mine ? undefined : 'polite'}
    >
      <Txt size={type.body + 1} weight="medium" tone={muted ? 'muted' : 'ink'} style={mine ? { color: c.bubbleUserInk } : undefined} selectable>
        {text}
      </Txt>
    </View>
  );
}
