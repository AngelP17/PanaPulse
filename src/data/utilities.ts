// Electricity: provider coverage from Naturgy's official concession list, and scheduled
// maintenance notices from ENSA's and Naturgy's public pages (snapshot; the backend adapters
// in backend/panapulse/utilities.py refresh these). Covers SCHEDULED work only, not unplanned outages.
import snap from './utilities_snapshot.json';

export type Provider = 'naturgy' | 'ensa' | 'border';

export interface PowerNotice {
  provider: 'ENSA' | 'Naturgy';
  district: string;
  corregimiento: string;
  place: string;
  start: number;
  end: number;
  task: string;
  affected: number;
}

export interface ProviderInfo {
  provider: Provider;
  /** true when the zone is on Naturgy's official EDEMET list; false when inferred by exclusion. */
  verified: boolean;
  name: string;
  sourceUrl: string;
  sourceFetchedAt: number;
}

const key = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();

const edemet = new Set(snap.edemetPanamaDistrict.corregimientos.map(key));
const border = new Set(snap.borderAreas.map(key));

export function providerFor(zone: string): ProviderInfo {
  const k = key(zone);
  if (border.has(k)) {
    return { provider: 'border', verified: true, name: 'Naturgy (Edemet) · ENSA', sourceUrl: snap.edemetPanamaDistrict.source, sourceFetchedAt: snap.ensa.fetchedAt };
  }
  if (edemet.has(k)) {
    return { provider: 'naturgy', verified: true, name: 'Naturgy (Edemet)', sourceUrl: snap.naturgy.source, sourceFetchedAt: snap.naturgy.fetchedAt };
  }
  // Panamá district corregimientos not on the EDEMET list are served by ENSA (inferred, not listed).
  return { provider: 'ensa', verified: false, name: 'ENSA', sourceUrl: snap.ensa.source, sourceFetchedAt: snap.ensa.fetchedAt };
}

export function noticesFor(zone: string, now: number): PowerNotice[] {
  const k = key(zone);
  const all = [...(snap.ensa.notices as PowerNotice[]), ...(snap.naturgy.notices as PowerNotice[])];
  return all.filter((n) => key(n.corregimiento) === k && n.end >= now).sort((a, b) => a.start - b.start);
}

export const naturgyPublishedThrough: number = snap.naturgy.publishedThrough;
export const utilitySources = { ensa: snap.ensa.source, naturgy: snap.naturgy.source, concession: snap.edemetPanamaDistrict.source };
