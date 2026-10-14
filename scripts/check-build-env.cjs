/* Keep offline showcase and future connected beta builds separate.
 * Called by EAS's eas-build-pre-install hook. No backend is required for the
 * product UI showcase; it must still truthfully label sources and preview.
 */
const mode = process.env.EXPO_PUBLIC_APP_MODE || 'connected';
const allowNoBackend = process.env.ALLOW_NO_BACKEND === '1';
const configured = (process.env.EXPO_PUBLIC_API_URL || '').trim();

if (mode === 'showcase') {
  if (!allowNoBackend) {
    console.error('Showcase build requires ALLOW_NO_BACKEND=1 (explicit offline intent).');
    process.exit(1);
  }
  console.log('PanaPulse showcase: APK with interactive preview, local reports and USGS direct/snapshot. No own backend required.');
  process.exit(0);
}
if (allowNoBackend) {
  console.error('ALLOW_NO_BACKEND=1 is only permitted in EXPO_PUBLIC_APP_MODE=showcase.');
  process.exit(1);
}
let url;
try { url = new URL(configured); }
catch { /* handled below */ }
if (!url || url.protocol !== 'https:' || !url.hostname || url.username || url.password ||
  (url.pathname !== '' && url.pathname !== '/') || url.search || url.hash) {
  console.error('Connected build requires EXPO_PUBLIC_API_URL as a clean https:// origin. Choose the preview EAS profile for an app-only APK.');
  process.exit(1);
}
console.log('Connected build API origin: ' + url.origin);
