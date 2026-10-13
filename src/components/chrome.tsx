import { Activity, ArrowUp, Home, Megaphone, MessageCircle, Settings2, TrainFront } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MAX_INPUT } from '../chat/engine';
import { Tab, useApp } from '../state/AppContext';
import { font, radius, space, type } from '../theme/tokens';
import { PressScale } from './motion';
import { PulseMark } from './pulse';
import { Txt, styles as ui } from './ui';

export const BOTTOM_NAV_SPACE = 0; // the nav sits in the layout column, so content always ends above it

/** Top bar: PanaPulse mark, the assistant as a contextual action, settings. Part of the layout, not floating. */
export function Header() {
  const { c, t, tab, go } = useApp();
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.header, { paddingTop: insets.top + space.xs }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="PanaPulse" onPress={() => go('home')} style={[ui.row, { flex: 1, gap: space.xs }]}>
        <PulseMark />
        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
          <Txt size={type.title + 1} weight="bold">Pana</Txt>
          <Txt size={type.title + 1} weight="bold" style={{ color: c.accent }}>Pulse</Txt>
        </View>
      </Pressable>
      <PressScale
        accessibilityRole="button"
        accessibilityLabel={t('askButton')}
        onPress={() => go('chat')}
        style={[s.ask, { backgroundColor: tab === 'chat' ? c.navActive : c.nav }]}
      >
        <MessageCircle size={18} color={tab === 'chat' ? c.navActiveInk : c.accent} strokeWidth={2.2} />
        <Txt size={type.label} weight="bold" style={{ color: tab === 'chat' ? c.navActiveInk : c.ink }}>
          {t('askButton')}
        </Txt>
      </PressScale>
      <PressScale
        accessibilityRole="button"
        accessibilityLabel={t('settings')}
        onPress={() => go('settings')}
        style={[s.round, { backgroundColor: tab === 'settings' ? c.navActive : c.nav }]}
      >
        <Settings2 size={22} color={tab === 'settings' ? c.navActiveInk : c.ink} strokeWidth={2} />
      </PressScale>
    </View>
  );
}

/** Bottom navigation pill (PanaPulse's own arrangement: four destinations, icon over label). In the layout column, never over content. */
export function BottomNav() {
  const { c, t, tab, go } = useApp();
  const insets = useSafeAreaInsets();
  const items: { id: Tab; label: string; Icon: typeof Home }[] = [
    { id: 'home', label: t('navHome'), Icon: Home },
    { id: 'mobility', label: t('tabMobility'), Icon: TrainFront },
    { id: 'quakes', label: t('navQuakes'), Icon: Activity },
    { id: 'report', label: t('tabReports'), Icon: Megaphone },
  ];
  return (
    <View style={[s.navWrap, { paddingBottom: Math.max(insets.bottom, space.sm) }]}>
      <View style={[s.nav, { backgroundColor: c.nav }]} accessibilityRole="tablist">
        {items.map(({ id, label, Icon }) => {
          const active = tab === id || (id === 'home' && tab === 'services');
          return (
            <Pressable
              key={id}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: active }}
              onPress={() => go(id)}
              style={({ pressed }) => [s.tab, active && { backgroundColor: c.navActive }, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Icon size={20} color={active ? c.navActiveInk : c.muted} strokeWidth={active ? 2.4 : 2} />
              <Txt size={type.caption} weight={active ? 'bold' : 'semibold'} numberOfLines={1} style={{ color: active ? c.navActiveInk : c.muted }}>
                {label}
              </Txt>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/** Composer: only on the chat screen, docked above the nav so it never covers cards. */
export function Composer({ onSubmit, disabled }: { onSubmit: (text: string) => void; disabled?: boolean }) {
  const { c, t } = useApp();
  const [text, setText] = useState('');
  const send = () => {
    const q = text.trim();
    if (!q || disabled) return;
    onSubmit(q);
    setText('');
  };
  const ready = text.trim().length > 0 && !disabled;
  return (
    <View style={[s.composer, { backgroundColor: c.nav }]}>
      <TextInput
        nativeID="composer"
        value={text}
        onChangeText={(v) => setText(v.slice(0, MAX_INPUT))}
        onSubmitEditing={send}
        placeholder={t('composer')}
        placeholderTextColor={c.faint}
        returnKeyType="send"
        maxLength={MAX_INPUT}
        accessibilityLabel={t('composer')}
        style={[s.input, { color: c.ink, fontFamily: font.medium }]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('send')}
        onPress={send}
        disabled={!ready}
        style={({ pressed }) => [s.send, { backgroundColor: ready ? c.accent : c.tile, opacity: pressed ? 0.75 : 1 }]}
      >
        <ArrowUp size={20} color={ready ? c.accentInk : c.faint} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingHorizontal: space.md, paddingBottom: space.xs },
  ask: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 48, paddingHorizontal: 16, borderRadius: radius.pill },
  round: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  navWrap: { paddingHorizontal: space.md, paddingTop: space.xs },
  nav: { flexDirection: 'row', borderRadius: radius.pill, padding: 6, height: 72, alignItems: 'center' },
  tab: { flex: 1, height: 60, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', gap: 2 },
  composer: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.pill, paddingLeft: space.lg, paddingRight: 6, height: 60, marginTop: space.sm },
  input: { flex: 1, fontSize: type.body + 1, height: 56, outlineStyle: 'none' as any },
  send: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
});
