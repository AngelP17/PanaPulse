/**
 * Fictional, deterministic presentation fixtures. Not connected to official providers.
 * OFF by default. Never sent as official source data or treated as a real outage.
 * No fictional earthquake is generated; those views always use genuine USGS records.
 */
export type DemoScenario = 'everyday' | 'disruption' | 'recovery';
export type TransitId = 'metro1' | 'metro2' | 'mibus';
export type DemoCondition = 'normal' | 'delayed' | 'recovering';
export type DemoUtilityState = 'no_notice' | 'scheduled' | 'interrupted' | 'recovering';
export interface DemoTransit { id: TransitId; condition: DemoCondition; arrivalMinutes: number; delayMinutes: number }
export interface DemoScene {
  scenario: DemoScenario;
  communityReports: number;
  transit: DemoTransit[];
  power: DemoUtilityState;
  water: DemoUtilityState;
  generatedAt: number;
}
export function demoCountdown(now: number, period: number, offset: number): number {
  if (!Number.isFinite(now) || period <= 0) return 1;
  return ((period - ((Math.floor(now / 60000) + offset) % period)) % period) + 1;
}
export function makeDemoScene(now: number, scenario: DemoScenario): DemoScene {
  const disrupted = scenario === 'disruption';
  const recovering = scenario === 'recovery';
  const transit: DemoTransit[] = [
    { id: 'metro1', condition: disrupted ? 'delayed' : recovering ? 'recovering' : 'normal',
      arrivalMinutes: demoCountdown(now, 7, 2) + (disrupted ? 8 : 0), delayMinutes: disrupted ? 8 : 0 },
    { id: 'metro2', condition: 'normal', arrivalMinutes: demoCountdown(now, 9, 4), delayMinutes: 0 },
    { id: 'mibus', condition: disrupted ? 'delayed' : recovering ? 'recovering' : 'normal',
      arrivalMinutes: demoCountdown(now, 13, 6) + (disrupted ? 6 : 0), delayMinutes: disrupted ? 6 : 0 },
  ];
  return {
    scenario,
    communityReports: (disrupted ? 7 : recovering ? 4 : 2) + Math.floor(now / (5 * 60 * 1000)) % 3,
    transit, power: disrupted ? 'interrupted' : recovering ? 'recovering' : 'scheduled',
    water: disrupted ? 'interrupted' : recovering ? 'recovering' : 'no_notice',
    generatedAt: now,
  };
}
