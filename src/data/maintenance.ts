import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { API_URL as API, apiJson } from './runtime';

/** Scheduled-power notices from the PanaPulse API, not live outage telemetry. */
export interface MaintenanceSource {
  provider: 'ensa' | 'naturgy';
  freshness: 'current' | 'stale_or_unavailable';
  source_url: string;
  last_success_at: string | null;
  last_attempt_at: string | null;
  last_error: string | null;
}
export interface MaintenanceNotice {
  id: string;
  provider: 'ENSA' | 'Naturgy';
  place: string;
  start: string;
  end: string;
  task: string | null;
  affected: number | null;
  source_url: string;
  verification: 'official_scheduled';
  source_freshness: MaintenanceSource['freshness'];
}
export interface MaintenanceResult {
  corregimiento: string;
  coverage: { provider: 'ensa' | 'naturgy' | 'border'; name: string; basis: string };
  sources: MaintenanceSource[];
  notices: MaintenanceNotice[];
  service_state: 'unknown';
  scope: 'scheduled_maintenance_only';
  note: string;
}
export async function fetchMaintenance(zone: string, signal: AbortSignal): Promise<MaintenanceResult> {
  const value: MaintenanceResult = await apiJson(`/v0/power-maintenance?corregimiento=${encodeURIComponent(zone)}`, { signal });
  if (value.scope !== 'scheduled_maintenance_only' || value.service_state !== 'unknown' ||
      value.corregimiento !== zone || !Array.isArray(value.sources) || !Array.isArray(value.notices) ||
      value.notices.some(n => !n || !Number.isFinite(Date.parse(n.start)) || !Number.isFinite(Date.parse(n.end)) ||
        n.verification !== 'official_scheduled' || !['ENSA', 'Naturgy'].includes(n.provider))) {
    throw new Error('invalid_maintenance_data');
  }
  return value;
}
export function usePowerMaintenance(zone: string) {
  const [data, setData] = useState<MaintenanceResult | null>(null);
  const [state, setState] = useState<'unconfigured' | 'loading' | 'ready' | 'error'>(API ? 'loading' : 'unconfigured');
  useEffect(() => {
    setData(null);
    setState(API ? 'loading' : 'unconfigured');
    if (!API) return;
    let disposed = false;
    let controller: AbortController | undefined;
    const refresh = async () => {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      try {
        const value = await fetchMaintenance(zone, request.signal);
        if (!disposed && !request.signal.aborted) { setData(value); setState('ready'); }
      } catch {
        if (!disposed && !request.signal.aborted) setState('error');
      }
    };
    void refresh();
    const id = setInterval(refresh, 15 * 60 * 1000);
    const resume = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => { resume.remove(); disposed = true; controller?.abort(); clearInterval(id); };
  }, [zone]);
  return { data: data?.corregimiento === zone ? data : null, state };
}

/**
 * One reading of the scheduled-maintenance feed, shared by the pulse rail and the Luz card so they never disagree.
 * - `none`: no usable data (server not configured, still loading, or the request failed).
 * - `stale`: the feed answered but at least one provider source is out of date.
 * - `scheduled`: every provider source is current; notices (possibly zero) are official schedules.
 * None of these says anything about whether power is on right now.
 */
export type PowerFeedState = 'none' | 'stale' | 'scheduled';
export function powerFeedState(data: MaintenanceResult | null, state: ReturnType<typeof usePowerMaintenance>['state']): PowerFeedState {
  if (!data) return 'none';
  if (state !== 'ready') return 'stale';
  return data.sources.length > 0 && data.sources.every((s) => s.freshness === 'current') ? 'scheduled' : 'stale';
}
