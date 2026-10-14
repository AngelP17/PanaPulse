// WEB-ONLY functional flow checks (see harness.mjs). English UI for stable labels.
// Usage: node scripts/qa/flows-e2e.mjs /tmp/site
// Covers: Ask without a server, preview scenario coherence + persistence, local reports (preview vs device
// scope), saved commute persistence, clear-local-activity preservation, stale-USGS honesty, offline start.
// NOT native QA: no OS font scale, safe areas, screen reader, haptics or real connectivity changes.
import { baseState, checker, launch, openApp, visible } from './harness.mjs';

const site = process.argv[2] ?? '/tmp/site';
const k = checker('flows');
const browser = await launch();
const en = (over = {}) => baseState({ lang: 'en', themePref: 'light', ...over });
const tab = (page, name) => page.getByRole('tab', { name }).first().click();
const btn = (page, name) => page.getByRole('button', { name }).first().click();
const radio = (page, name) => page.getByRole('radio', { name }).first().click();
const has = async (page, re) => (await page.locator('body').innerText()).match(re) !== null;
const settle = (page, ms = 600) => page.waitForTimeout(ms);

// ---------------------------------------------------------------- Ask works on-device (no server)
{
  const { ctx, page, errors } = await openApp(browser, site, { seed: en(), locale: 'en-US' });
  await btn(page, 'Ask'); await settle(page);
  const body = await page.locator('body').innerText();
  k.ok(!/EXPO_PUBLIC|PANAPULSE_API/i.test(body), 'Ask never shows developer env names');
  k.ok(/answers on your phone/i.test(body), 'Ask scope line says answers are computed on the phone (no fake model name)', body.slice(0, 160));
  k.ok(!/claude-haiku/i.test(body), 'no model name shown when no model is used');
  k.ok(!/Previously saved answer/i.test(body), 'intro greeting is not labelled as a saved answer');
  const suggestion = page.getByRole('button', { name: 'What was the strongest quake today?' });
  k.ok(await suggestion.isEnabled().catch(() => false), 'live-mode suggestions are enabled without a server');
  await suggestion.click().catch(() => {}); await settle(page, 1200);
  const after = await page.locator('body').innerText();
  k.ok(!/needs a connected assistant|isn't available here/i.test(after) && after.length > body.length,
    'quick on-device answer appears for a suggestion', after.slice(-220));
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem('panapulse.state.v2') || '{}'));
  k.ok(st.chat?.length === 2 && st.chat[1].role === 'assistant' && st.chat[1].context === 'real',
    'chat turns saved with real context', JSON.stringify(st.chat?.map((t) => [t.role, t.context])));
  await page.getByPlaceholder('Ask PanaPulse').fill('Tell me a joke about cats').catch(() => {});
  await page.keyboard.press('Enter'); await settle(page, 900);
  const open = await page.locator('body').innerText();
  k.ok(/needs a connected assistant/i.test(open) && !/EXPO_PUBLIC/.test(open), 'open-ended question gets an honest, user-facing limit message');
  k.ok(errors.length === 0, 'no page errors in Ask', errors.join(' | '));
  await ctx.close();
}

// ---------------------------------------------------------------- Preview scenarios stay coherent
{
  const { ctx, page, stored } = await openApp(browser, site, { seed: en({ demoEnabled: true, demoScenario: 'everyday' }), locale: 'en-US' });
  await tab(page, 'Home'); await settle(page);
  await page.getByRole('button', { name: 'Disruptions' }).first().click(); await settle(page);
  k.ok(await has(page, /Reported interruption|Power interruption/), 'Home shows the disruption scenario');
  await page.getByText('View services', { exact: true }).first().click(); await settle(page);
  k.ok(await has(page, /Reported interruption/), 'Services shows the same disruption scenario');
  await btn(page, 'Recovery'); await settle(page);
  k.ok(await has(page, /Restoration in progress/), 'switching to Recovery updates Services');
  await tab(page, 'Home'); await settle(page);
  k.ok(await has(page, /Restoration in progress|Power restored|Recovery/), 'Home follows the same scenario');
  k.ok((await stored())?.demoScenario === 'recovery', 'scenario persisted');
  await page.reload({ waitUntil: 'load' }); await settle(page, 2000);
  k.ok((await stored())?.demoScenario === 'recovery' && (await has(page, /Preview · Recovery|Preview/i)), 'scenario + preview indicator survive a restart');
  const text = await page.locator('body').innerText();
  k.ok((text.match(/Preview/g) ?? []).length >= 1, 'a persistent preview indicator is visible');
  await ctx.close();
}

// ---------------------------------------------------------------- Reports: create, scope, delete
{
  const { ctx, page, stored } = await openApp(browser, site, { seed: en({ demoEnabled: true }), locale: 'en-US' });
  await tab(page, 'Reports'); await settle(page);
  await radio(page, 'New report'); await settle(page);
  await radio(page, /Water/);
  await page.getByLabel('Note (optional)').fill('QA preview note');
  await btn(page, 'Save report'); await settle(page, 900);
  const s1 = await stored();
  k.ok(s1?.reports?.length === 1 && s1.reports[0].scope === 'preview' && s1.reports[0].origin === 'local',
    'preview report is saved locally with preview scope', JSON.stringify(s1?.reports));
  k.ok(await has(page, /Report saved/), 'saving confirms visibly');
  await page.reload({ waitUntil: 'load' }); await settle(page, 2000);
  k.ok((await stored())?.reports?.length === 1, 'report survives restart');
  // Turn preview off: the preview-scoped report must not appear as a real/device report.
  await btn(page, 'Settings'); await settle(page);
  await radio(page, 'Disabled'); await settle(page);
  await tab(page, 'Reports'); await settle(page);
  k.ok(!(await has(page, /QA preview note/)), 'preview report does not leak into live mode');
  await ctx.close();
}

// ---------------------------------------------------------------- Saved commute persists and syncs Home
{
  const { ctx, page, stored } = await openApp(browser, site, { seed: en({ demoEnabled: true }), locale: 'en-US' });
  await tab(page, 'Transit'); await settle(page);
  await btn(page, 'Remove commute'); await settle(page);
  k.ok((await stored())?.commute?.saved === false, 'commute removal saved');
  await tab(page, 'Home'); await settle(page);
  k.ok(await has(page, /Save this commute to see it on Home/), 'Home reflects the removed commute');
  await page.reload({ waitUntil: 'load' }); await settle(page, 2000);
  k.ok((await stored())?.commute?.saved === false, 'removed commute survives restart');
  await ctx.close();
}

// ---------------------------------------------------------------- Clear activity keeps preferences
{
  const reports = [{ id: 'r1', service: 'water', corregimiento: 'Pueblo Nuevo', note: 'x', at: Date.now() - 60000, origin: 'local', scope: 'device' }];
  const chat = [{ role: 'user', content: 'hi', at: Date.now() - 1000, context: 'real' }, { role: 'assistant', content: 'hello', at: Date.now(), context: 'real' }];
  const { ctx, page, stored } = await openApp(browser, site, { seed: en({ area: 'Curundú', themePref: 'dark', reports, chat }), scheme: 'dark', locale: 'en-US' });
  await btn(page, 'Settings'); await settle(page);
  let dialogs = 0;
  page.on('dialog', async (d) => { dialogs += 1; await d.dismiss(); });
  await btn(page, 'Clear reports and activity'); await settle(page);
  k.ok(dialogs === 1 && (await stored())?.reports?.length === 1, 'cancelling the confirmation deletes nothing');
  page.removeAllListeners('dialog');
  page.on('dialog', async (d) => { await d.accept(); });
  await btn(page, 'Clear reports and activity'); await settle(page, 900);
  const s = await stored();
  k.ok(s.reports.length === 0 && s.chat.length === 0, 'confirmed clear removes reports and chat');
  k.ok(s.area === 'Curundú' && s.lang === 'en' && s.themePref === 'dark' && s.onboarded === true, 'area, language, theme and onboarding preserved', JSON.stringify(s));
  await ctx.close();
}

// ---------------------------------------------------------------- Stale USGS is never an all-clear (offline start)
{
  const { ctx, page, errors } = await openApp(browser, site, { seed: en(), locale: 'en-US', offline: true });
  await tab(page, 'Home'); await settle(page);
  const body = await page.locator('body').innerText();
  k.ok(/No recent update/i.test(body) && /Stale|Outdated/i.test(body), 'offline/stale USGS shows a stale hero, not an all-clear', body.slice(0, 260));
  k.ok(!/all clear|everything normal|no earthquakes/i.test(body), 'no reassuring all-clear language');
  k.ok(/No live data|not connected|Water|Metro/i.test(body), 'unavailable feeds are named');
  k.ok(errors.length === 0, 'no page errors offline', errors.join(' | '));
  await ctx.close();
}

await browser.close();
console.log(k.failed ? `\n${k.failed} check(s) FAILED (web-only harness)` : '\nAll web-only flow checks passed. This is not native QA.');
