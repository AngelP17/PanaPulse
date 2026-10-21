import snapshotJson from './usgs_snapshot.json';
import { CONNECTED, apiJson } from './runtime';
import { validateSeismic } from './seismicContract';

export interface Quake {
  id: string;
  mag: number;
  place: string;
  time: number; // epoch ms
  lat: number;
  lon: number;
  depthKm: number | null;
  status: string;
  alert: string | null;
}

export interface ForecastBin {
  magnitude: number;
  probability: number;
  median: number;
  p95min: number;
  p95max: number;
}

export interface ForecastWindow {
  label: '1 Day' | '1 Week' | '1 Month' | '1 Year' | string;
  timeStart: number;
  timeEnd: number;
  bins: ForecastBin[];
}

export interface Forecast {
  creationTime: number;
  nextForecastTime: number | null;
  mainshockId: string;
  url: string;
  windows: ForecastWindow[];
}

export interface SeismicData {
  earthquakes: Quake[];
  forecast: Forecast | null;
  fetchedAt: number;
  mode: 'live' | 'snapshot';
}

const BBOX = { minlatitude: 5.5, maxlatitude: 11.5, minlongitude: -84, maxlongitude: -76 };
const USGS = 'https://earthquake.usgs.gov';

export function loadSnapshot(): SeismicData {
  if (CONNECTED) return { earthquakes: [], forecast: null, fetchedAt: 0, mode: 'snapshot' };
  const s = snapshotJson as unknown as {
    fetchedAt: number;
    earthquakes: Quake[];
    forecast: Forecast & { windows: ForecastWindow[] };
  };
  return {
    earthquakes: [...s.earthquakes].sort((a, b) => b.time - a.time),
    forecast: s.forecast,
    fetchedAt: s.fetchedAt,
    mode: 'snapshot',
  };
}

async function getJson(url: string, signal: AbortSignal): Promise<any> {
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Live USGS fetch for native builds. Throws on any failure so the caller can keep
 * the last known data and label it with its real age. Never fabricates values.
 */
export async function loadLive(timeoutMs = 9000): Promise<SeismicData> {
  if (CONNECTED) return validateSeismic(await apiJson('/v0/seismic', {}, timeoutMs));
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const start = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString().slice(0, 19);
    const qs = new URLSearchParams({
      format: 'geojson',
      starttime: start,
      minmagnitude: '4.5',
      orderby: 'time',
      ...Object.fromEntries(Object.entries(BBOX).map(([k, v]) => [k, String(v)])),
    });
    const fc = await getJson(`${USGS}/fdsnws/event/1/query?${qs}`, ctrl.signal);
    const earthquakes: Quake[] = (fc.features ?? []).map((f: any) => ({
      id: f.id,
      mag: f.properties.mag,
      place: f.properties.place ?? '',
      time: f.properties.time,
      lon: f.geometry.coordinates[0],
      lat: f.geometry.coordinates[1],
      depthKm: f.geometry.coordinates[2] ?? null,
      status: f.properties.status,
      alert: f.properties.alert ?? null,
    }));

    // Only show a forecast if USGS actually published one (an `oaf` product).
    let forecast: Forecast | null = null;
    const withOaf = (fc.features ?? [])
      .filter((f: any) => String(f.properties.types ?? '').includes(',oaf,'))
      .sort((a: any, b: any) => b.properties.mag - a.properties.mag)[0];
    if (withOaf) {
      const detail = await getJson(`${USGS}/earthquakes/feed/v1.0/detail/${withOaf.id}.geojson`, ctrl.signal);
      const oaf = (detail.properties?.products?.oaf ?? []).find((p: any) => p.status !== 'DELETE');
      const url: string | undefined = oaf?.contents?.['forecast.json']?.url;
      if (url && url.startsWith(`${USGS}/`)) {
        const raw = await getJson(url, ctrl.signal);
        forecast = {
          creationTime: raw.creationTime,
          nextForecastTime: raw.nextForecastTime ?? null,
          mainshockId: withOaf.id,
          url,
          windows: (raw.forecast ?? []).map((w: any) => ({
            label: w.label,
            timeStart: w.timeStart,
            timeEnd: w.timeEnd,
            bins: (w.bins ?? []).map((b: any) => ({
              magnitude: b.magnitude,
              probability: b.probability,
              median: b.median,
              p95min: b.p95minimum,
              p95max: b.p95maximum,
            })),
          })),
        };
      }
    }
    return validateSeismic({ earthquakes, forecast, fetchedAt: Date.now(), mode: 'live' });
  } finally {
    clearTimeout(timer);
  }
}

export function bin(f: Forecast | null, label: string, magnitude: number): ForecastBin | null {
  const w = f?.windows.find((x) => x.label === label);
  return w?.bins.find((b) => b.magnitude === magnitude) ?? null;
}
