// Home "glance" rules: what goes in the hero, which statuses earn a chip, which sources are offline.
// Pure functions over validated app data, so every branch can be reasoned about and tested.
import type { PowerFeedState } from './maintenance';
import type { Quake, SeismicData } from './usgs';

/** Live USGS data refreshes every 5 minutes; older than this and we stop presenting it as current. */
export const LIVE_MAX_AGE_MS = 20 * 60 * 1000;

/**
 * Documented relevance criteria for the "recent significant earthquake" hero.
 * The catalog is already limited to the Panama region box (see usgs.ts BBOX, M4.5+).
 * An event qualifies when it meets either rule; the most recent qualifying event wins.
 */
export const NOTABLE_RULES = [
  { minMag: 6.0, withinHours: 72 },
  { minMag: 5.0, withinHours: 24 },
] as const;

export type SeismicHero =
  | { kind: 'notable'; quake: Quake; severe: boolean }
  | { kind: 'calm'; latest: Quake | null }
  | { kind: 'stale' };

/**
 * Snapshot (bundled) data is never fresh, whatever its timestamp. Live data is fresh only while recent.
 * `severe` is true only for a USGS PAGER orange/red alert: a catalog entry alone is not an emergency.
 */
export function seismicHero(d: SeismicData, now: number): SeismicHero {
  const fresh = d.mode === 'live' && now >= d.fetchedAt && now - d.fetchedAt <= LIVE_MAX_AGE_MS;
  if (!fresh) return { kind: 'stale' };
  const notable = d.earthquakes
    .filter((q) => NOTABLE_RULES.some((r) => q.mag >= r.minMag && now - q.time >= 0 && now - q.time <= r.withinHours * 3600 * 1000))
    .sort((a, b) => b.time - a.time)[0];
  if (notable) return { kind: 'notable', quake: notable, severe: notable.alert === 'orange' || notable.alert === 'red' };
  return { kind: 'calm', latest: [...d.earthquakes].sort((a, b) => b.time - a.time)[0] ?? null };
}

/**
 * The named locality from a USGS place ("7 km WSW of Calidonia, Panama" -> "Calidonia").
 * USGS distances are relative to that locality, not to the user, so they are not shown in the headline.
 * Returns null when the place has no locality pattern (e.g. "south of Panama").
 */
export function locality(raw: string): string | null {
  const m = raw.match(/^\d+ km [NSEW]{1,3} of (.+?)(?:, Panama)?$/);
  return m ? m[1] : null;
}

/** Feeds PanaPulse has connected today. Membership of the offline line is derived from this plus live state. */
export const CONNECTED_FEEDS = { water: false, metro: false, mibus: false } as const;

export type OfflineSource = 'power' | 'water' | 'metro' | 'mibus';

export function offlineSources(power: PowerFeedState): OfflineSource[] {
  const out: OfflineSource[] = [];
  if (power === 'none') out.push('power');
  if (!CONNECTED_FEEDS.water) out.push('water');
  if (!CONNECTED_FEEDS.metro) out.push('metro');
  if (!CONNECTED_FEEDS.mibus) out.push('mibus');
  return out;
}

/** "Agua, Metro y MiBus" / "Water, Metro and MiBus". */
export function joinList(items: string[], and: string): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`;
}
