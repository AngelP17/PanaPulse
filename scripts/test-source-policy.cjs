/* Run with Node after npm ci. Tests the actual TypeScript policy without adding a test framework. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync('src/data/sourcePolicy.ts', 'utf8');
const javascript = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleObject = { exports: {} };
new Function('module', 'exports', javascript)(moduleObject, moduleObject.exports);
const { powerSurfaceSource } = moduleObject.exports;
for (const demoEnabled of [false, true]) {
  assert.equal(powerSurfaceSource('scheduled', demoEnabled), 'official',
    'A current official feed must always win.');
  assert.equal(powerSurfaceSource('stale', demoEnabled), 'stale',
    'Stale sourced information must remain visible with its original age.');
}
assert.equal(powerSurfaceSource('none', false), 'missing');
assert.equal(powerSurfaceSource('none', true), 'example');
console.log('Source-first precedence: 6 combinations passed.');
