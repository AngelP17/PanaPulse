import { getLocales } from 'expo-localization';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { useColorScheme } from 'react-native';
import { format, Lang, StringKey, strings } from '../i18n/strings';
import { palettes, Palette, ThemeName } from '../theme/tokens';
import { loadLive, loadSnapshot, SeismicData } from '../data/usgs';
import type { DemoScenario } from '../data/demo';
import type { AnonymousReport, ReportService } from '../data/neighborhood';
import { ChatTurn, Commute, defaultState, LocalReport, reduce, ThemePref } from '../data/localModel';
import { loadLocalState, saveLocalState } from './persist';

export type { ThemePref };
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
  /** The user's corregimiento. Home, Services, Reports and Ask all read it from here. */
  area: string;
  setArea: (area: string) => void;
  onboarded: boolean;
  completeOnboarding: () => void;
  /** Reports written on this device. Local only; never presented as public submissions. */
  reports: LocalReport[];
  addReport: (input: { service: ReportService; corregimiento: string; note: string }) => void;
  removeReport: (id: string) => void;
  commute: Commute;
  setCommute: (patch: Partial<Commute>) => void;
  chatHistory: ChatTurn[];
  setChatHistory: (turns: ChatTurn[]) => void;
  clearChatHistory: () => void;
  clearLocalActivity: () => void;
  /** Preview-scoped slices, kept for the preview screens. */
  demoReports: number;
  demoSubmittedReports: AnonymousReport[];
  demoCommuteSaved: boolean;
  setDemoCommuteSaved: (value: boolean) => void;
  hydrated: boolean;
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
function deviceLang(): Lang {
  try {
    return getLocales()[0]?.languageCode === 'en' ? 'en' : 'es';
  } catch {
    return 'es';
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const showcase = process.env.EXPO_PUBLIC_APP_MODE === 'showcase';
  const [local, dispatch] = useReducer(reduce, undefined, () => defaultState(deviceLang(), showcase));
  const [hydrated, setHydrated] = useState(false);
  const { lang, themePref, demoEnabled, demoScenario, area, onboarded, commute } = local;
  const [tab, setTab] = useState<Tab>('home');
  const [seismic, setSeismic] = useState<SeismicData>(() => loadSnapshot());
  const [now, setNow] = useState(() => Date.now());
  const [pendingQuestion, setPending] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadLocalState(deviceLang(), showcase).then((st) => {
      if (!alive) return;
      dispatch({ type: 'hydrate', state: st });
      setHydrated(true);
    });
    return () => { alive = false; };
  }, [showcase]);

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

  // Hydration guard: the initial defaults must never overwrite what is stored.
  useEffect(() => {
    if (hydrated) void saveLocalState(local);
  }, [hydrated, local]);

  const setLang = useCallback((l: Lang) => dispatch({ type: 'setLang', lang: l }), []);
  const setThemePref = useCallback((tp: ThemePref) => dispatch({ type: 'setTheme', themePref: tp }), []);
  const setDemoEnabled = useCallback((value: boolean) => dispatch({ type: 'setDemoEnabled', value }), []);
  const setDemoScenario = useCallback((scenario: DemoScenario) => dispatch({ type: 'setScenario', scenario }), []);
  const setArea = useCallback((a: string) => dispatch({ type: 'setArea', area: a }), []);
  const completeOnboarding = useCallback(() => dispatch({ type: 'completeOnboarding' }), []);
  const setCommute = useCallback((patch: Partial<Commute>) => dispatch({ type: 'setCommute', patch }), []);
  const setDemoCommuteSaved = useCallback((saved: boolean) => dispatch({ type: 'setCommute', patch: { saved } }), []);
  const setChatHistory = useCallback((turns: ChatTurn[]) => dispatch({ type: 'setChat', turns }), []);
  const clearChatHistory = useCallback(() => dispatch({ type: 'clearChat' }), []);
  const clearLocalActivity = useCallback(() => dispatch({ type: 'clearLocalActivity' }), []);
  const removeReport = useCallback((id: string) => dispatch({ type: 'removeReport', id }), []);
  const addReport = useCallback((input: { service: ReportService; corregimiento: string; note: string }) => {
    dispatch({ type: 'addReport', input, at: Date.now(), scope: demoEnabled ? 'preview' : 'device' });
  }, [demoEnabled]);

  // Preview feed: every report written on this device, labeled local by origin. Live mode never mixes preview text.
  const demoSubmittedReports = useMemo<AnonymousReport[]>(
    () => local.reports.map((r) => ({ id: r.id, service: r.service, corregimiento: r.corregimiento, note: r.note, at: r.at, origin: 'local' as const })),
    [local.reports],
  );
  const demoReports = demoSubmittedReports.length;
  const demoCommuteSaved = commute.saved;

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
      area,
      setArea,
      onboarded,
      completeOnboarding,
      reports: local.reports,
      addReport,
      removeReport,
      commute,
      setCommute,
      chatHistory: local.chat,
      setChatHistory,
      clearChatHistory,
      clearLocalActivity,
      demoReports,
      demoSubmittedReports,
      demoCommuteSaved,
      setDemoCommuteSaved,
      hydrated,
      theme,
      c: palettes[theme],
      t: (key, vars) => format(strings[lang][key], { area, ...vars }),
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
    [lang, setLang, themePref, setThemePref, demoEnabled, setDemoEnabled, demoScenario, setDemoScenario, area, setArea, onboarded, completeOnboarding, local.reports, addReport, removeReport, commute, setCommute, local.chat, setChatHistory, clearChatHistory, clearLocalActivity, demoReports, demoSubmittedReports, demoCommuteSaved, setDemoCommuteSaved, hydrated, theme, tab, seismic, now, pendingQuestion],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside AppProvider');
  return v;
}
