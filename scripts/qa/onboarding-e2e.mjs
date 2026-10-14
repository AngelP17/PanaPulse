// WEB-ONLY onboarding flow check (see harness.mjs). Usage: node scripts/qa/onboarding-e2e.mjs /tmp/site
import { baseState, checker, launch, openApp, visible } from './harness.mjs';

const site = process.argv[2] ?? '/tmp/site';
const k = checker('onboarding');
const browser = await launch();

// 1. Fresh install shows onboarding, selection works, completion persists across a reload ("restart").
{
  const { ctx, page, errors, stored } = await openApp(browser, site, { seed: baseState({ onboarded: false, lang: 'es', themePref: 'auto' }) });
  k.ok(await visible(page, 'BIENVENIDO A PANAPULSE'), 'fresh install shows onboarding (ES)');
  await page.getByRole('button', { name: 'Curundú' }).click();
  await page.getByText('English', { exact: true }).first().click();
  await page.waitForTimeout(400);
  k.ok(await visible(page, 'WELCOME TO PANAPULSE'), 'language switches to EN immediately');
  await page.getByRole('button', { name: 'Dark' }).click();
  await page.waitForTimeout(500);
  const mid = await stored();
  k.ok(mid?.area === 'Curundú' && mid.lang === 'en' && mid.themePref === 'dark' && mid.onboarded === false,
    'area/lang/theme saved before completion, onboarding still pending', JSON.stringify(mid));
  await page.getByText('Explore PanaPulse', { exact: true }).first().click();
  await page.waitForTimeout(800);
  k.ok(!(await visible(page, 'WELCOME TO PANAPULSE')), 'completing onboarding leaves the welcome screen');
  const done = await stored();
  k.ok(done?.onboarded === true && done.area === 'Curundú', 'completion + area persisted', JSON.stringify(done));
  await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(2000);
  const after = await stored();
  k.ok(!(await visible(page, 'WELCOME TO PANAPULSE')) && after?.lang === 'en' && after.themePref === 'dark' && after.area === 'Curundú',
    'cold reload keeps EN, dark, Curundú and skips onboarding', JSON.stringify(after));
  k.ok(errors.length === 0, 'no uncaught page errors', errors.join(' | '));
  await ctx.close();
}

// 2. Existing v1 users migrate and bypass onboarding.
{
  const legacy = { 'panapulse.prefs.v1': { lang: 'en', theme: 'dark' } };
  const { ctx, page } = await openApp(browser, site, { seed: null, legacy, locale: 'en-US' });
  k.ok(!(await visible(page, 'WELCOME TO PANAPULSE')) && !(await visible(page, 'BIENVENIDO A PANAPULSE')),
    'legacy v1 prefs migrate and skip onboarding');
  await ctx.close();
}

// 3. Corrupt storage never crashes the app and falls back to onboarding.
{
  const { ctx, page, errors } = await openApp(browser, site, { seed: { version: 2, lang: 123, themePref: 'neon', area: 'Narnia', onboarded: 'yes' } });
  const showsOnboarding = (await visible(page, 'BIENVENIDO A PANAPULSE')) || (await visible(page, 'WELCOME TO PANAPULSE'));
  k.ok(showsOnboarding, 'corrupt stored state falls back to safe defaults (onboarding)');
  k.ok(errors.length === 0, 'no page errors with corrupt storage', errors.join(' | '));
  await ctx.close();
}

await browser.close();
console.log(k.failed ? `\n${k.failed} check(s) FAILED (web-only harness)` : '\nAll web-only onboarding checks passed. This is not native QA.');
