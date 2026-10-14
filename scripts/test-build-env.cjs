const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const guard = path.join(__dirname, 'check-build-env.cjs');
const names = ['EXPO_PUBLIC_APP_MODE','EXPO_PUBLIC_API_URL','ALLOW_NO_BACKEND','EAS_BUILD_PROFILE'];
function check(vars, shouldPass) {
  const env = {...process.env};
  for (const name of names) delete env[name];
  Object.assign(env, vars);
  const run = spawnSync(process.execPath, [guard], {env, encoding:'utf8'});
  assert.equal(run.status === 0, shouldPass,
    JSON.stringify({vars,status:run.status,output:run.stderr}));
}
check({EAS_BUILD_PROFILE:'preview',EXPO_PUBLIC_APP_MODE:'showcase',ALLOW_NO_BACKEND:'1'},true);
check({EAS_BUILD_PROFILE:'preview',EXPO_PUBLIC_APP_MODE:'showcase'},false);
check({EAS_BUILD_PROFILE:'connected',EXPO_PUBLIC_APP_MODE:'connected'},false);
check({EAS_BUILD_PROFILE:'connected',EXPO_PUBLIC_APP_MODE:'connected',EXPO_PUBLIC_API_URL:'http://api.example.org'},false);
check({EAS_BUILD_PROFILE:'connected',EXPO_PUBLIC_APP_MODE:'connected',EXPO_PUBLIC_API_URL:'https://localhost'},false);
check({EAS_BUILD_PROFILE:'connected',EXPO_PUBLIC_APP_MODE:'connected',EXPO_PUBLIC_API_URL:'https://api.example.org/path'},false);
check({EAS_BUILD_PROFILE:'connected',EXPO_PUBLIC_APP_MODE:'connected',EXPO_PUBLIC_API_URL:'https://api.example.org',ALLOW_NO_BACKEND:'1'},false);
check({EAS_BUILD_PROFILE:'connected',EXPO_PUBLIC_APP_MODE:'connected',EXPO_PUBLIC_API_URL:'https://api.example.org'},true);
check({EAS_BUILD_PROFILE:'preview',EXPO_PUBLIC_APP_MODE:'connected',EXPO_PUBLIC_API_URL:'https://api.example.org'},false);
console.log('Standalone/connected APK build guard: 9 cases passed.');
