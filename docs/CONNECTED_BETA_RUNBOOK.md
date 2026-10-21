# Connected beta operations

This runbook preserves Expo / React Native Web, FastAPI, one collector and one durable SQLite database. Web and native builds use the same HTTPS API. Connected mode cannot enable scenario previews or replace unavailable sources with bundled fixtures.

**Status:** local API, parser, report and browser verification is separate from deployment. Docker build, public HTTPS hosting, proxy configuration, real Android/iOS device testing and an installable EAS build have not been verified in this environment. Do not describe this runbook as a deployed application. Track the exact Git commit, image tag, exported web files, APK URL and verification date for each release.

## Closed-beta boundaries

- One API process (`--workers 1`) and one worker, on one host with a persistent volume. Do not scale replicas; report limits/deduplication use a process lock plus durable database rows.
- USGS is a regional catalog and OAF source. ENSA/Naturgy are scheduled-maintenance notices, not real-time power status. Water, Metro and MiBus remain unavailable until verified source integrations exist. Never interpret an empty feed as normal service.
- Anonymous community observations have no name, free text or exact coordinates. Aggregation requires three installation identities, which are not verified distinct people. Reports expire after two hours; inactive records, limits and audits are purged after seven days. A withdrawal deletes the observation immediately and retains only an opaque withdrawal receipt in the seven-day audit to reject delayed retries.
- Model chat stays disabled by leaving `ANTHROPIC_API_KEY` empty. The existing model limiter is in memory and resets on restart. Before enabling it, verify the actual provider/model, timeout behavior and an external spending cap or durable budget. A configured key is not proof of a functioning model.
- No community data is included in the source-only backup described below. Restoring a backup intentionally loses submission history, withdrawal tombstones and rate budgets; the restore itself imports no observations. Keep reports disabled after a restore until the operator has reviewed the recovery and rate-limit reset.

## 1. Prepare an isolated staging deployment

Use a clean checkout of the reviewed commit, a Linux Docker/Compose host with a durable disk, and two DNS names you control. Staging must have its own Compose project name, volume, origin and hash key. Never run mutation QA against the production volume.

```sh
export COMPOSE_PROJECT_NAME=panapulse-staging
export PANAPULSE_IMAGE="panapulse-backend:$(git rev-parse --short=12 HEAD)"
cp .env.backend.example .env.backend
chmod 600 .env.backend
```

If staging shares a host with another deployment, also export `PANAPULSE_API_PORT=8001` (or another unused loopback port) and use that port in its reverse proxy. Keep these Compose project/image/port values in the host's release configuration so later commands target the same deployment.

Edit `.env.backend` locally:

| Setting | Required value |
| --- | --- |
| `DATABASE_URL` | `sqlite:////data/panapulse.db` |
| `PANAPULSE_CORS_ORIGINS` | Exact HTTPS web origin, no trailing slash; comma-separated if needed |
| `PANAPULSE_REPORTS_ENABLED` | `0` while configuring, then `1` after staging verification |
| `PANAPULSE_REPORT_HASH_KEY` | Random secret of at least 32 characters, unique to this environment |
| `PANAPULSE_UTILITY_SOURCES` | `ensa,naturgy` for the verified source adapters |
| `FORWARDED_ALLOW_IPS` | Only the actual reverse proxy connection IP; see section 2 |
| `ANTHROPIC_API_KEY` | Empty until model release gates are met |

Generate the report hash key directly into the local file without printing it:

```sh
python - <<'PY'
from pathlib import Path
import secrets
p = Path('.env.backend')
s = p.read_text()
s = '\n'.join('PANAPULSE_REPORT_HASH_KEY=' + secrets.token_hex(32)
              if line.startswith('PANAPULSE_REPORT_HASH_KEY=') else line
              for line in s.splitlines()) + '\n'
p.write_text(s)
p.chmod(0o600)
PY
```

Never commit `.env.backend` or embed any secret in an `EXPO_PUBLIC_*` variable. Do not print `docker compose config` in shared logs because resolved environment files contain secrets; use `docker compose config --quiet`.

```sh
docker compose config --quiet
docker compose build api
docker compose run --rm --no-deps migrate
docker compose up -d api worker
docker compose ps
```

`init-db` creates missing tables; it is not a general schema migration system. This change adds tables without dropping existing source tables. Future column changes need versioned migrations and tested downgrade compatibility. A failed readiness check blocks release.

## 2. HTTPS and trusted client addresses

Port 8000 is published to **host loopback only**. Use a host reverse proxy for TLS. One possible host Caddy configuration is below; replace both reserved example domains with your own. This configuration assumes Caddy receives client traffic directly, without another CDN/load balancer.

```caddyfile
api.example.com {
    reverse_proxy 127.0.0.1:8000 {
        header_up X-Forwarded-For {remote_host}
    }
}
beta.example.com {
    root * /srv/panapulse-web
    encode gzip
    try_files {path} /index.html
    file_server
    header /index.html Cache-Control "no-cache"
}
```

The proxy must overwrite user-supplied forwarding headers. Uvicorn accepts them only from `FORWARDED_ALLOW_IPS`. For a host proxy connecting through Docker's bridge, inspect the API container's network gateway, then verify this is the connection source on that host:

```sh
docker inspect --format '{{range .NetworkSettings.Networks}}{{.Gateway}}{{end}}' "$(docker compose ps -q api)"
```

Set that single verified address in `.env.backend` and recreate the API. Do **not** use `*`, trust the entire Internet, or expose port 8000 publicly. If a CDN or a different proxy chain is used, configure its documented trusted proxy ranges and validate real client addresses before enabling shared reports. Otherwise all users can share the proxy's IP limit, or a forged header can bypass limits. Test address handling in staging with two clients and spoofed headers; do not log installation tokens or report bodies.

References: [Uvicorn proxy settings](https://www.uvicorn.org/settings/#http), [Caddy forwarding-header behavior](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy#headers).

## 3. Populate and verify real sources

The worker normally polls USGS every two minutes and power pages every six hours, with bounded retry/backoff. It stores source health and never runs a crawl per visitor. For an initial controlled fetch, avoid running a second collector simultaneously:

```sh
docker compose stop worker
docker compose exec -T api python -m panapulse.cli ingest
docker compose exec -T api python -m panapulse.cli utilities
docker compose start worker
```

A collector exit alone does not certify freshness. Run the read-only smoke check through the public HTTPS hostname, including CORS and both providers via the border-area default:

```sh
python -m panapulse.smoke --url https://api.example.com \
  --web-origin https://beta.example.com --require-fresh --require-reports
```

The check requires reports to be enabled/configured, correct readiness, source freshness and unknown service status. It never posts an artificial outage. Inspect worker failures and last-success dates. Alert on API readiness failures, collector restarts, growing disk usage, USGS last-success older than 20 minutes or utilities older than 36 hours. A failed source must display stale/unavailable; it must not keep a current-looking status.

## 4. Verify shared flows, web and native

Run the repository's connected HTTP E2E suite against its isolated temporary database (`npm run test:connected`), after installing its documented Playwright prerequisites. It exercises submission, receipt after reload, withdrawal, failed submission and retry without route mocks. Synthetic observations belong only in this isolated test environment.

Then use staging from a physical phone and desktop. Verify ES/EN; light/dark/auto; onboarding; area selection; source links; keyboard navigation; large text; scrolling; offline/reconnect; duplicate taps; reload/app resume; a report receipt; withdrawal and delayed retry; and another installation's aggregate visibility. Mark staged observations as test evidence in the release record and discard the staging volume when finished. In production, submit only genuine observations.

Build the public web files with the verified API origin:

```sh
npm ci
EXPO_PUBLIC_API_URL=https://api.example.com npm run export:web:connected
```

Serve the resulting `dist/` from `/srv/panapulse-web` (or the existing static host). Rebuild when the API origin changes. Do not deploy a showcase build as the public beta. Keep the previous export as the rollback artifact. See the web release documentation for responsive-browser checks and static-host configuration.

For Android, authenticate the intended Expo account, link the intended EAS project, set the connected environment's `EXPO_PUBLIC_API_URL`, and use the `connected` EAS profile. Test the resulting APK on a physical device over mobile data and Wi-Fi, including resume, permissions, back navigation, keyboard and source links. An Android JavaScript export or web screenshot is not APK/device verification. iOS distribution/signing and actual device QA are separate gates.

## 5. Source-only online backup and restoration

The backup uses SQLite's online backup API to take a consistent snapshot even when WAL writes exist. It filters the snapshot **in memory**, removes community tables' rows and vacuums deleted bytes before creating a disk artifact. Allow available RAM above the database's on-disk size. Final files are owner-only and existing paths are never overwritten. Transfer backups to access-controlled off-host storage; a second file in the same Docker volume does not protect against disk loss.

```sh
docker compose exec -T api python -m panapulse.backup backup \
  --source /data/panapulse.db --destination /data/backups/sources-RELEASE-UTC.db
docker compose exec -T api python -m panapulse.backup verify \
  --source /data/backups/sources-RELEASE-UTC.db
```

Use a unique release/date filename. Copy the result off-host through your authenticated operations channel and record its SHA-256. Backups contain official source records only; schedule and verify them daily. Do not copy the live database file directly or omit its WAL. Do not make general volume snapshots that retain community observations beyond the stated seven-day policy.

Restore into a **new** path, with API/worker stopped and reports disabled. Validate the restored database before switching `DATABASE_URL`:

```sh
docker compose stop api worker
docker compose run --rm --no-deps api python -m panapulse.backup restore \
  --source /data/backups/sources-RELEASE-UTC.db --destination /data/restored-RELEASE.db
```

Set `DATABASE_URL=sqlite:////data/restored-RELEASE.db`, `PANAPULSE_REPORTS_ENABLED=0`, and recreate API/worker. Run initialization, readiness and fresh-source checks before enabling reports again. An old restored source timestamp stays stale until the collector succeeds. Report history is intentionally empty and never interpreted as all-clear. Offline clients may still hold an old unconfirmed request and can retry after the service returns. Because withdrawal tombstones are also absent, a previously withdrawn request could be accepted if a client retries it after reporting resumes. Keep reporting disabled until the recovery policy has addressed pending requests. A future recovery epoch or bounded observation timestamp is needed to reject all pre-recovery retries automatically.

Do not retain an abandoned former live database beyond its seven-day community retention policy. After verifying the new deployment, remove retired database copies through the host's controlled maintenance procedure. Backup/restore regression tests prove WAL consistency, no community bytes in the resulting snapshot, refusal to overwrite, schema/integrity checks and restored API readiness. They do not prove that your off-host storage or host recovery works; rehearse this procedure in staging.

## 6. Moderation, incident stop and rollback

A trusted operator can hide a receipt with host access:

```sh
docker compose exec -T api python -m panapulse.cli hide-report --report-id RECEIPT_HASH
docker compose exec -T api python -m panapulse.cli purge-reports
```

This marks the observation hidden and removes it from aggregates. The owner can still withdraw it. There is no public moderator endpoint. For abuse or data-handling incidents, set `PANAPULSE_REPORTS_ENABLED=0` and recreate the API; do not erase evidence or broaden permissions. Source APIs remain independent. Check worker logs without enabling request-body/access logging.

Before an update, preserve the previous immutable image tag, web export and source-only verified backup. Test the new image against a separate restored staging volume. Only switch the real deployment after all applicable gates pass. If startup/readiness/smoke fails, keep traffic on the previous release or maintenance mode. For a code-only rollback with compatible schema, set `PANAPULSE_IMAGE` to the previous verified image and run `docker compose up -d --no-build api worker`; restore the previous web export too. Do not rebuild the old tag from new source. Database rollback uses the new-path restore procedure and starts with reports disabled.

Never run `docker compose down --volumes` against the beta/production project. Never merge or deploy merely because a fixture test passed. Public URL, real-source checks, receipt lifecycle, native device evidence and recovery rehearsal must be recorded before calling the release ready for testers.
