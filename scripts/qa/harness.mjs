// WEB-ONLY QA harness. Renders the `expo export -p web` build in headless Chromium.
// This is NOT native QA: it cannot verify OS font scaling, safe areas, TalkBack/VoiceOver, haptics or
// real offline radios. Label every capture produced with it as WEB.
//
// Setup (not a repo dependency, install locally):
//   npm i --no-save playwright && npx playwright install chromium
//   npx expo export -p web --output-dir /tmp/site
// Env: PW_MODULE (path to playwright package), CHROME (chromium executable), both optional.
//
// The build is served from disk through request interception: no listening socket is opened,
// and every non-app network request is aborted, so runs are offline-deterministic.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(process.env.PW_MODULE ?? `${process.cwd()}/node_modules/`);
const { chromium } = require('playwright');
const ORIGIN = 'https://panapulse.test';
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.map': 'application/json' };

export const baseState = (over = {}) => ({
  version: 2, lang: 'es', themePref: 'light', area: 'Pueblo Nuevo', onboarded: true, demoEnabled: false,
  demoScenario: 'everyday', commute: { origin: 'Pueblo Nuevo', destination: 'Albrook', saved: true, preferred: 'metro1' },
  reports: [], chat: [], ...over,
});

export async function launch() {
  return chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
}

/**
 * Open the app with seeded storage. `seed` is written once (guarded by a marker) so reloads keep the
 * app's own persisted state, which is exactly what restart-persistence tests need.
 * `legacy` seeds old v1 keys instead of the v2 state to exercise migration.
 */
export async function openApp(browser, site, { seed = null, legacy = null, width = 393, height = 852, scheme = 'light',
  locale = 'es-PA', blockNetwork = true, offline = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, reducedMotion: 'reduce', colorScheme: scheme, locale });
  await ctx.route(`${ORIGIN}/**`, (route) => {
    const u = new URL(route.request().url());
    let f = path.join(site, decodeURIComponent(u.pathname));
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(site, 'index.html');
    route.fulfill({ status: 200, contentType: MIME[path.extname(f)] ?? 'application/octet-stream', body: fs.readFileSync(f) });
  });
  if (blockNetwork) await ctx.route(/^https?:\/\/(?!panapulse\.test)/, (r) => r.abort());
  await ctx.addInitScript(([s, l]) => {
    try {
      if (localStorage.getItem('__seeded')) return;
      if (s) localStorage.setItem('panapulse.state.v2', JSON.stringify(s));
      if (l) for (const [k, v] of Object.entries(l)) localStorage.setItem(k, JSON.stringify(v));
      localStorage.setItem('__seeded', '1');
    } catch { /* storage unavailable */ }
  }, [seed, legacy]);
  const page = await ctx.newPage();
  page.setDefaultTimeout(6000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  await page.goto(`${ORIGIN}/`, { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  if (offline) await ctx.setOffline(true);
  return { ctx, page, errors, stored: () => page.evaluate(() => JSON.parse(localStorage.getItem('panapulse.state.v2') || 'null')) };
}

/** Tiny assertion runner: prints PASS/FAIL per check and sets a non-zero exit code on failure. */
export function checker(name) {
  let failed = 0;
  return {
    ok(cond, label, detail = '') {
      console.log(`${cond ? 'PASS' : 'FAIL'} [${name}] ${label}${!cond && detail ? ` :: ${detail}` : ''}`);
      if (!cond) { failed += 1; process.exitCode = 1; }
    },
    get failed() { return failed; },
  };
}

export const visible = (page, text, opts = {}) => page.getByText(text, { exact: true, ...opts }).first().isVisible().catch(() => false);
