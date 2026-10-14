/* Runs before an EAS build. An APK built without a reachable HTTPS API silently has no live power data or chat. */
const url = (process.env.EXPO_PUBLIC_API_URL || '').trim();
if (process.env.ALLOW_NO_BACKEND === '1') {
  console.warn('ALLOW_NO_BACKEND=1: building an offline-only app (USGS direct + preview; no scheduled power notices, no server chat).');
  process.exit(0);
}
if (!/^https:\/\/[^/]+/.test(url)) {
  console.error('EXPO_PUBLIC_API_URL is missing or not an https:// origin. Set it for this build profile ' +
    '(eas env:create --environment preview, or "env" in eas.json) or set ALLOW_NO_BACKEND=1 to build knowingly without a backend.');
  process.exit(1);
}
console.log('Build API origin: ' + new URL(url).origin);
