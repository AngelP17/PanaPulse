import type { Quake } from './usgs';

export type SeismicMagnitudeFilter = 'all' | 5 | 6;

/** Pure, stable, nonmutating UI projection over authentic USGS catalog events. */
export function filterQuakes(events: readonly Quake[], minimum: SeismicMagnitudeFilter): Quake[] {
  const threshold = minimum === 'all' ? 0 : minimum;
  return events.filter((event) => event.mag >= threshold)
    .sort((a, b) => b.time - a.time || a.id.localeCompare(b.id));
}
