import { ShieldCheck } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { ask, ChatError, detectTransport, MAX_INPUT, Transport } from '../chat/engine';
import { useApp } from '../state/AppContext';
import { makeDemoScene } from '../data/demo';
import type { ChatTurn } from '../data/localModel';
import { dayStamp } from '../data/format';
import { powerFeedState, usePowerMaintenance } from '../data/maintenance';
import { radius, space, type } from '../theme/tokens';
import { PressScale } from '../components/motion';
import { Txt, styles } from '../components/ui';

export interface ChatHandle {
  submit: (q: string) => void;
}

export const Chat = React.forwardRef<ChatHandle, { onBusy: (b: boolean) => void }>(function Chat({ onBusy }, ref) {
  const { c, t, lang, seismic, pendingQuestion, takePendingQuestion, demoEnabled, demoScenario, demoReports, now, area, chatHistory, setChatHistory, clearChatHistory } = useApp();
  const { data: maintenance, state: maintenanceState } = usePowerMaintenance(area);
  // The conversation lives in the shared local store, so it survives navigation and restarts.
  const turns: ChatTurn[] = chatHistory;
  const setTurns = setChatHistory;
  const [draft, setDraft] = useState<string | null>(null); // streaming answer
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transport, setTransport] = useState<Transport | null>(null);
  const ctl = useRef<AbortController | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    detectTransport().then(setTransport);
    return () => ctl.current?.abort();
  }, []);

  useEffect(() => onBusy(busy), [busy, onBusy]);

  const submit = useCallback(
    async (q: string) => {
      if (inFlight.current || !q.trim()) return;
      if (q.length > MAX_INPUT) {
        setError(t('chatTooLong', { n: MAX_INPUT }));
        return;
      }
      setError(null);
      inFlight.current = true;
      const context = demoEnabled ? 'preview' as const : 'real' as const;
      const when = Date.now();
      const meta = { at: when, context, scenario: demoEnabled ? demoScenario : undefined };
      const history: ChatTurn[] = [...turns, { role: 'user', content: q, ...meta }];
      setTurns(history);
      setBusy(true);
      setDraft(null);
      ctl.current = new AbortController();
      try {
        const preview = demoEnabled ? makeDemoScene(now, demoScenario) : null;
        if (preview) preview.communityReports += demoReports;
        const answer = await ask(history, seismic, lang, {
          signal: ctl.current.signal, onText: setDraft, zone: area, preview,
          powerFeed: { data: maintenance, state: powerFeedState(maintenance, maintenanceState) },
        });
        if (ctl.current.signal.aborted) return;
        setTurns([...history, { role: 'assistant', content: answer.text, quick: answer.quick, ...meta }]);
      } catch (e) {
        const code = e instanceof ChatError ? e.code : 'failed';
        if (code === 'cancelled') return;
        setError(code === 'unavailable' || code === 'not_granted' ? t('chatUnavailable')
          : code === 'rate_limited' ? t('chatRateLimited') : t('chatError'));
        setTurns(history);
      } finally {
        inFlight.current = false;
        setDraft(null);
        setBusy(false);
      }
    },
    [busy, turns, setTurns, seismic, lang, t, demoEnabled, demoScenario, demoReports, now, maintenance, maintenanceState, area],
  );

  React.useImperativeHandle(ref, () => ({ submit }), [submit]);

  // A question asked from the Home composer or a suggestion card.
  useEffect(() => {
    if (!pendingQuestion) return;
    const q = takePendingQuestion();
    if (q) submit(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQuestion]);

  const suggestions = demoEnabled
    ? [t('chatSuggest2'), t('chatSuggest3'), t('chatSuggestReports')]
    : [t('chatSuggest1'), t('chatSuggest2'), t('chatSuggest3')];

  return (
    <View style={{ gap: space.md }}>
      <View style={[styles.row, { paddingHorizontal: space.xs }]}>
        <ShieldCheck size={16} color={c.muted} />
        <Txt size={type.caption + 1} tone="muted">
          {demoEnabled ? t('previewChatScope')
            : transport === 'server' ? t('chatScope', { model: t('chatBackendModel') })
            : transport === 'artifact' ? t('chatScope', { model: 'Haiku 5.5 / Claude' })
            : t('chatScopeDevice')}
        </Txt>
      </View>

      <Bubble role="assistant" intro text={t(demoEnabled ? 'previewChatIntro' : 'chatIntro')} />

      {turns.length === 0 ? (
        <View style={{ gap: space.xs }}>
          {suggestions.map((s) => (
            <PressScale
              key={s}
              accessibilityRole="button"
              onPress={() => submit(s)}
              disabled={busy}
              style={{ alignSelf: 'flex-end', backgroundColor: c.nav, borderRadius: radius.pill, paddingHorizontal: space.lg, paddingVertical: space.sm, minHeight: 48, justifyContent: 'center' }}
            >
              <Txt size={type.body} weight="medium">
                {s}
              </Txt>
            </PressScale>
          ))}
        </View>
      ) : null}

      {turns.map((m, i) => (
        <Bubble key={i} role={m.role} text={m.content}
          at={m.at} context={m.context} scenario={m.scenario} />
      ))}
      {busy ? <Bubble role="assistant" text={draft || t('chatThinking')} muted={!draft} /> : null}
      {turns.length > 0 && !busy ? (
        <Pressable accessibilityRole="button" accessibilityLabel={t('chatClear')} onPress={clearChatHistory} hitSlop={8}
          style={{ alignSelf: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: space.md }}>
          <Txt size={type.label} weight="semibold" style={{ color: c.accent }}>{t('chatClear')}</Txt>
        </Pressable>
      ) : null}
      {error ? (
        <View style={{ backgroundColor: c.card, borderRadius: radius.tile, padding: space.md, borderWidth: 1.5, borderColor: c.alert }}>
          <Txt size={type.label} tone="alert" weight="semibold">
            {error}
          </Txt>
        </View>
      ) : null}
      {transport === 'none' && !demoEnabled && !error ? (
        <Txt size={type.label} tone="muted" style={{ paddingHorizontal: space.xs }}>
          {t('chatOnDeviceNote')}
        </Txt>
      ) : null}
    </View>
  );
});

function Bubble({ role, text, muted, intro, at, context, scenario }: {
  role: 'user' | 'assistant'; text: string; muted?: boolean;
  /** The static greeting: not a stored answer, so it carries no "saved earlier" note. */
  intro?: boolean;
  at?: number; context?: 'preview' | 'real'; scenario?: 'everyday' | 'disruption' | 'recovery';
}) {
  const { c, t, lang } = useApp();
  const when = at ? dayStamp(at, lang) : undefined;
  const scenarioLabel = scenario === 'disruption' ? t('demoDisruption')
    : scenario === 'recovery' ? t('demoRecovery') : t('demoEveryday');
  const meta = !when ? t('chatHistoryUnverified')
    : context === 'preview' ? t('chatHistoryPreview', { scenario: scenarioLabel, when })
    : t('chatHistoryReal', { when });
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
      {role === 'assistant' && !muted && !intro && at !== undefined ? (
        <Txt size={type.caption} tone="muted" style={{ marginTop: space.xs }}>{meta}</Txt>
      ) : null}
      {role === 'assistant' && !muted && !intro && at === undefined ? (
        <Txt size={type.caption} tone="muted" style={{ marginTop: space.xs }}>{t('chatHistoryUnverified')}</Txt>
      ) : null}
    </View>
  );
}
