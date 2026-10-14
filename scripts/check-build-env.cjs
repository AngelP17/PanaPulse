/* Android APK build contract: preview is a deliberate standalone product walkthrough.
 * Connected APKs must specify a real HTTPS PanaPulse API origin.
 */
const mode = process.env.EXPO_PUBLIC_APP_MODE || '';
const profile = process.env.EAS_BUILD_PROFILE || '';
const offline = process.env.ALLOW_NO_BACKEND === '1';
const url = (process.env.EXPO_PUBLIC_API_URL || '').trim();
function fail(message) {
  console.error('PanaPulse build: ' + message);
  process.exit(1);
}
if (profile === 'preview' && mode !== 'showcase') fail('preview requires showcase mode');
if (profile === 'connected' && mode !== 'connected') fail('connected requires connected mode');
if (mode === 'showcase') {
  if (!offline) fail('showcase requires explicit ALLOW_NO_BACKEND=1');
  console.warn('SHOWCASE APK: no PanaPulse API; interactive previews available; USGS direct fetch with dated snapshot fallback; no server chat.');
  process.exit(0);
}
if (offline) fail('ALLOW_NO_BACKEND can only be used by the showcase profile');
if (mode && mode !== 'connected') fail('unknown mode: ' + mode);
let parsed;
try { parsed = new URL(url); } catch { fail('connected APK requires a valid HTTPS origin'); }
if (parsed.protocol !== 'https:' || !parsed.hostname ||
    ['localhost','127.0.0.1','0.0.0.0'].includes(parsed.hostname) ||
    parsed.username || parsed.password || parsed.pathname !== '/' ||
    parsed.search || parsed.hash) {
  fail('EXPO_PUBLIC_API_URL must be an HTTPS origin without credentials, path or query');
}
console.log('Connected API: ' + parsed.origin);
