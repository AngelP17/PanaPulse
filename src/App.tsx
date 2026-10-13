import {
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
} from '@expo-google-fonts/bricolage-grotesque';
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, useFonts } from '@expo-google-fonts/manrope';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Header, TabBar } from './components/chrome';
import { Scene } from './components/ui';
import { Home } from './screens/Home';
import { Mobility } from './screens/Mobility';
import { ChatLayer, SettingsLayer, ZoneLayer } from './screens/Overlays';
import { QuakeSheet, Quakes } from './screens/Quakes';
import { Report } from './screens/Report';
import { AppProvider, useApp } from './state/AppContext';
import { space } from './theme/tokens';

function Shell() {
  const { tab, go, theme, overlay, open } = useApp();
  const [quakeId, setQuakeId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Android back: sheet, then overlay, then back to Inicio.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (quakeId) return setQuakeId(null), true;
      if (overlay) return open(null), true;
      if (tab !== 'home') return go('home'), true;
      return false;
    });
    return () => sub.remove();
  }, [quakeId, overlay, tab, go, open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [tab]);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Scene>
        {/* Header, content and tab bar stack in a column: nothing floats over content. */}
        <View style={{ flex: 1 }}>
          <Header />
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: space.md, paddingBottom: space.xxl, maxWidth: 560, width: '100%', alignSelf: 'center' }}
            keyboardShouldPersistTaps="handled"
          >
            {tab === 'home' && <Home />}
            {tab === 'mobility' && <Mobility />}
            {tab === 'quakes' && <Quakes onOpenQuake={setQuakeId} />}
            {tab === 'reports' && <Report />}
          </ScrollView>
          <TabBar />
        </View>
      </Scene>
      {overlay ? (
        <View style={StyleSheet.absoluteFill}>
          {overlay === 'chat' && <ChatLayer />}
          {overlay === 'settings' && <SettingsLayer />}
          {overlay === 'zone' && <ZoneLayer />}
        </View>
      ) : null}
      <QuakeSheet id={quakeId} onClose={() => setQuakeId(null)} />
    </View>
  );
}

export default function App() {
  const [loaded] = useFonts({
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Shell />
      </AppProvider>
    </SafeAreaProvider>
  );
}
