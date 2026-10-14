/** Reports activity rules: live mode shows only the user's device reports; preview adds labeled examples; filters. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(path, mocks = {}) {
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)((n) => { assert.ok(Object.hasOwn(mocks, n), 'Unexpected module ' + n); return mocks[n]; }, module, module.exports);
  return module.exports;
}
const neighborhood = load('src/data/neighborhood.ts');
const v = load('src/data/reportsView.ts', { './neighborhood': neighborhood });
const now = Date.UTC(2026, 9, 13, 15, 0);
const mk = (id, scope, area, service, at) => ({ id, service, corregimiento: area, note: 'n' + id, at, origin: 'local', scope });
const local = [mk('a', 'device', 'Pueblo Nuevo', 'water', now - 1000), mk('b', 'preview', 'Betania', 'electricity', now - 500), mk('c', 'device', 'Betania', 'electricity', now - 3000)];

// live: no examples, no preview-written text, newest first
const live = v.activityFeed({ previewOn: false, now, scenario: 'disruption', exampleCount: 6, area: 'Pueblo Nuevo', local });
assert.deepEqual(live.map((r) => r.id), ['a', 'c']);
assert.ok(live.every((r) => r.origin === 'local'));
assert.deepEqual(v.activityFeed({ previewOn: false, now, scenario: 'everyday', exampleCount: 6, area: 'Pueblo Nuevo', local: [] }), []);

// preview: examples are marked, local ones keep their own origin, all sorted newest first
const prev = v.activityFeed({ previewOn: true, now, scenario: 'disruption', exampleCount: 6, area: 'Pueblo Nuevo', local });
assert.equal(prev.filter((r) => r.origin === 'example').length, 6);
assert.ok(prev.some((r) => r.id === 'b'));
for (let i = 1; i < prev.length; i++) assert.ok(prev[i - 1].at >= prev[i].at);

// filters
const mine = v.filterActivity(prev, 'all', 'area', 'Pueblo Nuevo');
assert.ok(mine.every((r) => r.corregimiento === 'Pueblo Nuevo'));
const water = v.filterActivity(prev, 'water', 'city', 'Pueblo Nuevo');
assert.ok(water.length > 0 && water.every((r) => r.service === 'water'));
assert.equal(v.filterActivity(prev, 'all', 'city', 'Pueblo Nuevo').length, prev.length);
console.log('Reports view: live honesty, preview labeling, ordering and filters pass.');
