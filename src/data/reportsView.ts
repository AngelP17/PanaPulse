// Pure view rules for the neighborhood activity list: what is shown, filtered how, labeled as what.
import type { AnonymousReport } from './neighborhood';
import { neighborhoodFeed } from './neighborhood';
import type { LocalReport } from './localModel';
import type { DemoScenario } from './demo';

export type ServiceFilter = 'all' | 'electricity' | 'water';
export type ScopeFilter = 'area' | 'city';

export const toAnonymous = (r: LocalReport): AnonymousReport => ({
  id: r.id, service: r.service, corregimiento: r.corregimiento, note: r.note, at: r.at, origin: 'local',
});

/**
 * Live mode: only what this user wrote outside preview, never fictional neighbors.
 * Preview: examples for the scenario plus everything written on this device, so the walkthrough stays whole.
 */
export function activityFeed(input: {
  previewOn: boolean; now: number; scenario: DemoScenario; exampleCount: number; area: string; local: LocalReport[];
}): AnonymousReport[] {
  const { previewOn, now, scenario, exampleCount, area, local } = input;
  if (!previewOn) return local.filter((r) => r.scope === 'device').map(toAnonymous).sort((a, b) => b.at - a.at);
  return neighborhoodFeed(now, scenario, exampleCount, local.map(toAnonymous), area);
}

export function filterActivity(items: AnonymousReport[], service: ServiceFilter, scope: ScopeFilter, area: string): AnonymousReport[] {
  return items.filter((r) => (service === 'all' || r.service === service) && (scope === 'city' || r.corregimiento === area));
}
