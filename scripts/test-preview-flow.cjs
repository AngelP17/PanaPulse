/** Native code logic regression, no Expo runtime required. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function load(path, mocks = {}) {
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(
    (name) => {
      assert.ok(Object.hasOwn(mocks, name), 'Unexpected module ' + name);
      return mocks[name];
    }, module, module.exports
  );
  return module.exports;
}

const { makeDemoScene } = load('src/data/demo.ts');
const now = Date.UTC(2026, 9, 13, 13, 0);
const everyday = makeDemoScene(now, 'everyday');
const incidents = makeDemoScene(now, 'disruption');
const recovery = makeDemoScene(now, 'recovery');
assert.equal(everyday.power, 'scheduled');
assert.equal(incidents.power, 'interrupted');
assert.equal(recovery.power, 'recovering');
assert.ok(incidents.transit[0].arrivalMinutes > everyday.transit[0].arrivalMinutes);
assert.notEqual(makeDemoScene(now + 60000, 'everyday').transit[0].arrivalMinutes, everyday.transit[0].arrivalMinutes);

const sourcePolicy = load('src/data/sourcePolicy.ts');
const { quickAnswer } = load('src/chat/quick.ts', {
  '../data/sourcePolicy': sourcePolicy,
  '../data/usgs': { bin: () => null },
  '../data/format': {
    clock: (v) => new Date(v).toISOString(),
    dayStamp: (v) => new Date(v).toISOString(),
    pct: (v) => (v * 100).toFixed(1) + '%',
    place: (p) => p,
  },
  '../data/services': {
    CORREGIMIENTOS: ['Pueblo Nuevo'],
    SERVICES: { metro_l1: { officialUrl: 'https://metro.example' },
      mibus: { officialUrl: 'https://mibus.example' },
      water: { officialUrl: 'https://water.example' } },
  },
  '../data/utilities': {
    providerFor: () => ({ provider: 'naturgy', name: 'Naturgy', verified: true }),
    noticesFor: () => [],
  },
});
const usgs = {
  mode: 'snapshot',
  fetchedAt: now - 6 * 3600000,
  earthquakes: [{ id: 'real-usgs-event', mag: 4.8, time: now - 9 * 3600000, place: 'Azuero' }],
  forecast: null,
};
function ask(q, preview = null) {
  return quickAnswer(q, usgs, 'es', 'Pueblo Nuevo', now, preview)?.text;
}
assert.match(ask('¿Cómo está el Metro?', incidents), /Línea 1 llega en/);
assert.doesNotMatch(ask('¿Cómo está el Metro?', incidents), /No tenemos datos/);
assert.match(ask('¿Y MiBus?', incidents), /MiBus llega en/);
assert.match(ask('¿Hay luz en Pueblo Nuevo?', incidents), /interrupción reportada/);
assert.match(ask('¿Hay agua?', recovery), /presión recuperándose/);
assert.match(ask('¿Cuántos reportes?', { ...incidents, communityReports: incidents.communityReports + 1 }), /reportes vecinales/);
assert.match(ask('¿Hubo un sismo?', incidents), /M4.8/);
assert.match(ask('¿Hubo un sismo?', incidents), /histórica/);
assert.match(ask('¿Cómo está el Metro?'), /No tenemos datos/);
console.log('Preview scenario chat, time evolution, report interactions and real-USGS integrity: 14 assertions passed.');

const connectedPower = {
  state: 'scheduled',
  data: {
    corregimiento: 'Pueblo Nuevo',
    service_state: 'unknown',
    scope: 'scheduled_maintenance_only',
    sources: [{ provider: 'naturgy', freshness: 'current', last_success_at: new Date(now - 120000).toISOString() }],
    notices: [{
      id: 'official-notice-1', place: 'Hato Pintado', provider: 'Naturgy',
      start: new Date(now + 3600000).toISOString(),
      end: new Date(now + 4 * 3600000).toISOString(),
      source_url: 'https://example.org/official-maintenance',
      verification: 'official_scheduled', source_freshness: 'current',
    }],
  },
};
const livePower = (q, powerFeed, preview = incidents, lang = 'es') =>
  quickAnswer(q, usgs, lang, 'Pueblo Nuevo', now, preview, powerFeed)?.text;
assert.match(livePower('¿Hay luz en Pueblo Nuevo?', connectedPower), /Hato Pintado/);
assert.match(livePower('¿Hay luz en Pueblo Nuevo?', connectedPower), /cronograma/);
assert.doesNotMatch(livePower('¿Hay luz en Pueblo Nuevo?', connectedPower), /interrupción reportada/);
assert.match(livePower('¿Qué pasa en mi zona?', connectedPower), /avisos oficiales programados/);
assert.match(livePower('¿Hay cortes de luz?', { ...connectedPower, state: 'stale' }), /desactualizados/);
assert.match(livePower('¿Hay luz?', { ...connectedPower, data: { ...connectedPower.data, notices: [] } }), /No hay cortes programados publicados/);
assert.match(livePower('¿Hay luz?', { state: 'none', data: null }, null), /No puedo comprobar/);
assert.match(livePower('¿Hay luz?', { state: 'none', data: null }), /interrupción reportada/);
assert.match(livePower('¿Hay luz?', connectedPower, null), /Hato Pintado/);
assert.match(livePower('¿Hay luz?', connectedPower, incidents, 'en'), /scheduled-maintenance/);
// One selector for Home, Services and Ask: the visible power source must agree on every state.
const { powerSurfaceSource } = sourcePolicy;
for (const [state, data, expectKind] of [['scheduled', connectedPower.data, 'official'], ['stale', connectedPower.data, 'stale'], ['none', null, null]]) {
  for (const previewOn of [false, true]) {
    const surface = powerSurfaceSource(state, previewOn);
    const text = quickAnswer('¿Hay luz en Pueblo Nuevo?', usgs, 'es', 'Pueblo Nuevo', now, previewOn ? incidents : null, { state, data });
    if (expectKind) {
      assert.equal(surface, expectKind);
      assert.match(text.text ?? text, /Hato Pintado/, `Ask must show the real ${state} notice (preview ${previewOn}).`);
    } else {
      assert.equal(surface, previewOn ? 'example' : 'missing');
      assert.match(text.text ?? text, previewOn ? /interrupción reportada/ : /No puedo comprobar/);
    }
  }
}
console.log('Official maintenance beats preview incidents; stale and unavailable source states stay distinct.');
