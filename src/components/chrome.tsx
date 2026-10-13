import { ArrowUp, Plus, Settings2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MAX_INPUT } from '../chat/engine';
import { Tab, useApp } from '../state/AppContext';
import { font, radius, space, type } from '../theme/tokens';
import { Txt } from './ui';

/** Hark-style floating header: round action, pill navigation, round settings. */
export function TopBar() {
  const { c, t, tab, go } = useApp();
  const insets = useSafeAreaInsets();
  const items: { id: Tab; label: string }[] = [
    { id: 'home', label: t('navHome') },
    { id: 'quakes', label: t('navQuakes') },
    { id: 'chat', label: t('navChat') },
  ];
  return (
    <View style={[s.top, { paddingTop: insets.top + space.xs }]} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('newReport')}
        onPress={() => go('report')}
        style={({ pressed }) => [s.round, { backgroundColor: tab === 'report' ? c.navActive : c.nav, opacity: pressed ? 0.75 : 1 }]}
      >
        <Plus size={24} color={tab === 'report' ? c.navActiveInk : c.ink} strokeWidth={2.2} />
      </Pressable>
      <View style={[s.pill, { backgroundColor: c.nav }]} accessibilityRole="tablist">
        {items.map((it) => {
          const active = tab === it.id;
          return (
            <Pressable
              key={it.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => go(it.id)}
              style={({ pressed }) => [s.seg, active && { backgroundColor: c.navActive }, { opacity: pressed ? 0.8 : 1 }]}
            >
              <Txt size={type.body} weight="semibold" style={{ color: active ? c.navActiveInk : c.muted }} numberOfLines={1}>
                {it.label}
              </Txt>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('settings')}
        onPress={() => go('settings')}
        style={({ pressed }) => [s.round, { backgroundColor: tab === 'settings' ? c.navActive : c.nav, opacity: pressed ? 0.75 : 1 }]}
      >
        <Settings2 size={22} color={tab === 'settings' ? c.navActiveInk : c.ink} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

/** Floating composer, like Hark's "Message Hark" bar. */
export function Composer({ onSubmit, disabled, autoFocus }: { onSubmit: (text: string) => void; disabled?: boolean; autoFocus?: boolean }) {
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
    <View style={[s.composerWrap, { paddingBottom: Math.max(insets.bottom, space.sm) + space.xs }]} pointerEvents="box-none">
      <View style={[s.composer, { backgroundColor: c.nav }]}>
        <TextInput
          nativeID="composer"
          value={text}
          onChangeText={(v) => setText(v.slice(0, MAX_INPUT))}
          onSubmitEditing={send}
          placeholder={t('composer')}
          placeholderTextColor={c.faint}
          returnKeyType="send"
          autoFocus={autoFocus}
          maxLength={MAX_INPUT}
          accessibilityLabel={t('composer')}
          style={[s.input, { color: c.ink, fontFamily: font.medium }]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('send')}
          onPress={send}
          disabled={!ready}
          style={({ pressed }) => [s.send, { backgroundColor: ready ? c.navActive : c.tile, opacity: pressed ? 0.75 : 1 }]}
        >
          <ArrowUp size={20} color={ready ? c.navActiveInk : c.faint} strokeWidth={2.4} />
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
  },
  round: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  pill: { flex: 1, flexDirection: 'row', borderRadius: radius.pill, padding: 5, height: 56, alignItems: 'center' },
  seg: { flex: 1, height: 46, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  composerWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.md, zIndex: 10 },
  composer: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.pill, paddingLeft: space.lg, paddingRight: 6, height: 60 },
  input: { flex: 1, fontSize: type.body + 1, height: 56, outlineStyle: 'none' as any },
  send: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
});
