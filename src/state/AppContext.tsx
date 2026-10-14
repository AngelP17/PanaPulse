import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { format, Lang, StringKey, strings } from '../i18n/strings';
import { palettes, Palette, ThemeName } from '../theme/tokens';
import { loadLive, loadSnapshot, SeismicData } from '../data/usgs';
import type { DemoScenario } from '../data/demo';
import type { AnonymousReport, ReportService } from '../data/neighborhood';
import { safePreviewNote } from '../data/neighborhood';

export type ThemePref = 'auto' | 'light' | 'dark';
export type Tab = 'home' | 'services' | 'mobility' | 'quakes' | 'chat' | 'report' | 'settings';

interface AppState {
  lang: Lang;
  setLang: (l: Lang) => void;
  themePref: ThemePref;
  setThemePref: (t: ThemePref) => void;
  demoEnabled: boolean;
  setDemoEnabled: (b: boolean) => void;
  demoScenario: DemoScenario;
  setDemoScenario: (s: DemoScenario) => void;
  demoReports: number;
  demoSubmittedReports: AnonymousReport[];
  addDemoReport: (input: { service: ReportService; corregimiento: string; note: string }) => void;
  demoCommuteSaved: boolean;
  setDemoCommuteSaved: (value: boolean) => void;
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
type StoredPrefs = Partial<{ lang: Lang; themePref: ThemePref; demoEnabled: boolean; demoScenario: DemoScenario; demoCommuteSaved: boolean }>;
async function readPrefs(): Promise<StoredPrefs> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const value = raw ? JSON.parse(raw) : {};
    return value && typeof value === 'object' ? value : {};
  } catch { return {}; }
}
async function writePrefs(p: StoredPrefs) {
  try { await AsyncStorage.setItem(KEY, JSON.stringify(p)); }
  catch { /* Settings still work in this session. */ }
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
  const [demoEnabled, setDemoEnabled] = useState(process.env.EXPO_PUBLIC_APP_MODE === 'showcase');
  const [demoScenario, setDemoScenario] = useState<DemoScenario>('everyday');
  const [demoSubmittedReports, setDemoSubmittedReports] = useState<AnonymousReport[]>([]);
  const demoReports = demoSubmittedReports.length;
  const [demoCommuteSaved, setDemoCommuteSaved] = useState(true);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>('home');
  const [seismic, setSeismic] = useState<SeismicData>(() => loadSnapshot());
  const [now, setNow] = useState(() => Date.now());
  const [pendingQuestion, setPending] = useState<string | null>(null);

  useEffect(() => {
    readPrefs().then((p) => {
      if (p.lang === 'es' || p.lang === 'en') setLangState(p.lang);
      if (p.themePref === 'auto' || p.themePref === 'dark' || p.themePref === 'light') setThemePrefState(p.themePref);
      if (typeof p.demoEnabled === 'boolean') setDemoEnabled(p.demoEnabled);
      if (p.demoScenario === 'everyday' || p.demoScenario === 'disruption' || p.demoScenario === 'recovery') setDemoScenario(p.demoScenario);
      if (typeof p.demoCommuteSaved === 'boolean') setDemoCommuteSaved(p.demoCommuteSaved);
    }).finally(() => setPrefsLoaded(true));
  }, []);

  // Every build tries live USGS data; on failure (offline, or a sandbox that blocks outside requests)
  // the bundled snapshot stays, labeled with its real time and never presented as live.
  useEffect(() => {
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

  // Hydration guard prevents the initial defaults overwriting saved preferences.
  useEffect(() => {
    if (prefsLoaded) void writePrefs({ lang, themePref, demoEnabled, demoScenario, demoCommuteSaved });
  }, [prefsLoaded, lang, themePref, demoEnabled, demoScenario, demoCommuteSaved]);
  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const setThemePref = useCallback((tp: ThemePref) => setThemePrefState(tp), []);
  const addDemoReport = useCallback((input: { service: ReportService; corregimiento: string; note: string }) => {
    setDemoSubmittedReports((old) => [{
      id: `local-${Date.now()}-${old.length}`,
      service: input.service,
      // One corregimiento only: never save or display a precise map location.
      corregimiento: input.corregimiento,
      note: safePreviewNote(input.note),
      at: Date.now(),
      origin: 'local' as const,
    }, ...old].slice(0, 20));
  }, []);

  const theme: ThemeName = themePref === 'auto' ? (system === 'light' ? 'light' : 'dark') : themePref;

  const value = useMemo<AppState>(
    () => ({
      lang,
      setLang,
      themePref,
      setThemePref,
      demoEnabled,
      setDemoEnabled,
      demoScenario,
      setDemoScenario,
      demoReports,
      demoSubmittedReports,
      addDemoReport,
      demoCommuteSaved,
      setDemoCommuteSaved,
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
    [lang, setLang, themePref, setThemePref, demoEnabled, demoScenario, demoReports, demoSubmittedReports, addDemoReport, demoCommuteSaved, theme, tab, seismic, now, pendingQuestion],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside AppProvider');
  return v;
}
