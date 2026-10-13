import { Activity, ArrowUp, Home, MessageCircle, Megaphone, Settings2, TrainFront } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MAX_INPUT } from '../chat/engine';
import { Tab, useApp } from '../state/AppContext';
import { font, radius, space, type } from '../theme/tokens';
import { PulseMark } from './pulse';
import { Txt, styles as ui } from './ui';

/** Solid app header: brand on the left, the assistant as a contextual action, settings. */
export function Header() {
  const { c, t, open } = useApp();
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.header, { paddingTop: insets.top + space.xs }]}>
      <View style={[ui.row, { flex: 1, gap: space.xs }]}>
        <PulseMark />
        <Txt size={type.title + 2} weight="display" accessibilityRole="header">
          PanaPulse
        </Txt>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('askButton')}
        onPress={() => open('chat')}
        style={({ pressed }) => [s.ask, { backgroundColor: c.accentSoft, opacity: pressed ? 0.7 : 1 }]}
      >
        <MessageCircle size={18} color={c.accent} strokeWidth={2.2} />
        <Txt size={type.label} weight="bold" tone="accent">
          {t('askButton')}
        </Txt>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('settings')}
        onPress={() => open('settings')}
        style={({ pressed }) => [s.icon, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Settings2 size={22} color={c.ink} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

/** Bottom navigation, Material 3 style: icon in an indicator pill, label below. */
export function TabBar() {
  const { c, t, tab, go } = useApp();
  const insets = useSafeAreaInsets();
  const items: { id: Tab; label: string; Icon: typeof Home }[] = [
    { id: 'home', label: t('tabHome'), Icon: Home },
    { id: 'mobility', label: t('tabMobility'), Icon: TrainFront },
    { id: 'quakes', label: t('tabQuakes'), Icon: Activity },
    { id: 'reports', label: t('tabReports'), Icon: Megaphone },
  ];
  return (
    <View
      accessibilityRole="tablist"
      style={[s.tabs, { backgroundColor: c.bar, borderTopColor: c.line, paddingBottom: Math.max(insets.bottom, space.xs) }]}
    >
      {items.map(({ id, label, Icon }) => {
        const active = tab === id;
        return (
          <Pressable
            key={id}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: active }}
            onPress={() => go(id)}
            style={({ pressed }) => [s.tab, { opacity: pressed ? 0.7 : 1 }]}
          >
            <View style={[s.indicator, active && { backgroundColor: c.accentSoft }]}>
              <Icon size={22} color={active ? c.accent : c.muted} strokeWidth={active ? 2.4 : 2} />
            </View>
            <Txt size={type.caption} weight={active ? 'bold' : 'semibold'} tone={active ? 'accent' : 'muted'} numberOfLines={1}>
              {label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Composer, used only inside the chat screen. */
export function Composer({ onSubmit, disabled }: { onSubmit: (text: string) => void; disabled?: boolean }) {
  const { c, t } = useApp();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const send = () => {
    const q = text.trim();
    if (!q || disabled) return;
    onSubmit(q);
    setText('');
  };
  const ready = text.trim().length > 0 && !disabled;
  return (
    <View style={[s.composerWrap, { backgroundColor: c.bar, borderTopColor: c.line, paddingBottom: Math.max(insets.bottom, space.sm) }]}>
      <View style={[s.composer, { backgroundColor: c.raised }]}>
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
          style={({ pressed }) => [s.send, { backgroundColor: ready ? c.accent : 'transparent', opacity: pressed ? 0.75 : 1 }]}
        >
          <ArrowUp size={20} color={ready ? c.accentInk : c.faint} strokeWidth={2.4} />
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingHorizontal: space.md, paddingBottom: space.xs },
  ask: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 14, borderRadius: radius.pill },
  icon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8 },
  tab: { flex: 1, alignItems: 'center', gap: 3, minHeight: 56 },
  indicator: { width: 60, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  composerWrap: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: space.md, paddingTop: space.sm },
  composer: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.tile, paddingLeft: space.md, paddingRight: 5, height: 54 },
  input: { flex: 1, fontSize: type.body, height: 50, outlineStyle: 'none' as any },
  send: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
