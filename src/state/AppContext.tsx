import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';
import type { Turn } from '../chat/engine';
import { loadLive, loadSnapshot, SeismicData } from '../data/usgs';
import { format, Lang, StringKey, strings } from '../i18n/strings';
import { palettes, Palette, ThemeName } from '../theme/tokens';

export type ThemePref = 'auto' | 'light' | 'dark';
export type Tab = 'home' | 'mobility' | 'quakes' | 'reports';
export type Overlay = 'chat' | 'settings' | 'zone' | null;

interface Prefs {
  lang: Lang;
  themePref: ThemePref;
  zone: string;
}

interface AppState extends Prefs {
  setPrefs: (p: Partial<Prefs>) => void;
  theme: ThemeName;
  c: Palette;
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
  tab: Tab;
  go: (tab: Tab) => void;
  overlay: Overlay;
  open: (o: Overlay) => void;
  seismic: SeismicData;
  now: number;
  turns: Turn[];
  setTurns: React.Dispatch<React.SetStateAction<Turn[]>>;
}

const Ctx = createContext<AppState | null>(null);
const KEY = 'panapulse.prefs.v2';

// Storage can be unavailable (private windows, sandboxed previews). Never let it break render.
async function readPrefs(): Promise<Partial<Prefs>> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
async function writePrefs(p: Prefs) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* per-device convenience only */
  }
}

function deviceLang(): Lang {
  try {
    return getLocales()[0]?.languageCode === 'en' ? 'en' : 'es';
  } catch {
    return 'es';
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [prefs, setPrefsState] = useState<Prefs>({ lang: deviceLang(), themePref: 'auto', zone: 'Pueblo Nuevo' });
  const [tab, setTab] = useState<Tab>('home');
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [seismic, setSeismic] = useState<SeismicData>(() => loadSnapshot());
  const [now, setNow] = useState(() => Date.now());
  const [turns, setTurns] = useState<Turn[]>([]);

  useEffect(() => {
    readPrefs().then((p) => setPrefsState((cur) => ({ ...cur, ...p })));
  }, []);

  // Native builds fetch live USGS data; on failure the snapshot stays, labeled with its real time.
  // Web (incl. the artifact sandbox, which blocks outside requests) stays on the snapshot.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let alive = true;
    const refresh = () =>
      loadLive()
        .then((d) => alive && setSeismic(d))
        .catch(() => {});
    refresh();
    const id = setInterval(refresh, 5 * 60 * 1000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const setPrefs = useCallback((p: Partial<Prefs>) => {
    setPrefsState((cur) => {
      const next = { ...cur, ...p };
      writePrefs(next);
      return next;
    });
  }, []);

  const theme: ThemeName =
    prefs.themePref === 'auto' ? (system === 'light' ? 'light' : 'dark') : prefs.themePref;

  const value = useMemo<AppState>(
    () => ({
      ...prefs,
      setPrefs,
      theme,
      c: palettes[theme],
      t: (key, vars) => format(strings[prefs.lang][key], vars),
      tab,
      go: (next) => {
        setOverlay(null);
        setTab(next);
      },
      overlay,
      open: setOverlay,
      seismic,
      now,
      turns,
      setTurns,
    }),
    [prefs, setPrefs, theme, tab, overlay, seismic, now, turns],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside AppProvider');
  return v;
}
