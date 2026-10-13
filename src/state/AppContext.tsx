import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { format, Lang, StringKey, strings } from '../i18n/strings';
import { palettes, Palette, ThemeName } from '../theme/tokens';
import { loadLive, loadSnapshot, SeismicData } from '../data/usgs';

export type ThemePref = 'auto' | 'light' | 'dark';
export type Tab = 'home' | 'mobility' | 'quakes' | 'chat' | 'report' | 'settings';

interface AppState {
  lang: Lang;
  setLang: (l: Lang) => void;
  themePref: ThemePref;
  setThemePref: (t: ThemePref) => void;
  theme: ThemeName;
  c: Palette;
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
  tab: Tab;
  go: (tab: Tab) => void;
  seismic: SeismicData;
  now: number;
  pendingQuestion: string | null;
  askFromHome: (q: string) => void;
  takePendingQuestion: () => string | null;
}

const Ctx = createContext<AppState | null>(null);
const KEY = 'panapulse.prefs.v1';

// Storage can be unavailable (private windows, sandboxed previews). Never let it break render.
async function readPrefs(): Promise<Partial<{ lang: Lang; themePref: ThemePref }>> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
async function writePrefs(p: { lang: Lang; themePref: ThemePref }) {
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
  const [lang, setLangState] = useState<Lang>(deviceLang());
  const [themePref, setThemePrefState] = useState<ThemePref>('auto');
  const [tab, setTab] = useState<Tab>('home');
  const [seismic, setSeismic] = useState<SeismicData>(() => loadSnapshot());
  const [now, setNow] = useState(() => Date.now());
  const [pendingQuestion, setPending] = useState<string | null>(null);

  useEffect(() => {
    readPrefs().then((p) => {
      if (p.lang) setLangState(p.lang);
      if (p.themePref) setThemePrefState(p.themePref);
    });
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

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    setThemePrefState((tp) => {
      writePrefs({ lang: l, themePref: tp });
      return tp;
    });
  }, []);
  const setThemePref = useCallback((tp: ThemePref) => {
    setThemePrefState(tp);
    setLangState((l) => {
      writePrefs({ lang: l, themePref: tp });
      return l;
    });
  }, []);

  const theme: ThemeName = themePref === 'auto' ? (system === 'light' ? 'light' : 'dark') : themePref;

  const value = useMemo<AppState>(
    () => ({
      lang,
      setLang,
      themePref,
      setThemePref,
      theme,
      c: palettes[theme],
      t: (key, vars) => format(strings[lang][key], vars),
      tab,
      go: setTab,
      seismic,
      now,
      pendingQuestion,
      askFromHome: (q) => {
        setPending(q);
        setTab('chat');
      },
      takePendingQuestion: () => {
        const q = pendingQuestion;
        if (q) setPending(null);
        return q;
      },
    }),
    [lang, setLang, themePref, setThemePref, theme, tab, seismic, now, pendingQuestion],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside AppProvider');
  return v;
}
