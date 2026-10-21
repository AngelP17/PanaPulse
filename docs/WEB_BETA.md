# Browser beta

PanaPulse's web app is the existing Expo / React Native application rendered with React Native Web. It uses the same FastAPI backend, source timestamps and shared-report API as the native beta. Users can open it on a phone or desktop without installing an app.

## Build and host

1. Deploy and verify the persistent FastAPI API and collector first. A static web host does not run the Python collector or store its SQLite database.
2. Set `EXPO_PUBLIC_API_URL` to that API's HTTPS **origin**. It is public configuration, never a secret. Add the exact web origin to backend `PANAPULSE_CORS_ORIGINS` (comma-separated when there is more than one). Do not use `*`.
3. Run `npm ci`, `npm run typecheck`, then `node scripts/export-connected-web.cjs`. The script forces connected mode and rejects missing/HTTP API origins or showcase configuration. Serve the resulting `dist` directory over HTTPS.
4. `vercel.json` supplies an optional static Vercel deployment configuration. It does not choose or provision hosting, create an account, or publish anything. Any HTTPS static host can serve the same output.
5. Confirm the deployed API's readiness and source health, then run the connected browser tests against the **actual deployment**, including a report submit, reload, retry, withdrawal, and source failure. A successful bundle export alone is not a release gate.

Local web development remains `npm run web`. Local integrated QA may export with `EXPO_PUBLIC_APP_MODE=connected EXPO_PUBLIC_API_URL=http://127.0.0.1:8000 npx expo export -p web`. That loopback build must never be published for testers.

## Browser behavior

- The app retains Porcelana, the existing four-tab navigation and one readable content column. Header and navigation align with that column on desktop; touch targets remain usable on phones.
- Destinations have shareable hash URLs: `/#/home`, `/#/mobility`, `/#/quakes`, `/#/report`, `/#/services`, `/#/chat`, and `/#/settings`. Reload, browser back and browser forward preserve the destination. A first-time visitor completes the existing onboarding before opening the requested destination.
- Language and theme preferences are browser-local. The document language and title update with the app. Report ownership is per browser installation; it does not synchronize private receipts with another browser or the native app. The public aggregate comes from the shared backend.
- No service worker caches API responses. The normal app cache retains only previously received, dated seismic records. A fresh browser with no successful API response shows an unavailable state, not bundled example data.
- Web beta is not an installable PWA and does not promise background collection or push notifications. The collector runs on the backend. Reloading offline before the web bundle is cached by the browser is not guaranteed to launch the app.

## Verification boundaries

Run desktop Chrome and mobile Safari/Chrome against HTTPS before inviting beta testers. Check keyboard operation, page zoom, safe areas, focus visibility, source links, browser history, theme/language, and report ownership/deletion. Chromium viewport checks are web evidence; they do not establish Android/iOS native, VoiceOver, TalkBack, or real-device Safari acceptance.

References: [Expo web publishing](https://docs.expo.dev/guides/publishing-websites/), [Vercel static configuration](https://vercel.com/docs/project-configuration/vercel-json).
