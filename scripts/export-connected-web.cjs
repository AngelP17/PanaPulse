// Public web builds use the same connected mode and HTTPS API contract as the native beta.
// EXPO_PUBLIC_* values are included in the JavaScript bundle. Never put secrets in them.
const { spawnSync } = require('node:child_process');
if (process.env.EXPO_PUBLIC_APP_MODE && process.env.EXPO_PUBLIC_APP_MODE !== 'connected') {
  throw new Error('The public web beta requires connected mode.');
}
process.env.EXPO_PUBLIC_APP_MODE = 'connected';
require('./check-build-env.cjs');
const result = spawnSync(process.execPath, [require.resolve('expo/bin/cli'), 'export', '-p', 'web', '--clear', ...process.argv.slice(2)], {
  stdio: 'inherit', env: process.env,
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
