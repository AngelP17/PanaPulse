const assert = require('node:assert/strict');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const ts = require('typescript');

const eas = JSON.parse(fs.readFileSync('eas.json', 'utf8'));
assert.equal(eas.build.preview.android.buildType, 'apk');
assert.equal(eas.build.preview.env.EXPO_PUBLIC_APP_MODE, 'showcase');
assert.equal(eas.build.preview.env.ALLOW_NO_BACKEND, '1');
assert.equal(eas.build.preview.env.EXPO_PUBLIC_API_URL, '');
assert.equal(eas.build['connected-preview'].env.EXPO_PUBLIC_APP_MODE, 'connected');

function check(given, status, label) {
  const env = { ...process.env };
  for (const key of ['ALLOW_NO_BACKEND','EXPO_PUBLIC_APP_MODE','EXPO_PUBLIC_API_URL']) delete env[key];
  Object.assign(env, given);
  const result = spawnSync(process.execPath, ['scripts/check-build-env.cjs'], {env, encoding:'utf8'});
  assert.equal(result.status, status, label + ': ' + result.stdout + ' ' + result.stderr);
}
check(eas.build.preview.env, 0, 'Showcase works without a backend');
check({EXPO_PUBLIC_APP_MODE:'showcase'}, 1, 'Showcase needs explicit offline intent');
check({EXPO_PUBLIC_APP_MODE:'connected', EXPO_PUBLIC_API_URL:'https://api.example.org'}, 0, 'Connected HTTPS origin');
check({EXPO_PUBLIC_APP_MODE:'connected', EXPO_PUBLIC_API_URL:'http://api.example.org'}, 1, 'Reject HTTP');
check({EXPO_PUBLIC_APP_MODE:'connected'}, 1, 'Reject backend-less connected app');
check({EXPO_PUBLIC_APP_MODE:'connected',ALLOW_NO_BACKEND:'1'}, 1, 'Prevent accidental bypass');
check({EXPO_PUBLIC_APP_MODE:'connected',EXPO_PUBLIC_API_URL:'https://user:pw@api.example.org'}, 1, 'Reject embedded credentials');
check({EXPO_PUBLIC_APP_MODE:'connected',EXPO_PUBLIC_API_URL:'https://api.example.org/private'}, 1, 'Reject a path');

const source = fs.readFileSync('src/config/buildMode.ts', 'utf8');
const js = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function config(mode, api) {
  const module = {exports:{}};
  new Function('module','exports','process',js)(module,module.exports,{env:{EXPO_PUBLIC_APP_MODE:mode,EXPO_PUBLIC_API_URL:api}});
  return module.exports;
}
assert.equal(config('showcase','https://api.example.org').API_ORIGIN, '');
assert.equal(config('showcase','https://api.example.org').IS_SHOWCASE_BUILD, true);
assert.equal(config('connected','https://api.example.org/').API_ORIGIN, 'https://api.example.org');
assert.equal(config('connected','https://api.example.org/').IS_SHOWCASE_BUILD, false);
console.log('EAS profiles, explicit offline intent and runtime API separation: passed.');
