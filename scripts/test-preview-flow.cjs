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

const { quickAnswer } = load('src/chat/quick.ts', {
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
