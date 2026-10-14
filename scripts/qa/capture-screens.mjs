// WEB-ONLY screen capture + smoke walk. Usage:
//   node scripts/qa/capture-screens.mjs <siteDir> <outDir> [--width 393] [--langs es,en] [--themes light,dark] [--preview off,on]
// Visits every tab, records page errors and saves one PNG per screen. Not native QA:
// every file name ends in _WEB<width> so a detached image can't pass as an Android/iOS capture.
import { baseState, launch, openApp } from './harness.mjs';
import fs from 'fs';

const [site, out] = process.argv.slice(2);
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const width = +arg('width', 393);
const langs = arg('langs', 'es,en').split(',');
const themes = arg('themes', 'light,dark').split(',');
const previews = arg('preview', 'off,on').split(',');
fs.mkdirSync(out, { recursive: true });

const L = {
  es: { home: 'Inicio', mobility: 'Movilidad', quakes: 'Sismos', report: 'Reportes', ask: 'Preguntar', settings: 'Ajustes', services: 'Ver servicios' },
  en: { home: 'Home', mobility: 'Transit', quakes: 'Quakes', report: 'Reports', ask: 'Ask', settings: 'Settings', services: 'View services' },
};
const browser = await launch();
let problems = 0;
for (const lang of langs) for (const theme of themes) for (const pv of previews) {
  const seed = baseState({ lang, themePref: theme, demoEnabled: pv === 'on' });
  const { ctx, page, errors } = await openApp(browser, site, { seed, width, scheme: theme, locale: lang === 'es' ? 'es-PA' : 'en-US' });
  const tag = `${lang}_${theme}_preview-${pv}`;
  const shot = async (name) => { await page.waitForTimeout(450); await page.screenshot({ path: `${out}/${name}_${tag}_WEB${width}.png` }); };
  const tab = async (label) => page.getByRole('tab', { name: label }).first().click();
  const btn = async (label) => page.getByRole('button', { name: label }).first().click();
  const steps = [
    ['home', async () => tab(L[lang].home)],
    ['services', async () => { await tab(L[lang].home); await page.getByText(L[lang].services, { exact: true }).first().click(); }],
    ['mobility', async () => tab(L[lang].mobility)],
    ['quakes', async () => tab(L[lang].quakes)],
    ['reports', async () => tab(L[lang].report)],
    ['ask', async () => btn(L[lang].ask)],
    ['settings', async () => btn(L[lang].settings)],
  ];
  for (const [name, go] of steps) {
    try { await go(); await shot(name); } catch (e) { problems += 1; console.log(`FAIL ${tag} ${name}: ${String(e).split('\n')[0].slice(0, 120)}`); }
  }
  if (errors.length) { problems += 1; console.log(`PAGE ERRORS ${tag}:`, errors.slice(0, 3)); }
  else console.log(`ok ${tag}`);
  await ctx.close();
}
await browser.close();
console.log(problems ? `${problems} problem(s)` : 'walk complete, no failures (web only)');
process.exitCode = problems ? 1 : 0;
