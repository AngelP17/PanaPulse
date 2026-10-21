// Instant answers for the most common questions. Computed straight from app data:
// no model call, zero cost, can't hallucinate. Anything that doesn't match falls through to the model.
import { bin, SeismicData } from '../data/usgs';
import { clock, dayStamp, pct, place } from '../data/format';
import { CORREGIMIENTOS, SERVICES } from '../data/services';
import { providerFor } from '../data/utilities';
import type { MaintenanceResult, PowerFeedState } from '../data/maintenance';
import type { Lang } from '../i18n/strings';
import type { DemoScene } from '../data/demo';
import { powerSurfaceSource } from '../data/sourcePolicy';

export interface QuickAnswer {
  text: string;
  intent: string;
}

export interface PowerChatContext {
  data: MaintenanceResult | null;
  state: PowerFeedState;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[¿?¡!.,]/g, ' ');

const has = (s: string, re: RegExp) => re.test(s);

const QUAKE = /\b(sismo|sismos|temblor|temblores|terremoto|quake|quakes|earthquake|earthquakes)\b/;
const STRONG = /\b(fuerte|fuertes|grande|mayor|strongest|biggest|largest|strong)\b/;
const FORECAST = /\b(replica|replicas|aftershock|aftershocks|probab\w*|chance|odds|pronostico|forecast|otro sismo|another)\b/;
const COUNT = /\b(cuantos|cuantas|how many)\b/;
const METRO = /\b(metro|linea 1|linea 2|line 1|line 2|l1|l2)\b/;
const BUS = /\b(mibus|metrobus|bus|buses)\b/;
const POWER = /\b(luz|electricidad|apagon|apagones|corte de luz|power|electricity|outage|blackout|naturgy|ensa|edemet)\b/;
const WATER = /\b(agua|idaan|water)\b/;
const REPORT = /\b(reportar|reporto|reportes|reporte|reports|reporting|report)\b/;

/** Read-only, source-backed scheduled interruptions. Never reports actual power availability. */
function officialMaintenanceAnswer(source: PowerChatContext | undefined, zone: string, lang: Lang): QuickAnswer | null {
  if (!source?.data || source.state === 'none' || norm(source.data.corregimiento).trim() !== norm(zone).trim()) return null;
  const es = lang === 'es';
  const stale = source.state === 'stale';
  const notices = [...source.data.notices].sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  const providers = source.data.sources.map((s) => s.provider === 'ensa' ? 'ENSA' : 'Naturgy').join(' / ');
  const timestamps = source.data.sources.map((s) => s.last_success_at).filter((s): s is string => !!s);
  const last = timestamps.length ? dayStamp(Math.min(...timestamps.map((v) => Date.parse(v))), lang) : null;
  const basis = es
    ? `Fuente: cronograma de ${providers || 'distribuidora'}${last ? `, consultado ${last}` : ''}.`
    : `Source: ${providers || 'utility'} maintenance schedule${last ? `, last checked ${last}` : ''}.`;
  const limit = es
    ? 'Esto solo cubre cortes programados y NO confirma si tienes luz ahora.'
    : 'This covers scheduled interruptions only and does NOT confirm electricity is on now.';
  const caveat = stale
    ? (es ? 'Los datos oficiales están desactualizados. ' : 'The official data is outdated. ')
    : '';
  if (!notices.length) {
    return {
      intent: 'official-power-schedule',
      text: es
        ? `${zone}: ${caveat}No hay cortes programados publicados en el último cronograma consultado. ${basis} ${limit}`
        : `${zone}: ${caveat}No scheduled cuts were listed in the last retrieved schedule. ${basis} ${limit}`,
    };
  }
  const first = notices[0];
  const starts = Date.parse(first.start);
  const ends = Date.parse(first.end);
  const window = `${dayStamp(starts, lang)} – ${clock(ends, lang)}`;
  return {
    intent: 'official-power-schedule',
    text: es
      ? `${zone}: ${caveat}${notices.length} aviso(s) oficiales de mantenimiento programado. Próximo: ${first.place}, ${window}. ${basis} ${limit} Detalles: ${first.source_url}`
      : `${zone}: ${caveat}${notices.length} official scheduled-maintenance notice(s). Next: ${first.place}, ${window}. ${basis} ${limit} Details: ${first.source_url}`,
  };
}

/** The corregimiento named in the question, else the user's saved zone. */
function zoneIn(q: string, fallback: string): string {
  return CORREGIMIENTOS.find((z) => q.includes(norm(z).trim())) ?? fallback;
}

export function quickAnswer(question: string, data: SeismicData, lang: Lang, zone = 'Pueblo Nuevo', now = Date.now(), preview: DemoScene | null = null, powerFeed?: PowerChatContext): QuickAnswer | null {
  const q = norm(question);
  const es = lang === 'es';
  const asOf = data.fetchedAt ? dayStamp(data.fetchedAt, lang) : (lang === 'es' ? 'sin datos recibidos' : 'no data received');
  const day = data.earthquakes.filter((e) => e.time >= data.fetchedAt - 24 * 3600 * 1000);
  const archived = data.mode !== 'live' || now - data.fetchedAt > 20 * 60 * 1000;
  // One shared decision with Home and Services: a real current or stale feed is always what Ask reports.
  const powerSurface = powerSurfaceSource(powerFeed?.state ?? 'none', preview !== null);
  const powerAnswer = powerSurface === 'official' || powerSurface === 'stale'
    ? officialMaintenanceAnswer(powerFeed, zoneIn(q, zone), lang)
    : null;

  // The preview is a complete, deterministic product walkthrough. These are NEVER official conditions.
  // Real USGS earthquake/forecast questions intentionally continue below unchanged.
  if (preview && !has(q, QUAKE) && !has(q, FORECAST)) {
    const power = preview.power === 'interrupted' ? es ? 'interrupción reportada' : 'reported interruption'
      : preview.power === 'recovering' ? es ? 'restablecimiento en curso' : 'restoration in progress'
      : es ? 'mantenimiento previsto' : 'scheduled maintenance';
    const water = preview.water === 'interrupted' ? es ? 'baja presión' : 'low pressure'
      : preview.water === 'recovering' ? es ? 'presión recuperándose' : 'pressure recovering'
      : es ? 'servicio habitual' : 'regular service';
    const transit = preview.transit[0].condition === 'delayed' ? es ? 'Hay demoras en la ruta.' : 'The route has delays.'
      : preview.transit[0].condition === 'recovering' ? es ? 'El servicio se está recuperando.' : 'Service is recovering.'
      : es ? 'La ruta circula con horario habitual.' : 'The route is running on its regular schedule.';
    let text: string;
    let intent = 'preview-summary';
  if (has(q, METRO)) {
      intent = 'preview-metro';
      text = es ? `En esta vista previa, la Línea 1 llega en ${preview.transit[0].arrivalMinutes} min y la Línea 2 en ${preview.transit[1].arrivalMinutes} min. ${transit}`
        : `In this preview, Line 1 arrives in ${preview.transit[0].arrivalMinutes} min and Line 2 in ${preview.transit[1].arrivalMinutes} min. ${transit}`;
    } else if (has(q, BUS)) {
      intent = 'preview-bus';
      text = es ? `En esta vista previa, MiBus llega en ${preview.transit[2].arrivalMinutes} min. ${transit}`
        : `In this preview, MiBus arrives in ${preview.transit[2].arrivalMinutes} min. ${transit}`;
    } else if (has(q, POWER)) {
      if (powerAnswer) return powerAnswer;
      intent = 'preview-power';
      text = es ? `En el escenario de ${zone}: ${power}. Abre Servicios para ver más.`
        : `In the ${zone} scenario: ${power}. Open Services for more detail.`;
    } else if (has(q, WATER)) {
      intent = 'preview-water';
      text = es ? `En el escenario actual de ${zone}: ${water}. Encontrarás más en Servicios.`
        : `In the current ${zone} scenario: ${water}. See Services for details.`;
    } else if (has(q, REPORT)) {
      intent = 'preview-reports';
      text = es ? `Hay ${preview.communityReports} reportes vecinales en este escenario. Puedes agregar uno en Reportes.`
        : `There are ${preview.communityReports} neighborhood reports in this scenario. Add one in Reports.`;
    } else {
      const summaryPower = powerAnswer
        ? (es ? 'avisos oficiales programados disponibles' : 'official scheduled notices available')
        : power;
      text = es ? `En esta vista previa de ${zone}: luz, ${summaryPower}; agua, ${water}; Línea 1 en ${preview.transit[0].arrivalMinutes} min. Pregúntame por un servicio o consulta Sismos para ver datos reales del USGS.`
        : `In the ${zone} preview: power, ${summaryPower}; water, ${water}; Line 1 in ${preview.transit[0].arrivalMinutes} min. Ask about a service or open Quakes for real USGS data.`;
    }
    return { text, intent };
  }

  // Forecast first: "¿qué tan probable es otra réplica fuerte?" mentions "fuerte" too.
  if (has(q, FORECAST) && data.forecast) {
    const w6 = bin(data.forecast, '1 Week', 6);
    const d6 = bin(data.forecast, '1 Day', 6);
    const w7 = bin(data.forecast, '1 Week', 7);
    if (w6 && d6 && w7) {
      const issued = dayStamp(data.forecast.creationTime, lang);
      return {
        intent: 'forecast',
        text: archived
          ? (es
            ? `Pronóstico histórico del USGS emitido el ${issued}: M6+ ${pct(w6.probability)} para la semana siguiente a esa emisión y ${pct(d6.probability)} para sus primeras 24 h. Estos periodos son históricos; no describen el riesgo de hoy.`
            : `Historical USGS forecast issued ${issued}: M6+ ${pct(w6.probability)} for the week following that issue and ${pct(d6.probability)} for its first 24 hours. Those windows are historical, not current risk.`)
          : (es
            ? `Según el USGS (pronóstico del ${issued}): ${pct(w6.probability)} de probabilidad de un M6+ en la próxima semana y ${pct(d6.probability)} en 24 h. Para M7+ en la semana: ${pct(w7.probability)}. Es una probabilidad, no una predicción.`
            : `Per USGS (forecast issued ${issued}): ${pct(w6.probability)} chance of an M6+ in the next week and ${pct(d6.probability)} in 24 hr. M7+ this week: ${pct(w7.probability)}. It's a probability, not a prediction.`),
      };
    }
  }

  if (has(q, QUAKE) && has(q, STRONG)) {
    if (day.length === 0) {
      return {
        intent: 'strongest',
        text: es ? `La captura del USGS del ${asOf} no incluye sismos M4.5+ en sus 24 h anteriores.` : `The USGS dataset captured ${asOf} lists no M4.5+ quakes in its preceding 24 hours.`,
      };
    }
    const top = day.reduce((a, b) => (b.mag > a.mag ? b : a));
    return {
      intent: 'strongest',
      text: es
        ? `El más fuerte en las últimas 24 h fue M${top.mag.toFixed(1)}, ${place(top.place, lang).replace(/^./, (m) => m.toLowerCase())}, a las ${clock(top.time, lang)}. Fuente: USGS, datos al ${asOf}.`
        : `The strongest in the last 24 hr was M${top.mag.toFixed(1)}, ${place(top.place, lang)}, at ${clock(top.time, lang)}. Source: USGS, data as of ${asOf}.`,
    };
  }

  if (has(q, QUAKE) && has(q, COUNT)) {
    return {
      intent: 'count',
      text: es
        ? `${day.length} sismos M4.5+ en las últimas 24 h y ${data.earthquakes.length} desde el 9 de octubre. Fuente: USGS, datos al ${asOf}.`
        : `${day.length} M4.5+ quakes in the last 24 hr and ${data.earthquakes.length} since October 9. Source: USGS, data as of ${asOf}.`,
    };
  }

  if (has(q, QUAKE)) {
    const latest = [...data.earthquakes].sort((a, b) => b.time - a.time)[0];
    return {
      intent: 'latest-quake',
      text: latest
        ? (es
          ? `Último sismo registrado en estos datos: M${latest.mag.toFixed(1)} cerca de ${place(latest.place, lang)}, ${dayStamp(latest.time, lang)}. Fuente: USGS, captura del ${asOf}${archived ? ' (histórica)' : ''}.`
          : `Latest quake in this dataset: M${latest.mag.toFixed(1)} near ${place(latest.place, lang)}, ${dayStamp(latest.time, lang)}. USGS data captured ${asOf}${archived ? ' (historical)' : ''}.`)
        : (es ? `No hay sismos en la captura USGS del ${asOf}.` : `No quakes appear in the USGS dataset from ${asOf}.`),
    };
  }

  if (has(q, METRO)) {
    return {
      intent: 'metro',
      text: es
        ? `No tenemos datos en vivo del Metro: Metro de Panamá no publica un feed abierto. Revisa ${SERVICES.metro_l1.officialUrl} o su cuenta oficial @elmetrodepanama.`
        : `No live Metro data: Metro de Panamá doesn't publish an open feed. Check ${SERVICES.metro_l1.officialUrl} or the official @elmetrodepanama account.`,
    };
  }

  if (has(q, BUS)) {
    return {
      intent: 'mibus',
      text: es
        ? `No tenemos datos en vivo de MiBus todavía. Revisa ${SERVICES.mibus.officialUrl}; sus rutas también aparecen en Google Maps.`
        : `No live MiBus data yet. Check ${SERVICES.mibus.officialUrl}; its routes also appear in Google Maps.`,
    };
  }

  if (has(q, POWER)) {
    if (powerAnswer) return powerAnswer;
    const z = zoneIn(q, zone);
    const p = providerFor(z);
    const name = p.provider === 'border' ? 'ENSA / Naturgy' : p.name;
    return {
      intent: 'power-unavailable',
      text: es
        ? `No puedo comprobar los avisos programados actuales de ${name} para ${z} porque el servidor de fuentes no está disponible. Tampoco puedo confirmar si tienes luz ahora. Consulta el canal oficial de la distribuidora.`
        : `I can't verify current ${name} scheduled-maintenance notices for ${z} because the source backend is unavailable. I also can't confirm that power is on. Check the provider's official channel.`,
    };
  }

  if (has(q, WATER)) {
    return {
      intent: 'water',
      text: es
        ? `Aún no leemos avisos del IDAAN, así que no sabemos si hay cortes de agua en tu zona. Revisa ${SERVICES.water.officialUrl}.`
        : `We don't read IDAAN notices yet, so we can't tell if water is cut in your area. Check ${SERVICES.water.officialUrl}.`,
    };
  }

  if (has(q, REPORT)) {
    return {
      intent: 'report',
      text: es ? 'Ve a la pestaña Reportes, elige luz o agua y tu corregimiento.' : 'Open the Reports tab, pick power or water and your corregimiento.',
    };
  }

  return null;
}
