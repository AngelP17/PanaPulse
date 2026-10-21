// Real HTTP integration: Expo web -> FastAPI -> isolated SQLite. No route mocks.
// Native permissions, accessibility and packaging require separate device QA.
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const require = createRequire(process.env.PW_MODULE ?? `${process.cwd()}/node_modules/`);
const { chromium } = require('playwright');
const origin = process.env.QA_ORIGIN || 'http://127.0.0.1:8081';
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const errors = [];
try {
  const context = await browser.newContext({ viewport: { width: 393, height: 852 }, locale: 'es-PA' });
  await context.addInitScript(() => {
    if (!localStorage.getItem('panapulse.state.v2')) localStorage.setItem('panapulse.state.v2', JSON.stringify({
      version: 2, lang: 'es', themePref: 'light', area: 'Pueblo Nuevo', onboarded: true,
      demoEnabled: true, demoScenario: 'disruption', reports: [], chat: [],
      commute: { origin: 'Pueblo Nuevo', destination: 'Albrook', preferred: 'metro1', saved: false },
    }));
  });
  const page = await context.newPage();
  let lastSubmission;
  page.on('request', req => { if (req.method() === 'POST' && req.url().endsWith('/v0/community/reports')) lastSubmission = req.postDataJSON(); });
  page.setDefaultTimeout(15000);
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(origin);
  assert.match(await page.title(), /PanaPulse/);
  await page.getByRole('tab', { name: 'Inicio', exact: true }).waitFor();
  assert.equal(await page.getByText(/VISTA PREVIA ·/).count(), 0, 'connected build must ignore old preview preference');
  await page.getByRole('tab', { name: 'Reportes', exact: true }).click();
  await page.getByRole('button', { name: 'Enviar reporte anónimo', exact: true }).click();
  await page.getByText('El servidor recibió tu reporte. Sigue siendo una observación sin verificar.', { exact: true }).waitFor();
  if (process.env.QA_SCREENSHOTS) {
    await fs.mkdir(process.env.QA_SCREENSHOTS, { recursive: true });
    await page.getByRole('button', { name: 'Retirar y eliminar reporte', exact: true }).first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${process.env.QA_SCREENSHOTS}/report-confirmed-WEB393.png` });
  }
  await page.reload();
  await page.getByRole('tab', { name: 'Reportes', exact: true }).click();
  await page.getByRole('button', { name: 'Retirar y eliminar reporte', exact: true }).first().waitFor();
  await page.getByRole('button', { name: 'Retirar y eliminar reporte', exact: true }).first().click();
  await page.getByText('Todavía no hay reportes enviados desde esta instalación.', { exact: true }).waitFor();
  // A delayed retry after withdrawal must clear pending state, never recreate the report.
  await page.evaluate(body => {
    const identityKey = Object.keys(localStorage).find(k => k.startsWith('panapulse.community.v1:') && k.endsWith(':identity'));
    localStorage.setItem(identityKey.replace(/:identity$/, ':pending'), JSON.stringify(body));
  }, lastSubmission);
  await page.reload();
  await page.getByRole('tab', { name: 'Reportes', exact: true }).click();
  await page.getByRole('button', { name: 'Reintentar el mismo reporte', exact: true }).click();
  await page.getByText('Este reporte ya fue retirado y no se volvió a enviar.', { exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Retirar y eliminar reporte', exact: true }).count(), 0);
  // An offline click must never display a successful submission. Retry keeps its request UUID.
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Enviar reporte anónimo', exact: true }).click();
  await page.getByRole('button', { name: 'Reintentar el mismo reporte', exact: true }).waitFor();
  assert.equal(await page.getByText('El servidor recibió tu reporte. Sigue siendo una observación sin verificar.', { exact: true }).count(), 0);
  const pending = await page.evaluate(() => Object.keys(localStorage).filter(k => k.endsWith(':pending')).map(k => localStorage.getItem(k)));
  assert.equal(pending.length, 1);
  await context.setOffline(false);
  await page.reload();
  await page.getByRole('tab', { name: 'Reportes', exact: true }).click();
  await page.getByRole('button', { name: 'Reintentar el mismo reporte', exact: true }).click();
  await page.getByText('El servidor recibió tu reporte. Sigue siendo una observación sin verificar.', { exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Retirar y eliminar reporte', exact: true }).count(), 1);
  await page.getByRole('button', { name: 'Retirar y eliminar reporte', exact: true }).click();
  await page.getByText('Todavía no hay reportes enviados desde esta instalación.', { exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log('Connected E2E passed: real HTTP submission, restart, withdrawal, withdrawn retry, offline pending, retry, preview disabled. WEB ONLY.');
} finally { await browser.close(); }
