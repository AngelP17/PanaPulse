const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const m = { exports: {} };
new Function('module', 'exports', ts.transpileModule(fs.readFileSync('src/data/seismicContract.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(m, m.exports);
const { validateSeismic } = m.exports;
const snapshot = JSON.parse(fs.readFileSync('src/data/usgs_snapshot.json', 'utf8'));
const valid = { ...snapshot, mode: 'snapshot' };
assert.ok(validateSeismic(valid).earthquakes.length);
assert.deepEqual(validateSeismic({ earthquakes: [], forecast: null, fetchedAt: 0, mode: 'snapshot' }).earthquakes, []);
for (const invalid of [null, {}, { ...valid, fetchedAt: Date.now()+3600000 },
  { ...valid, earthquakes: [{ ...valid.earthquakes[0], mag: null }] },
  { ...valid, earthquakes: [{ ...valid.earthquakes[0], lat: 100 }] },
  { ...valid, forecast: { ...valid.forecast, url: 'https://attacker.example/forecast.json' } },
  { ...valid, forecast: { ...valid.forecast, windows: [{ label: 'day', timeStart: 1, timeEnd: 2,
    bins: [{ magnitude: 5, probability: 1.2, median: 0, p95min: 0, p95max: 1 }] }] } },
]) assert.throws(() => validateSeismic(invalid));
console.log('Seismic payload validation: genuine fixture, empty state, corrupt events and forecasts passed.');
