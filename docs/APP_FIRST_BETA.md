# PanaPulse: App-first Beta 1

**Priority:** Finish the mobile product before any more API, scraping, billing or backend deployment. This is an app-completion plan, not a claim that real Metro/IDAAN/MiBus feeds are online.

## Two independent milestones

**A. App Beta 1 internal APK (NOW).** The Expo app is complete enough to install, navigate and explore offline. Its bundled and dynamic preview demonstrates Home, Services, Mobility, Sismos, Reports, Ask and Settings; scenarios agree across tabs. A single VISTA PREVIA indicator remains visible whenever fictional services are displayed. The existing USGS integration may fetch real events over the public internet; otherwise it shows its authentic archived snapshot with original dates. No PanaPulse-hosted API is needed.

**B. Connected Beta (LATER).** Deploy verified source ingestion and HTTPS API *only after* the Android app itself works and its visual/interaction QA is accepted.

## Build the showcase without a backend

Requires Node 22+, an Expo login for EAS cloud builds, and your own PanaPulse checkout:

```bash
npm ci
node scripts/test-app-build-config.cjs
npx expo start --lan
```

When Expo Go is working, create the internal APK with:

```bash
npx eas-cli build --platform android --profile preview
```

The `preview` profile sets `EXPO_PUBLIC_APP_MODE=showcase`, `ALLOW_NO_BACKEND=1` and an **intentionally blank** `EXPO_PUBLIC_API_URL`. This is safe and deliberate, unlike accidentally creating a connected build without an API URL. The guard prints that the build is a self-contained showcase and does not block it.

A separate `connected-preview` profile enforces an HTTPS origin later; don't set API credentials or create hosting just to test the product today. No LLM key is needed for the standalone preview; common questions work using the deterministic scenario assistant. Questions that require general LLM inference still need a provider or Claude Artifact, and must not falsely claim to work in this APK.

## What is already in the app

- Porcelana Light/Dark/Auto with the PanaPulse P identity and four-tab navigation.
- English/Spanish UI, USGS observational data and archived forecast labels.
- Interactive Everyday/Disruptions/Recovery previews for disconnected provider features, with one persistent preview indicator.
- Save/remove the example commute, now persisted across restarts.
- Anonymous *example* neighborhood reports and local-only reporting. Preview submissions are session-only; do not claim they are published to other users.
- Fast deterministic Ask answers about the current preview scenario and sourced USGS data.
- Custom, approved native components, transitions, source links and Android back behavior.

## Finish the UI before starting the API

- [ ] Produce and install the actual Android APK from the `preview` EAS profile. Test **cold start, background resume, airplane mode and phone rotation**.
- [ ] Walk all screens, links, cards, buttons, sheets and navigation. No dead-end CTAs.
- [ ] Visually compare 360, 393 and 412 dp on Android, ES/EN, Light/Dark/Auto. Verify no clipped area names, pill labels, buttons, or obscured composer.
- [ ] Test OS text at 200%, screen readers, reduced motion, system keyboard and Android gesture navigation.
- [ ] Confirm three preview scenarios change Home, Mobility, Services, Reports and Ask consistently; save/remove route then restart APK.
- [ ] Confirm anonymous preview submission appears immediately, remains explicitly fictional, and never enters actual user-submitted report storage.
- [ ] Confirm switching preview OFF restores strictly sourced USGS and honest unavailable-source states.
- [ ] Test online and offline USGS, detail sheets, open-source links, original timestamps and historic-forecast wording. Never imply a seismic early-warning system.
- [ ] Add first-run guidance / onboarding only where navigation isn't obvious. Illustrations are optional and require approval; don't block core app QA on them.
- [ ] Inspect UI contrast, spacing, native safe areas, scroll and typography at real phone sizes. Keep Porcelana and Hark-quality polish, not a new art direction.
- [ ] Confirm app version/packaging metadata, app icon/splash, privacy copy and no secrets are bundled.
- [ ] Record reproducible Android device screenshots and issues, fix them and retest. Mark Beta 1 app showcase **ready** only after a physical APK passes.

## Out of scope until after app completion

No backend hosting, live MiBus GTFS-RT, IDAAN scraping, utility collectors, production community report server, authentication, monetization, paywall, analytics vendor, new AI model billing, push alerts, database migration or release to app stores.

### Trust boundary

A complete preview is not current Panama service telemetry. Preserve the global preview indicator everywhere examples can appear. Quakes stay real USGS observations/snapshots with original issue times. A missing real source does not establish normal service. When an externally shared production beta is later planned, separately verify provider integrations and source rights.
