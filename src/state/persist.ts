import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultState, LocalState, migrateLegacy, sanitize } from '../data/localModel';
import type { Lang } from '../i18n/strings';

const KEY = 'panapulse.state.v2';
const LEGACY_PREFS = 'panapulse.prefs.v1';
const LEGACY_REPORTS = 'panapulse.reports.v1';

async function readJson(key: string): Promise<unknown> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

/** Load validated state; fall back to v1 keys, then defaults. Storage can be unavailable: never throw. */
export async function loadLocalState(lang: Lang, demoEnabled: boolean): Promise<LocalState> {
  const base = defaultState(lang, demoEnabled);
  const current = await readJson(KEY);
  if (current) return sanitize(current, base);
  const [prefs, reports] = await Promise.all([readJson(LEGACY_PREFS), readJson(LEGACY_REPORTS)]);
  return migrateLegacy(prefs, reports, base);
}

export async function saveLocalState(state: LocalState): Promise<void> {
  try { await AsyncStorage.setItem(KEY, JSON.stringify(state)); }
  catch { /* the session keeps working; it just will not survive a restart */ }
}
