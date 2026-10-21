# Owner review and beta acceptance

This checklist separates repository completion from a future release. Review the PR before merge. Deploy only the reviewed, verified commit after owner acceptance; do not retry hosting/account prompts as part of the repository audit.

## Repository review

- [ ] Review the [architecture diagrams](architecture/PANAPULSE_TECHNICAL_ARCHITECTURE.md), [API contract](API_CONTRACT.md) and [operations runbook](CONNECTED_BETA_RUNBOOK.md).
- [ ] Confirm the intended beta scope: USGS/OAF, official scheduled power notices, shared unverified observations, browser/native UI and optional source-grounded Ask. IDAAN/Metro/MiBus live telemetry and push alerts are not implemented integrations.
- [ ] Check all four CI jobs on the latest PR commit: backend, mobile-types, connected-web and backend-container.
- [ ] Review real-source provenance and failure behavior. Fixture tests and source snapshots are not proof of current availability.
- [ ] Review source reuse, privacy copy, moderation ownership and beta feedback/contact arrangements.

For repeatable local regression checks, install dependencies from README, then:

```sh
npm run typecheck
python -m pytest backend/tests -q
for script in scripts/test-*.cjs; do node "$script" || exit 1; done
```

For isolated browser-to-database testing (never a production database):

```sh
npm install --prefix /tmp/panapulse-playwright playwright@1.64.1
/tmp/panapulse-playwright/node_modules/.bin/playwright install chromium
EXPO_PUBLIC_APP_MODE=connected EXPO_PUBLIC_API_URL=http://127.0.0.1:8000 \
  npx expo export -p web --clear --output-dir dist
PW_MODULE=/tmp/panapulse-playwright/node_modules/ npm run test:connected
```

The harness starts its own temporary API/database, performs real HTTP requests and removes the test database afterward. It verifies pending/retry/withdrawal/recovery behavior; it does not collect fake observations in production.

## Your application walkthrough

Use staging or the local connected app, with the same API for browser and native clients. Each installation owns separate receipts; shared public aggregates use the common backend. Use actual source observations and label synthetic report tests as staging-only.

| Check | Expected result |
|---|---|
| First launch and onboarding | Language, theme and area save; reconnect/reload preserves them |
| Home and Quakes | Actual source timestamps; no preview badge or invented records in connected mode |
| Source outage / offline | Previously received data is stale; never-fetched data is unavailable; no false all-clear |
| Power notice and area change | Notice belongs to correct provider and area; old area is not shown during refresh; scheduled work remains distinct from live power status |
| Report submission | Server receipt appears only after confirmation; same receipt is visible after reload |
| Report retry | Disconnect after starting a submission, reconnect and retry; at most one receipt |
| Withdrawal | Observation disappears and delayed retry cannot recreate it |
| Expiry and recovery | Old observation/runtime requests explain expiration; fresh observation form remains usable |
| Aggregation | No installation identifiers or individual observations leak; fewer than three identities suppress exact counts |
| Ask | Common responses use actual received data; unavailable/limited paid service is explicit; no report write or invented ETA |
| Desktop and mobile browser | Direct links, back/forward/reload, keyboard, scrolling, ES/EN and themes work; no clipped required controls |
| Local activity deletion | Preferences remain; shared-report removal remains explicitly in Reports |

## Future deployment checks, after repository acceptance

1. Provision the persistent API/collector and HTTPS host. Supply secrets privately. Confirm database readiness, both source collectors, bounded logs, disk monitoring, trusted proxy IPs and exact CORS origins.
2. Deploy the connected browser export against that verified API. Repeat the walkthrough at the public URL on desktop Chrome and mobile Safari/Chrome. Confirm privacy and retention copy before any real reporting.
3. Authenticate the intended Expo account/project and build the connected Android APK against the same API. Verify clean installation, Wi-Fi/mobile data, background/resume, back gestures, keyboard, safe areas, 200% OS font scaling, Reduce Motion and TalkBack. Complete iOS signing and device checks separately if iOS is in the cohort.
4. Rehearse source-only backup/restore and rollback on staging. Confirm fresh epochs reject pre-recovery report requests and paid chat remains blocked through the recovery day. Verify report data is not included in backup artifacts.
5. Record the exact commit, CI URL, image tag, API URL, web URL, APK/build identifier, devices/browsers, reviewer, known limitations, support contact and rollback owner. Invite the cohort only after this record is accepted.

No public launch is authorized by checking repository tests alone. Preserve a copy of the completed release record for each beta build.
