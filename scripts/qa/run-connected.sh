#!/usr/bin/env bash
# Isolated real-HTTP QA. Never points at a public API or a user's database.
set -euo pipefail
cd "$(dirname "$0")/../.."
qa_dir=$(mktemp -d)
api_pid=''
web_pid=''
cleanup() {
  [ -z "$api_pid" ] || kill "$api_pid" 2>/dev/null || true
  [ -z "$web_pid" ] || kill "$web_pid" 2>/dev/null || true
  rm -rf "$qa_dir"
}
trap cleanup EXIT
export DATABASE_URL="sqlite:///$qa_dir/test.db"
export PANAPULSE_REPORTS_ENABLED=1
export PANAPULSE_REPORT_HASH_KEY=isolated-ci-test-key-never-use-in-production
export PANAPULSE_CORS_ORIGINS=http://127.0.0.1:8081
export QA_ORIGIN=http://127.0.0.1:8081
python -m panapulse.cli init-db
python -m uvicorn panapulse.api:app --host 127.0.0.1 --port 8000 --no-access-log >"$qa_dir/api.log" 2>&1 &
api_pid=$!
python -m http.server 8081 --bind 127.0.0.1 --directory "${QA_WEB_DIR:-dist}" >"$qa_dir/web.log" 2>&1 &
web_pid=$!
python - <<'PY'
import time, urllib.request
for endpoint in ('http://127.0.0.1:8000/readyz', 'http://127.0.0.1:8081'):
    for attempt in range(50):
        try:
            urllib.request.urlopen(endpoint, timeout=1).close()
            break
        except OSError:
            if attempt == 49: raise
            time.sleep(.2)
PY
python -m panapulse.smoke --url http://127.0.0.1:8000 --web-origin http://127.0.0.1:8081 --require-reports
node scripts/qa/connected-e2e.mjs
