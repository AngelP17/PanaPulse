# Connected beta audit, October 21, 2026

The owner has reopened connected Android and browser beta work. The October 14 standalone-only deferral is superseded. This document records implementation and evidence, not release approval.

## Repository baseline

Audited `AngelP17/PanaPulse` main `859ea2bfac519c825ab198d509a2c029fffb46ce`. No open PRs existed at audit start. Main CI succeeded in [run 38629017037](https://github.com/AngelP17/PanaPulse/actions/runs/38629017037).

| PR | Merge verified on October 14, 2026 | Merge commit |
|---|---|---|
| #22 | 19:52:27Z | `2266edaf714d55f6814bbbf7f88af972adb3a834` |
| #23 | 19:53:18Z | `28b56f816ccbfb3d498f0955e3567bda63efa4d4` |
| #24 | 19:57:29Z | `afb4afc4dd369e996c89e71ffa033c590b4e9d74` |
| #25 | 19:59:23Z | `c8c7575dd927343425969153200ef5e2ca5d2680` |

PRs #26–27 also merged. Existing issue #1's original empty-repository premise is obsolete, but native QA remains unfinished. Repository releases are empty. No deployed API hostname, published web URL, EAS project ID or APK could be found in the repository or retrieved prior project discussions. Deployment API access was unavailable, so absence of deployments is not independently proven. Expo CLI reports not logged in; the Vercel connection requires reauthentication.

## Roadmap comparison

The original MVP calls for real USGS/OAF, a verified utility notice source and privacy-preserving neighborhood reports. Other provider feeds remain unavailable until permitted source access is established. The established Expo SDK 57 / React Native, FastAPI, SQLAlchemy, Porcelana, ES/EN and light/dark/auto architecture remains intact.

| Requirement | Implementation in this change | Remaining release evidence |
|---|---|---|
| Real seismic data | Mobile/web read the backend catalog; timestamps, strict payload validation, cache, stale/error handling, resume refresh | Public HTTPS API, continuous collector and physical-device behavior |
| Official power notices | ENSA and Naturgy parser repairs, source health, exact district/area matching and explicit scheduled-only scope | Provider reuse approval and sustained deployment monitoring |
| Shared reports | Real database receipts, reload, withdrawal, dedupe, two-hour expiry, seven-day purge, coarse areas, moderation and persistent abuse limits | Public deployment smoke test and operational moderation ownership |
| Browser access | Same Expo application, phone/desktop layouts, hash navigation, refresh/history, guarded static export | Hosted URL, mobile Safari and real browser/device acceptance |
| Android distribution | Existing connected EAS profile retained; added dependency bundles successfully for Android | Expo account/project, actual HTTPS backend, signed APK and clean-install QA |
| Ask | Source-grounded deterministic answers remain; capabilities gate paid model chat; stale data context and bounded requests | Real model credentials, durable spending controls and live model verification before enabling |
| IDAAN, Metro, MiBus | Honest unavailable states and official links retained | Authorized live integrations; no invented status or ETA |

## Verification completed locally

- Backend regression suite, including concurrency, idempotency, ownership, report withdrawal/retry, TTL, moderation, geography, parsing and database readiness.
- TypeScript and all nine `scripts/test-*.cjs` checks pass, including build guards and seismic payload rejection.
- Actual upstream fetches: USGS 101 events with zero invalid records and one OAF product; ENSA 17 notices; Naturgy 50 notices. These are observations from the audit, not uptime guarantees. The M4.5+/30-day API query returned 80 records during browser review.
- Real HTTP browser test against an isolated FastAPI/SQLite instance, without mocked routes: submit, reload, withdraw, withdrawn-request retry (410), offline pending persistence, reconnect/retry and no duplicate. A saved preview preference is ignored in connected mode.
- Browser navigation/layout checks at 360, 393, 412 and 1440 CSS pixels, ES/EN and light/dark: direct links, refresh, back/forward, document language, keyboard focus, no document overflow, no page errors. Screenshots of cached USGS data correctly show stale status.
- Expo web export and Android JavaScript/assets export pass. Android export is not an APK, installation, emulator or native-device test. The Android packaging check uses an example API origin and must not be distributed.

CI now repeats backend tests, TypeScript/contracts, isolated connected HTTP browser tests and Docker packaging/readiness. Do not infer that CI has passed from this configuration; inspect the PR's actual checks.

## Release gates, in order

1. Provision a persistent API plus collector, HTTPS, scoped CORS, private secrets and trusted-proxy configuration. Run the operations smoke tests and confirm fresh real source timestamps. Keep model chat disabled unless its real provider and budget are verified.
2. Build and publish the connected browser export against that exact API. Run the public URL on desktop Chrome and mobile Safari/Chrome, including report lifecycle, browser storage, reload, source outage and retry.
3. Authenticate the owner’s Expo account, associate the existing application with its EAS project, build the connected Android APK, and test clean installation, resume, offline radios, keyboard, safe areas, 200% OS text and TalkBack. iOS needs its own signing/distribution and device checks.
4. Record beta owner/contact, moderation and incident response, approved data reuse, privacy/terms acceptance, rollback decision and test cohort before inviting external users.

No merge, public deployment, signed native build, push-alert implementation, or production readiness is claimed by this audit. Public reports are unverified observations, never official service status. See [the operations runbook](CONNECTED_BETA_RUNBOOK.md) and [browser instructions](WEB_BETA.md).
