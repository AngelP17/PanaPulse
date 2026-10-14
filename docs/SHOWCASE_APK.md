# Build the complete PanaPulse experience before deploying an API

The default internal Android build is a **self-contained product showcase**. It does not need the Python backend, paid AI keys or an HTTPS server.

## Build profiles

| Profile | Uses backend? | What works |
|---|---|---|
| `preview` | **No** | Full interactive app preview; scenario-changing Home/Mobility/Services/Reports and scenario-aware quick chat; real USGS direct fetch or timestamped bundled fallback |
| `connected` | **Yes, HTTPS required** | Future server-backed power schedules and chat once an actual API is deployed |

`preview` sets `EXPO_PUBLIC_APP_MODE=showcase` and `ALLOW_NO_BACKEND=1` in `eas.json`. The app ignores any inherited `EXPO_PUBLIC_API_URL` in showcase mode to prevent accidental calls to an unconfigured server. It launches in interactive Preview on a fresh install. Settings allow switching modes at any time.

`connected` deliberately fails the build without a valid HTTPS API origin. Do not use it until the app itself is completed and a backend exists.

## Build/install later, after UI review

From the repository checkout:

```bash
npm ci
node scripts/test-build-env.cjs
npx expo-doctor
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

The Expo account may require first-time project setup. This creates an internal-distribution APK if EAS successfully completes. **No APK has been built as part of this change.**

For Expo Go local testing:

```bash
EXPO_PUBLIC_APP_MODE=showcase npx expo start --lan
```

For connected builds later, set the `EXPO_PUBLIC_API_URL` HTTPS origin in the EAS environment used by the connected profile. Never place an LLM API key in `EXPO_PUBLIC_*` variables.

## Expected showcase behaviors

- Porcelana theme with ES/EN, light/dark/auto, four native tabs and full navigation.
- Dynamic Día habitual / Incidencias / Recuperación scenarios.
- Saving/removing the example commute updates Home and now **survives a restart**.
- Submitting example reports updates the visible neighborhood feed within the session. **Example reports remain session-only.**
- Authentic USGS events and aftershock issue dates when direct fetch works; timestamped bundled snapshot otherwise. No fake seismic event is generated.
- Deterministic Ask PanaPulse questions about the selected scenario; the Claude Artifact runtime is **not available in a standalone APK**. Unsupported free-form chat won't use Haiku or Luna without a separate integration.
- No backend-origin dependency, no claims that electricity/water/Metro/MiBus services are live.

## Next app-completion milestones

1. Device test all screens at 360/393/412dp, ES and EN, Light/Dark/Auto, large font, screen reader and system navigation.
2. Test restart/offline states, preview toggle, report submission, route persistence, existing USGS detail sheet and all buttons.
3. Polish remaining screens, illustrations for onboarding/first-route/empty reports only after art-direction approval.
4. Improve offline unknown-chat behavior and provide useful quick suggestions.
5. Collect before/after native screenshots, ensure TypeScript/backend/regression checks pass, and only then request an APK build.

A successful install demonstrates the mobile product, **not** real utility API connectivity. Backend ingestion and hosting are a later phase.
