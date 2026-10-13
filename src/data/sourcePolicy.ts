import type { PowerFeedState } from './maintenance';

/**
 * Source-first selection: never let an example overwrite real current OR stale
 * official information. An example can fill a missing slot only when opted in.
 */
export type PowerSurface = 'official' | 'stale' | 'example' | 'missing';
export function powerSurfaceSource(power: PowerFeedState, demoEnabled: boolean): PowerSurface {
  if (power === 'scheduled') return 'official';
  if (power === 'stale') return 'stale';
  return demoEnabled ? 'example' : 'missing';
}
