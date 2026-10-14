const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync('src/data/previewNotices.ts', 'utf8');
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleObject = { exports: {} };
new Function('module', 'exports', code)(moduleObject, moduleObject.exports);
const { previewServiceNotices } = moduleObject.exports;
const now = Date.UTC(2026, 9, 14, 1, 0);
for (const scenario of ['everyday','disruption','recovery']) {
  const list = previewServiceNotices(now, scenario, 'Betania');
  assert.equal(list.length, 2);
  assert.deepEqual(list.map(x => x.service), ['electricity','water']);
  assert.ok(list.every(x => x.origin === 'preview' && x.corregimiento === 'Betania'));
  assert.ok(list.every(x => x.postedAt <= now && x.detail.endsWith('Detail')));
  assert.notDeepEqual(previewServiceNotices(now, scenario, 'Pueblo Nuevo'), list);
}
assert.match(previewServiceNotices(now, 'disruption', 'Betania')[0].headline, /Interrupted/);
assert.match(previewServiceNotices(now, 'recovery', 'Betania')[1].headline, /Recovering/);
console.log('Local service notice scenarios, privacy scope and details: 20+ assertions pass.');
