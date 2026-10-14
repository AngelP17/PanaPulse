import type { DemoScenario } from './demo';

export type ReportService = 'electricity' | 'water';
export interface AnonymousReport {
  id: string;
  service: ReportService;
  corregimiento: string;
  at: number;
  /** For predefined example reports, translate this key. */
  descriptionKey?: 'neighborNotePowerInterrupted' | 'neighborNotePowerSlow' | 'neighborNotePowerReturned'
    | 'neighborNotePowerScheduled' | 'neighborNoteWaterLow' | 'neighborNoteWaterNoSupply'
    | 'neighborNoteWaterRecover' | 'neighborNoteWaterNormal';
  /** User-authored preview note. Kept in this device's app session only. */
  note?: string;
  origin: 'example' | 'local';
}

/** Prevent obvious personal contact details being included in a demo report. */
export function safePreviewNote(raw: string): string {
  return raw.trim().slice(0, 200)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[…]')
    .replace(/(?:\+?\d[\d\s().-]{6,}\d)/g, '[…]');
}

export function neighborhoodFeed(now: number, scenario: DemoScenario, count: number, submitted: AnonymousReport[], area = 'Pueblo Nuevo'): AnonymousReport[] {
  const notes: Record<DemoScenario, AnonymousReport['descriptionKey'][]> = {
    everyday: ['neighborNotePowerScheduled', 'neighborNoteWaterNormal', 'neighborNotePowerSlow'],
    disruption: ['neighborNotePowerInterrupted', 'neighborNoteWaterLow', 'neighborNotePowerSlow', 'neighborNoteWaterNoSupply'],
    recovery: ['neighborNotePowerReturned', 'neighborNoteWaterRecover', 'neighborNotePowerSlow', 'neighborNoteWaterLow'],
  };
  // Stable windows, deterministic scenario content. Generated only inside Preview.
  const anchor = Math.floor(now / (5 * 60000)) * 5 * 60000;
  const examples: AnonymousReport[] = Array.from({ length: Math.max(0, count) }, (_, index) => {
    const key = notes[scenario][index % notes[scenario].length];
    return {
      id: `example-${scenario}-${index}`,
      service: key?.toLowerCase().includes('water') ? 'water' : 'electricity',
      corregimiento: index % 4 === 3 ? (area === 'Betania' ? 'Bella Vista' : 'Betania') : area,
      at: anchor - (index * 6 + 3) * 60000,
      descriptionKey: key,
      origin: 'example',
    };
  });
  return [...submitted, ...examples].sort((a,b) => b.at - a.at);
}
