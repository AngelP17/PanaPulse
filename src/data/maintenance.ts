import { useEffect, useState } from 'react';

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
const API = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
export async function fetchMaintenance(zone: string, signal: AbortSignal): Promise<MaintenanceResult> {
  if (!API) throw new Error('not_configured');
  const res = await fetch(`${API}/v0/power-maintenance?corregimiento=${encodeURIComponent(zone)}`, {
    signal, headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const value: MaintenanceResult = await res.json();
  if (value.scope !== 'scheduled_maintenance_only' || value.service_state !== 'unknown' ||
      !Array.isArray(value.sources) || !Array.isArray(value.notices)) {
    throw new Error('invalid_maintenance_data');
  }
  return value;
}
export function usePowerMaintenance(zone: string) {
  const [data, setData] = useState<MaintenanceResult | null>(null);
  const [state, setState] = useState<'unconfigured' | 'loading' | 'ready' | 'error'>(API ? 'loading' : 'unconfigured');
  useEffect(() => {
    if (!API) return;
    let disposed = false;
    let controller: AbortController | undefined;
    const refresh = async () => {
      controller?.abort();
      controller = new AbortController();
      try {
        const value = await fetchMaintenance(zone, controller.signal);
        if (!disposed) { setData(value); setState('ready'); }
      } catch {
        if (!disposed && !controller.signal.aborted) setState('error');
      }
    };
    void refresh();
    const id = setInterval(refresh, 15 * 60 * 1000);
    return () => { disposed = true; controller?.abort(); clearInterval(id); };
  }, [zone]);
  return { data, state };
}
