/* Deterministic regression for the actual quake filtering logic, no Expo runtime required. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync('src/data/seismicView.ts', 'utf8');
const javascript = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleObject = { exports: {} };
new Function('module', 'exports', javascript)(moduleObject, moduleObject.exports);
const { filterQuakes } = moduleObject.exports;
const sourceEvents = [
  { id: 'a', mag: 4.5, time: 100 },
  { id: 'b', mag: 6.1, time: 500 },
  { id: 'c', mag: 5.2, time: 300 },
  { id: 'd', mag: 5, time: 300 },
];
assert.deepEqual(filterQuakes(sourceEvents, 'all').map(e => e.id), ['b', 'c', 'd', 'a']);
assert.deepEqual(filterQuakes(sourceEvents, 5).map(e => e.id), ['b', 'c', 'd']);
assert.deepEqual(filterQuakes(sourceEvents, 6).map(e => e.id), ['b']);
assert.deepEqual(filterQuakes([], 'all'), []);
assert.equal(sourceEvents[0].id, 'a', 'Catalog arrays must not mutate.');
console.log('Seismic selection: deterministic filters and source integrity pass.');
