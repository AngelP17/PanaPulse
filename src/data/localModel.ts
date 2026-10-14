// The one typed local data model behind every screen. Pure functions only (no React, no storage),
// so each rule is testable and the same shapes can later be fed by a server without rebuilding screens.
import { CORREGIMIENTOS } from './services';
import type { Lang } from '../i18n/strings';
import type { DemoScenario, TransitId } from './demo';
import { safePreviewNote } from './neighborhood';
import type { ReportService } from './neighborhood';

export type ThemePref = 'auto' | 'light' | 'dark';

export const STATE_VERSION = 2;
export const DEFAULT_AREA = 'Pueblo Nuevo';
export const MAX_REPORTS = 50;
export const MAX_CHAT_TURNS = 30;

/** A report the user wrote on this device. Never uploaded; `scope` keeps preview-written text out of live mode. */
export interface LocalReport {
  id: string;
  service: ReportService;
  corregimiento: string;
  note: string;
  at: number;
  origin: 'local';
  scope: 'preview' | 'device';
}

/** Historical reply metadata, saved so an old preview ETA cannot read as today's live status. */
export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
  quick?: boolean;
  at?: number;
  context?: 'preview' | 'real';
  scenario?: DemoScenario;
}

export interface Commute {
  origin: string;
  destination: string;
  saved: boolean;
  preferred: TransitId;
}

export interface LocalState {
  version: typeof STATE_VERSION;
  lang: Lang;
  themePref: ThemePref;
  /** The user's corregimiento: the place anchor for Home, Services, Reports and Ask. */
  area: string;
  onboarded: boolean;
  demoEnabled: boolean;
  demoScenario: DemoScenario;
  commute: Commute;
  reports: LocalReport[];
  chat: ChatTurn[];
}

export type Action =
  | { type: 'hydrate'; state: LocalState }
  | { type: 'setLang'; lang: Lang }
  | { type: 'setTheme'; themePref: ThemePref }
  | { type: 'setArea'; area: string }
  | { type: 'completeOnboarding' }
  | { type: 'setDemoEnabled'; value: boolean }
  | { type: 'setScenario'; scenario: DemoScenario }
  | { type: 'setCommute'; patch: Partial<Commute> }
  | { type: 'addReport'; input: { service: ReportService; corregimiento: string; note: string }; at: number; scope: LocalReport['scope'] }
  | { type: 'removeReport'; id: string }
  | { type: 'setChat'; turns: ChatTurn[] }
  | { type: 'clearChat' };

export const isArea = (v: unknown): v is string => typeof v === 'string' && CORREGIMIENTOS.includes(v);
const SCENARIOS: DemoScenario[] = ['everyday', 'disruption', 'recovery'];

export function defaultState(lang: Lang = 'es', demoEnabled = false): LocalState {
  return {
    version: STATE_VERSION,
    lang,
    themePref: 'auto',
    area: DEFAULT_AREA,
    onboarded: false,
    demoEnabled,
    demoScenario: 'everyday',
    commute: { origin: DEFAULT_AREA, destination: 'Albrook', saved: true, preferred: 'metro1' },
    reports: [],
    chat: [],
  };
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');

function cleanReports(raw: unknown): LocalReport[] {
  if (!Array.isArray(raw)) return [];
  const out: LocalReport[] = [];
  for (const r of raw) {
    if (!r || typeof r !== 'object') continue;
    const o = r as Record<string, unknown>;
    if ((o.service !== 'electricity' && o.service !== 'water') || !isArea(o.corregimiento) || typeof o.at !== 'number' || !Number.isFinite(o.at)) continue;
    out.push({
      id: str(o.id, 64) || `local-${o.at}-${out.length}`,
      service: o.service,
      corregimiento: o.corregimiento,
      note: safePreviewNote(str(o.note, 200)),
      at: o.at,
      origin: 'local',
      scope: o.scope === 'preview' ? 'preview' : 'device',
    });
  }
  return out.sort((a, b) => b.at - a.at).slice(0, MAX_REPORTS);
}

function cleanChat(raw: unknown): ChatTurn[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatTurn[] = [];
  for (const t of raw) {
    if (!t || typeof t !== 'object') continue;
    const o = t as Record<string, unknown>;
    if ((o.role !== 'user' && o.role !== 'assistant') || typeof o.content !== 'string' || !o.content) continue;
    out.push({
      role: o.role,
      content: o.content.slice(0, 4000),
      quick: o.quick === true ? true : undefined,
      at: typeof o.at === 'number' && Number.isFinite(o.at) && o.at > 0 ? o.at : undefined,
      context: o.context === 'preview' || o.context === 'real' ? o.context : undefined,
      scenario: SCENARIOS.includes(o.scenario as DemoScenario) ? o.scenario as DemoScenario : undefined,
    });
  }
  return out.slice(-MAX_CHAT_TURNS);
}

/** Validate anything read from storage. Unknown or corrupt fields fall back to defaults; nothing throws. */
export function sanitize(raw: unknown, base: LocalState): LocalState {
  if (!raw || typeof raw !== 'object') return base;
  const o = raw as Record<string, unknown>;
  const c = (o.commute && typeof o.commute === 'object' ? o.commute : {}) as Record<string, unknown>;
  return {
    version: STATE_VERSION,
    lang: o.lang === 'es' || o.lang === 'en' ? o.lang : base.lang,
    themePref: o.themePref === 'auto' || o.themePref === 'light' || o.themePref === 'dark' ? o.themePref : base.themePref,
    area: isArea(o.area) ? o.area : base.area,
    onboarded: typeof o.onboarded === 'boolean' ? o.onboarded : base.onboarded,
    demoEnabled: typeof o.demoEnabled === 'boolean' ? o.demoEnabled : base.demoEnabled,
    demoScenario: SCENARIOS.includes(o.demoScenario as DemoScenario) ? (o.demoScenario as DemoScenario) : base.demoScenario,
    commute: {
      origin: isArea(c.origin) ? c.origin : base.commute.origin,
      destination: typeof c.destination === 'string' && c.destination ? c.destination.slice(0, 40) : base.commute.destination,
      saved: typeof c.saved === 'boolean' ? c.saved : base.commute.saved,
      preferred: c.preferred === 'metro1' || c.preferred === 'metro2' || c.preferred === 'mibus' ? c.preferred : base.commute.preferred,
    },
    reports: cleanReports(o.reports),
    chat: cleanChat(o.chat),
  };
}

/**
 * v0.x installs stored `panapulse.prefs.v1` (+ `panapulse.reports.v1`). Carry them over so nobody loses
 * preferences or reports; an existing install has already seen the app, so onboarding is marked done.
 */
export function migrateLegacy(prefsV1: unknown, reportsV1: unknown, base: LocalState): LocalState {
  const p = (prefsV1 && typeof prefsV1 === 'object' ? prefsV1 : {}) as Record<string, unknown>;
  const hasPrefs = Object.keys(p).length > 0;
  const merged = sanitize({ ...p, commute: { saved: p.demoCommuteSaved }, reports: Array.isArray(reportsV1) ? reportsV1 : [] }, base);
  return { ...merged, onboarded: hasPrefs || merged.reports.length > 0 ? true : base.onboarded };
}

export function reduce(state: LocalState, a: Action): LocalState {
  switch (a.type) {
    case 'hydrate': return a.state;
    case 'setLang': return { ...state, lang: a.lang };
    case 'setTheme': return { ...state, themePref: a.themePref };
    case 'setArea': return isArea(a.area) ? { ...state, area: a.area, commute: { ...state.commute, origin: a.area } } : state;
    case 'completeOnboarding': return { ...state, onboarded: true };
    case 'setDemoEnabled': return { ...state, demoEnabled: a.value };
    case 'setScenario': return SCENARIOS.includes(a.scenario) ? { ...state, demoScenario: a.scenario } : state;
    case 'setCommute': {
      const next = { ...state.commute, ...a.patch };
      if (!isArea(next.origin)) next.origin = state.commute.origin;
      if (!next.destination) next.destination = state.commute.destination;
      if (!['metro1', 'metro2', 'mibus'].includes(next.preferred)) next.preferred = state.commute.preferred;
      return { ...state, commute: next };
    }
    case 'addReport': {
      if (!isArea(a.input.corregimiento) || (a.input.service !== 'electricity' && a.input.service !== 'water')) return state;
      const r: LocalReport = {
        id: `local-${a.at}-${state.reports.length}`,
        service: a.input.service,
        corregimiento: a.input.corregimiento, // one corregimiento only, never a precise location
        note: safePreviewNote(a.input.note),
        at: a.at,
        origin: 'local',
        scope: a.scope,
      };
      return { ...state, reports: [r, ...state.reports].slice(0, MAX_REPORTS) };
    }
    case 'removeReport': return { ...state, reports: state.reports.filter((r) => r.id !== a.id) };
    case 'setChat': return { ...state, chat: cleanChat(a.turns) };
    case 'clearChat': return { ...state, chat: [] };
  }
}
