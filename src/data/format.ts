import { format, Lang, strings } from '../i18n/strings';

// Panama is UTC-5 all year (no DST), so we format by offset instead of relying on
// Intl time-zone support, which varies across Hermes builds.
const PANAMA_OFFSET_MS = -5 * 3600 * 1000;

const MONTHS: Record<Lang, string[]> = {
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};
const MONTHS_LONG: Record<Lang, string[]> = {
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
const DAYS: Record<Lang, string[]> = {
  es: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

function local(ms: number): Date {
  return new Date(ms + PANAMA_OFFSET_MS); // read with getUTC* only
}

export function clock(ms: number, lang: Lang): string {
  const d = local(ms);
  let h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  const pm = h >= 12;
  h = h % 12 || 12;
  return lang === 'es' ? `${h}:${m} ${pm ? 'p. m.' : 'a. m.'}` : `${h}:${m} ${pm ? 'PM' : 'AM'}`;
}

export function shortDate(ms: number, lang: Lang): string {
  const d = local(ms);
  return lang === 'es'
    ? `${d.getUTCDate()} ${MONTHS[lang][d.getUTCMonth()]}`
    : `${MONTHS[lang][d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export function longDate(ms: number, lang: Lang): string {
  const d = local(ms);
  return lang === 'es'
    ? `${d.getUTCDate()} de ${MONTHS_LONG[lang][d.getUTCMonth()]}`
    : `${MONTHS_LONG[lang][d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export function dayStamp(ms: number, lang: Lang): string {
  const d = local(ms);
  return `${DAYS[lang][d.getUTCDay()]} ${shortDate(ms, lang)}, ${clock(ms, lang)}`;
}

export function dayKey(ms: number): string {
  const d = local(ms);
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

export function dayLabel(ms: number, now: number, lang: Lang): string {
  if (dayKey(ms) === dayKey(now)) return strings[lang].today;
  if (dayKey(ms) === dayKey(now - 86400000)) return strings[lang].yesterday;
  const d = local(ms);
  const day = DAYS[lang][d.getUTCDay()];
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} ${shortDate(ms, lang)}`;
}

export function ago(ms: number, now: number, lang: Lang): string {
  const t = strings[lang];
  const min = Math.max(0, Math.round((now - ms) / 60000));
  if (min < 1) return t.justNow;
  if (min < 60) return format(t.agoMin, { n: min });
  const h = Math.round(min / 60);
  if (h < 48) return format(t.agoHour, { n: h });
  return format(t.agoDay, { n: Math.round(h / 24) });
}

export function pct(p: number): string {
  const v = p * 100;
  if (v >= 99.9) return '>99%';
  if (v < 1) return `${v.toFixed(1)}%`;
  return `${v < 10 ? v.toFixed(1) : Math.round(v)}%`;
}

const DIR_ES: Record<string, string> = {
  N: 'N', NNE: 'NNE', NE: 'NE', ENE: 'ENE', E: 'E', ESE: 'ESE', SE: 'SE', SSE: 'SSE',
  S: 'S', SSW: 'SSO', SW: 'SO', WSW: 'OSO', W: 'O', WNW: 'ONO', NW: 'NO', NNW: 'NNO',
};

/** USGS writes places as "12 km WSW of Pitaloza Arriba, Panama". Localize the pattern. */
export function place(raw: string, lang: Lang): string {
  const m = raw.match(/^(\d+) km ([NSEW]{1,3}) of (.+?)(?:, Panama)?$/);
  if (!m) return raw.replace(/, Panama$/, '');
  const [, km, dir, town] = m;
  if (lang === 'en') return `${km} km ${dir} of ${town}`;
  return km === '0' ? `En ${town}` : `${km} km al ${DIR_ES[dir] ?? dir} de ${town}`;
}
