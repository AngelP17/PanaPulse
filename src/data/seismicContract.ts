import type { SeismicData } from './usgs';

const number = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
/** Reject corrupt payloads before any magnitude, position, or probability reaches the UI. */
export function validateSeismic(value: any): SeismicData {
  if (!value || !Array.isArray(value.earthquakes) || !number(value.fetchedAt) || value.fetchedAt < 0 ||
      value.fetchedAt > Date.now() + 60000 || !['live', 'snapshot'].includes(value.mode)) throw new Error('invalid_seismic');
  for (const q of value.earthquakes) {
    if (!q || !/^[a-zA-Z0-9_-]+$/.test(q.id) || typeof q.place !== 'string' ||
        !number(q.mag) || q.mag < -2 || q.mag > 10 || !number(q.time) || q.time <= 0 ||
        !number(q.lat) || Math.abs(q.lat) > 90 || !number(q.lon) || Math.abs(q.lon) > 180 ||
        !(q.depthKm === null || number(q.depthKm)) || typeof q.status !== 'string' ||
        !(q.alert === null || ['green', 'yellow', 'orange', 'red'].includes(q.alert))) throw new Error('invalid_quake');
  }
  const f = value.forecast;
  if (f !== null) {
    if (!f || !number(f.creationTime) || !(f.nextForecastTime === null || number(f.nextForecastTime)) ||
        typeof f.mainshockId !== 'string' || typeof f.url !== 'string' ||
        !f.url.startsWith('https://earthquake.usgs.gov/') || !Array.isArray(f.windows)) throw new Error('invalid_forecast');
    for (const w of f.windows) {
      if (!number(w.timeStart) || !number(w.timeEnd) || w.timeEnd <= w.timeStart || typeof w.label !== 'string' ||
          !Array.isArray(w.bins)) throw new Error('invalid_forecast_window');
      for (const b of w.bins) {
        if (!number(b.magnitude) || !number(b.probability) || b.probability < 0 || b.probability > 1 ||
            ![b.median, b.p95min, b.p95max].every(v => v === null || (number(v) && v >= 0))) throw new Error('invalid_forecast_bin');
      }
    }
  }
  return { earthquakes: [...value.earthquakes].sort((a, b) => b.time - a.time), forecast: f,
    fetchedAt: value.fetchedAt, mode: value.mode };
}
