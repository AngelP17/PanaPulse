import React, { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, View } from 'react-native';
import { Button, Card, Txt } from '../components/ui';
import { useApp } from '../state/AppContext';
import { CORREGIMIENTOS } from '../data/services';
import { communitySummary, myObservations, newSubmission, loadPending, Receipt, Submission,
  submitObservation, Summary, withdrawObservation } from '../data/community';
import { dayStamp } from '../data/format';
import { radius, space, type } from '../theme/tokens';

/** Connected beta sends structured observations only. Existing local notes are never uploaded. */
export function ConnectedReports() {
  const { t, c, area, lang, now } = useApp();
  const [where, setWhere] = useState(area);
  const [service, setService] = useState<Submission['service']>('electricity');
  const [observation, setObservation] = useState<Submission['observation']>('interruption');
  const [items, setItems] = useState<Receipt[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [pending, setPending] = useState<Submission | null>(null);
  const mutation = useRef(false);
  const [withdrawn, setWithdrawn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);
  const refresh = async () => {
    try {
      const [mine, group] = await Promise.all([myObservations(), communitySummary(area)]);
      setItems(mine); setSummary(group); setError(false);
    } catch { setError(true); setSummary(null); }
  };
  useEffect(() => {
    let alive = true;
    loadPending().then(body => {
      if (alive) setPending(body);
      if (alive) setReady(true);
    }).catch(() => { if (alive) setError(true); });
    void refresh();
    const timer = setInterval(refresh, 60000);
    const resume = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => { alive = false; clearInterval(timer); resume.remove(); };
  }, [area]);
  const send = async () => {
    if (mutation.current || !ready) return;
    mutation.current = true;
    setBusy(true); setSaved(false); setWithdrawn(false); setError(false);
    const body = pending ?? newSubmission({ area: where, service, observation });
    setPending(body);
    try {
      const receipt = await submitObservation(body);
      setPending(null); setSaved(true);
      setItems(old => [receipt, ...old.filter(r => r.id !== receipt.id)]);
      await refresh();
    } catch (failure) {
      if (failure instanceof Error && failure.message === 'HTTP_410') { setPending(null); setWithdrawn(true); }
      else setError(true);
    }
    finally { mutation.current = false; setBusy(false); }
  };
  const withdraw = async (id: string) => {
    if (mutation.current) return;
    mutation.current = true;
    setBusy(true); setError(false); setSaved(false); setWithdrawn(false);
    try { await withdrawObservation(id); setItems(old => old.filter(r => r.id !== id)); await refresh(); }
    catch { setError(true); }
    finally { mutation.current = false; setBusy(false); }
  };
  const chip = (label: string, selected: boolean, action: () => void) => (
    <Pressable key={label} accessibilityRole="radio" accessibilityLabel={label}
      accessibilityState={{ selected, disabled: busy || !!pending }} disabled={busy || !!pending} onPress={action}
      style={{ minHeight: 48, justifyContent: 'center', borderRadius: radius.pill, paddingHorizontal: space.md,
        backgroundColor: selected ? c.navActive : c.tile }}>
      <Txt size={type.label} weight="semibold" style={{ color: selected ? c.navActiveInk : c.ink }}>{label}</Txt>
    </Pressable>
  );
  return <View style={{ gap: space.md }}>
    <Txt size={type.hero - 10} weight="bold" accessibilityRole="header">{t('reportTitle')}</Txt>
    <Txt tone="muted">{t('sharedLead')}</Txt>
    {error ? <Card><Txt accessibilityRole="alert">{t('sharedError')}</Txt>
      <Button label={t('connectedRefresh')} disabled={busy} onPress={() => { void refresh(); }} /></Card> : null}
    {withdrawn ? <Card><Txt accessibilityRole="alert">{t('sharedAlreadyWithdrawn')}</Txt></Card> : null}
    {saved ? <Card><Txt accessibilityRole="alert">{t('sharedSaved')}</Txt></Card> : null}
    <Card>
      <Txt size={type.title} weight="semibold" accessibilityRole="header">{t('sharedSummary', { area })}</Txt>
      {summary?.area === area ? <>
        {summary.groups.map(g => <Txt key={`${g.service}-${g.observation}`} size={type.label}>
          {t(g.service === 'electricity' ? 'power' : 'water')} · {t(g.observation === 'interruption' ? 'sharedInterrupted' : 'sharedRestored')}: {t(g.state === 'none' ? 'sharedNone' : g.state === 'insufficient_reports' ? 'sharedFew' : 'sharedCount', { n: g.count ?? 0 })}
        </Txt>)}
        <Txt size={type.caption} tone="muted">{dayStamp(Date.parse(summary.as_of), lang)} · {t('reportNotOfficial')}</Txt>
      </> : <Txt tone="muted">{t('sharedUnavailable')}</Txt>}
    </Card>
    <Card>
      <Txt size={type.title} weight="semibold" accessibilityRole="header">{t('reportTabNew')}</Txt>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
        {chip(t('power'), service === 'electricity', () => setService('electricity'))}
        {chip(t('water'), service === 'water', () => setService('water'))}
      </View>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs }}>
        {chip(t('sharedInterrupted'), observation === 'interruption', () => setObservation('interruption'))}
        {chip(t('sharedRestored'), observation === 'restored', () => setObservation('restored'))}
      </View>
      <Txt size={type.label}>{t('where')} · {where}</Txt>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.xs }}>
        {CORREGIMIENTOS.map(name => chip(name, name === where, () => setWhere(name)))}
      </ScrollView>
      <Txt size={type.caption + 1} tone="muted">{t('sharedPrivacy')}</Txt>
      {pending ? <Txt accessibilityRole="alert">{t('sharedPending', { area: pending.area })}</Txt> : null}
      <Button label={t(busy ? 'sharedSending' : pending ? 'sharedRetry' : 'sharedSubmit')}
        disabled={busy || !ready} variant="solid" onPress={() => { void send(); }} />
    </Card>
    <Card>
      <Txt size={type.title} weight="semibold" accessibilityRole="header">{t('sharedMine')}</Txt>
      {!items.length ? <Txt tone="muted">{t('sharedNoMine')}</Txt> : items.map(r => <View key={r.id} style={{ gap: space.xs, paddingVertical: space.sm }}>
        <Txt weight="semibold">{t(r.service === 'electricity' ? 'power' : 'water')} · {r.area}</Txt>
        <Txt>{t(r.observation === 'interruption' ? 'sharedInterrupted' : 'sharedRestored')} · {dayStamp(Date.parse(r.created_at), lang)}</Txt>
        <Txt size={type.caption} tone="muted">{t(r.status === 'active' && Date.parse(r.expires_at) > now ? 'sharedActive' : 'sharedInactive')}</Txt>
        <Button label={t('sharedWithdraw')} disabled={busy} onPress={() => { void withdraw(r.id); }} />
      </View>)}
    </Card>
  </View>;
}
