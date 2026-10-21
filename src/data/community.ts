import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { API_URL, apiJson, ApiError } from './runtime';
import { CORREGIMIENTOS } from './services';

export interface Submission {
  request_id: string; area: string; service: 'electricity' | 'water'; observation: 'interruption' | 'restored';
  epoch: string; observed_at: string;
}
export interface Receipt extends Omit<Submission, 'epoch' | 'observed_at'> {
  id: string; created_at: string; expires_at: string;
  status: 'active' | 'expired' | 'hidden' | 'superseded'; verification: 'community_unverified';
}
export interface Summary {
  area: string; as_of: string; verification: 'community_unverified'; service_state: 'unknown';
  groups: { service: Submission['service']; observation: Submission['observation'];
    state: 'none' | 'insufficient_reports' | 'reports_received'; count: number | null }[];
}
const PREFIX = `panapulse.community.v1:${API_URL}`;
export const PENDING_KEY = `${PREFIX}:pending`;
let tokenPromise: Promise<string> | null = null;
let reportConfig: { epoch: string; offset: number } | null = null;
export async function refreshReportConfig(): Promise<void> {
  const value = await apiJson('/v0/community/config');
  const serverTime = Date.parse(value.server_time);
  if (!/^[a-f0-9]{32}$/.test(value.epoch) || !Number.isFinite(serverTime) ||
      value.max_submission_age_seconds !== 7200) throw new Error('invalid_report_config');
  reportConfig = { epoch: value.epoch, offset: serverTime - Date.now() };
}
async function identity(): Promise<string> {
  const key = `${PREFIX}:identity`;
  const saved = await AsyncStorage.getItem(key);
  if (saved && /^[a-f0-9]{64}$/.test(saved)) return saved;
  const token = Array.from(Crypto.getRandomBytes(32), byte => byte.toString(16).padStart(2, '0')).join('');
  // If storage fails, refuse submission: do not strand the owner's withdrawal credential.
  await AsyncStorage.setItem(key, token);
  return token;
}
async function headers() {
  tokenPromise ??= identity().catch(e => { tokenPromise = null; throw e; });
  return { 'Content-Type': 'application/json', 'X-Installation-Token': await tokenPromise };
}
export async function newSubmission(input: Omit<Submission, 'request_id' | 'epoch' | 'observed_at'>): Promise<Submission> {
  if (!reportConfig) await refreshReportConfig();
  const config = reportConfig!;
  return { ...input, request_id: Crypto.randomUUID(), epoch: config.epoch,
    observed_at: new Date(Date.now() + config.offset).toISOString() };
}
function receipt(value: any): Receipt {
  if (!value || !/^[a-f0-9]{64}$/.test(value.id) || value.verification !== 'community_unverified' ||
      !['electricity', 'water'].includes(value.service) || !['interruption', 'restored'].includes(value.observation) ||
      !['active', 'expired', 'hidden', 'superseded'].includes(value.status) || typeof value.area !== 'string' ||
      !Number.isFinite(Date.parse(value.created_at)) || !Number.isFinite(Date.parse(value.expires_at))) throw new Error('invalid_receipt');
  return value;
}
export async function loadPending(): Promise<{ body: Submission | null; discarded: boolean }> {
  const raw = await AsyncStorage.getItem(PENDING_KEY);
  if (!raw) return { body: null, discarded: false };
  try {
    const v = JSON.parse(raw);
    if (v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.request_id) &&
        CORREGIMIENTOS.includes(v.area) && ['electricity', 'water'].includes(v.service) &&
        ['interruption', 'restored'].includes(v.observation) && /^[a-f0-9]{32}$/.test(v.epoch) &&
        typeof v.observed_at === 'string' && Number.isFinite(Date.parse(v.observed_at))) return { body: v, discarded: false };
  } catch { /* Corrupt local data must not strand the form or be submitted. */ }
  await AsyncStorage.removeItem(PENDING_KEY);
  return { body: null, discarded: true };
}
export async function submitObservation(body: Submission): Promise<Receipt> {
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(body));
  let result: Receipt;
  try {
    result = receipt(await apiJson('/v0/community/reports', { method: 'POST', headers: await headers(), body: JSON.stringify(body) }));
  } catch (error) {
    if (error instanceof Error && error.message === 'HTTP_410') {
      if (error instanceof ApiError && error.detail === 'report_epoch_expired') reportConfig = null;
      await AsyncStorage.removeItem(PENDING_KEY);
    }
    throw error;
  }
  await AsyncStorage.removeItem(PENDING_KEY);
  return result;
}
export async function myObservations(): Promise<Receipt[]> {
  const data = await apiJson('/v0/community/mine', { headers: await headers() });
  if (!Array.isArray(data.items)) throw new Error('invalid_reports');
  return data.items.map(receipt);
}
export async function withdrawObservation(id: string): Promise<void> {
  const data = await apiJson(`/v0/community/reports/${encodeURIComponent(id)}`, { method: 'DELETE', headers: await headers() });
  if (data.deleted !== true) throw new Error('withdrawal_not_confirmed');
}
export async function communitySummary(area: string): Promise<Summary> {
  const data = await apiJson(`/v0/community/summary?area=${encodeURIComponent(area)}`);
  if (data.area !== area || data.verification !== 'community_unverified' || data.service_state !== 'unknown' ||
      !Number.isFinite(Date.parse(data.as_of)) || !Array.isArray(data.groups) || data.groups.length !== 4 ||
      data.groups.some((g: any) => !['electricity', 'water'].includes(g.service) || !['interruption', 'restored'].includes(g.observation) ||
        !['none', 'insufficient_reports', 'reports_received'].includes(g.state) ||
        (g.state === 'reports_received' ? !Number.isInteger(g.count) || g.count < 3 : g.count !== null))) throw new Error('invalid_summary');
  return data;
}
