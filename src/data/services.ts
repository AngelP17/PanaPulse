// Services and mobility have NO connected source yet. These records exist so the UI
// and the chat can say so explicitly, with the official channel to check instead.

export type ServiceId = 'electricity' | 'water' | 'metro_l1' | 'metro_l2' | 'mibus';

export interface ServiceStatus {
  id: ServiceId;
  provider: string;
  state: 'unknown';
  verification: 'unavailable';
  officialUrl: string;
  reason: string;
}

export const SERVICES: Record<ServiceId, ServiceStatus> = {
  electricity: {
    id: 'electricity',
    provider: 'Naturgy or ENSA (coverage depends on the area; not mapped yet)',
    state: 'unknown',
    verification: 'unavailable',
    officialUrl: 'https://www.naturgy.com.pa/ | https://www.ensa.com.pa/',
    reason: 'Utility interruption notices are not ingested yet (feasibility test pending).',
  },
  water: {
    id: 'water',
    provider: 'IDAAN',
    state: 'unknown',
    verification: 'unavailable',
    officialUrl: 'https://www.idaan.gob.pa/',
    reason: 'IDAAN publishes notices through press and social posts; no adapter yet.',
  },
  metro_l1: {
    id: 'metro_l1',
    provider: 'Metro de Panamá',
    state: 'unknown',
    verification: 'unavailable',
    officialUrl: 'https://www.elmetrodepanama.com/',
    reason: 'Metro de Panamá publishes no GTFS or real-time open data feed.',
  },
  metro_l2: {
    id: 'metro_l2',
    provider: 'Metro de Panamá',
    state: 'unknown',
    verification: 'unavailable',
    officialUrl: 'https://www.elmetrodepanama.com/',
    reason: 'Metro de Panamá publishes no GTFS or real-time open data feed.',
  },
  mibus: {
    id: 'mibus',
    provider: 'MiBus',
    state: 'unknown',
    verification: 'unavailable',
    officialUrl: 'https://www.mibus.com.pa/',
    reason: 'MiBus has no public real-time feed; the only open GTFS is an archived 2016 community dataset.',
  },
};

export const SINAPROC_URL = 'https://www.sinaproc.gob.pa/';

// Corregimientos of the Panamá district (subset used by the report picker).
export const CORREGIMIENTOS = [
  'Ancón', 'Bella Vista', 'Betania', 'Calidonia', 'Curundú', 'El Chorrillo', 'Juan Díaz',
  'Parque Lefevre', 'Pueblo Nuevo', 'Río Abajo', 'San Felipe', 'San Francisco', 'Santa Ana',
  'Tocumen', 'Pedregal', 'Las Cumbres', 'Chilibre', 'Pacora', 'San Martín', '24 de Diciembre',
];
