/** Shared local store: validation, migration, reducer rules and a JSON round trip. No Expo runtime needed. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(path, mocks = {}) {
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)((n) => { assert.ok(Object.hasOwn(mocks, n), 'Unexpected module ' + n); return mocks[n]; }, module, module.exports);
  return module.exports;
}
const services = load('src/data/services.ts');
const neighborhood = load('src/data/neighborhood.ts');
const m = load('src/data/localModel.ts', { './services': services, './neighborhood': neighborhood });
const base = m.defaultState('es', false);

// defaults
assert.equal(base.area, 'Pueblo Nuevo'); assert.equal(base.onboarded, false); assert.equal(base.commute.saved, true);
assert.equal(base.commute.preferred, 'metro1');
// garbage never throws and falls back
for (const junk of [null, 5, 'x', [], { lang: 'fr', area: 'Narnia', demoScenario: 'chaos', reports: 'no', chat: [1, null] }]) {
  const s = m.sanitize(junk, base);
  assert.equal(s.lang, 'es'); assert.equal(s.area, 'Pueblo Nuevo'); assert.equal(s.demoScenario, 'everyday'); assert.deepEqual(s.reports, []); assert.deepEqual(s.chat, []);
}
// area changes move the commute origin and reject unknown areas
let st = m.reduce(base, { type: 'setArea', area: 'Betania' });
assert.equal(st.area, 'Betania'); assert.equal(st.commute.origin, 'Betania');
assert.equal(m.reduce(st, { type: 'setArea', area: 'Narnia' }).area, 'Betania');
// commute save/remove and destination
st = m.reduce(st, { type: 'setCommute', patch: { saved: false } }); assert.equal(st.commute.saved, false);
st = m.reduce(st, { type: 'setCommute', patch: { destination: 'Albrook', origin: 'Narnia' } }); assert.equal(st.commute.origin, 'Betania');
st = m.reduce(st, { type: 'setCommute', patch: { preferred: 'mibus', destination: 'Tocumen' } });
assert.equal(st.commute.preferred, 'mibus'); assert.equal(st.commute.destination, 'Tocumen');
st = m.reduce(st, { type: 'setCommute', patch: { preferred: 'teleportation' } });
assert.equal(st.commute.preferred, 'mibus', 'Invalid route modes must be rejected');
// reports: contact details scrubbed, one corregimiento, cap, scope, delete
st = m.reduce(st, { type: 'addReport', at: 1000, scope: 'preview', input: { service: 'water', corregimiento: 'Betania', note: 'llámame 6123-4567 o a@b.com' } });
assert.doesNotMatch(st.reports[0].note, /6123|@/); assert.equal(st.reports[0].scope, 'preview'); assert.equal(st.reports[0].origin, 'local');
assert.equal(m.reduce(st, { type: 'addReport', at: 1, scope: 'device', input: { service: 'gas', corregimiento: 'Betania', note: '' } }).reports.length, 1);
for (let i = 0; i < 80; i++) st = m.reduce(st, { type: 'addReport', at: 2000 + i, scope: 'device', input: { service: 'electricity', corregimiento: 'Ancón', note: 'n' + i } });
assert.equal(st.reports.length, m.MAX_REPORTS);
const id = st.reports[0].id; st = m.reduce(st, { type: 'removeReport', id }); assert.ok(!st.reports.some((r) => r.id === id));
// chat cap + clear
st = m.reduce(st, { type: 'setChat', turns: Array.from({ length: 50 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'm' + i })) });
assert.equal(st.chat.length, m.MAX_CHAT_TURNS); assert.equal(st.chat.at(-1).content, 'm49');
assert.deepEqual(m.reduce(st, { type: 'clearChat' }).chat, []);
const savedReply = m.reduce(st, { type: 'setChat', turns: [
  { role: 'user', content: 'Metro?', at: 1700000000000, context: 'preview', scenario: 'disruption' },
  { role: 'assistant', content: '12 min', at: 1700000000500, context: 'preview', scenario: 'disruption', quick: true },
] });
assert.equal(savedReply.chat[1].at, 1700000000500);
assert.equal(savedReply.chat[1].context, 'preview');
assert.equal(savedReply.chat[1].scenario, 'disruption');
assert.deepEqual(m.sanitize(JSON.parse(JSON.stringify(savedReply)), base).chat, savedReply.chat);

// persistence round trip survives JSON exactly
st = m.reduce(st, { type: 'setScenario', scenario: 'disruption' }); st = m.reduce(st, { type: 'setLang', lang: 'en' }); st = m.reduce(st, { type: 'completeOnboarding' });
assert.deepEqual(m.sanitize(JSON.parse(JSON.stringify(st)), base), st);
// v1 migration keeps prefs, commute and reports; existing installs skip onboarding; fresh installs do not
const mig = m.migrateLegacy({ lang: 'en', themePref: 'dark', demoEnabled: true, demoScenario: 'recovery', demoCommuteSaved: false },
  [{ service: 'water', corregimiento: 'Ancón', note: 'sin agua', at: 5 }, { service: 'x' }], base);
assert.equal(mig.lang, 'en'); assert.equal(mig.themePref, 'dark'); assert.equal(mig.demoEnabled, true); assert.equal(mig.demoScenario, 'recovery');
assert.equal(mig.commute.saved, false); assert.equal(mig.reports.length, 1); assert.equal(mig.reports[0].scope, 'device'); assert.equal(mig.onboarded, true);
assert.equal(m.migrateLegacy(null, null, base).onboarded, false);
console.log('Local store: defaults, validation, migration, reducer rules and persistence round trip pass.');
