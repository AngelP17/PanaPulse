import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, useFonts } from '@expo-google-fonts/manrope';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Composer, TopBar } from './components/chrome';
import { Scene } from './components/ui';
import { Chat, ChatHandle } from './screens/Chat';
import { Home } from './screens/Home';
import { QuakeSheet, Quakes } from './screens/Quakes';
import { Report } from './screens/Report';
import { Settings } from './screens/Settings';
import { AppProvider, useApp } from './state/AppContext';
import { space } from './theme/tokens';

function Shell() {
  const { tab, go, theme, askFromHome } = useApp();
  const insets = useSafeAreaInsets();
  const [quakeId, setQuakeId] = useState<string | null>(null);
  const [chatBusy, setChatBusy] = useState(false);
  const chatRef = useRef<ChatHandle>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Android back: close the sheet, then return to Home.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (quakeId) {
        setQuakeId(null);
        return true;
      }
      if (tab !== 'home') {
        go('home');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [quakeId, tab, go]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [tab]);

  const onAsk = useCallback(
    (q: string) => {
      if (tab === 'chat') chatRef.current?.submit(q);
      else askFromHome(q);
    },
    [tab, askFromHome],
  );

  const showComposer = tab === 'home' || tab === 'chat' || tab === 'quakes';

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Scene>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            ref={scrollRef}
            onContentSizeChange={() => tab === 'chat' && scrollRef.current?.scrollToEnd({ animated: true })}
            contentContainerStyle={{
              paddingTop: insets.top + 84,
              paddingBottom: insets.bottom + 110,
              paddingHorizontal: space.md,
              maxWidth: 560,
              width: '100%',
              alignSelf: 'center',
            }}
            keyboardShouldPersistTaps="handled"
          >
            {tab === 'home' && <Home onOpenQuake={setQuakeId} />}
            {tab === 'quakes' && <Quakes onOpenQuake={setQuakeId} />}
            <View style={{ display: tab === 'chat' ? 'flex' : 'none' }}>
              <Chat ref={chatRef} onBusy={setChatBusy} />
            </View>
            {tab === 'report' && <Report />}
            {tab === 'settings' && <Settings />}
          </ScrollView>
          <TopBar />
          {showComposer ? <Composer onSubmit={onAsk} disabled={chatBusy} /> : null}
        </KeyboardAvoidingView>
      </Scene>
      <QuakeSheet id={quakeId} onClose={() => setQuakeId(null)} />
    </View>
  );
}

export default function App() {
  const [loaded] = useFonts({ Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold });
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Shell />
      </AppProvider>
    </SafeAreaProvider>
  );
}
