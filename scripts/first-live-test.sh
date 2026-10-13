#!/usr/bin/env bash
# Verify real upstream data. Safe: failures never become fake no-outage reports.
set -uo pipefail
cd "$(dirname "$0")/../backend" || exit 2
if ! python -c 'import panapulse, httpx, fastapi, sqlalchemy' >/dev/null 2>&1; then
  printf >&2 '\nInstall backend first: cd backend && python -m pip install -e ".[test]"\n'
  exit 2
fi
echo 'PanaPulse live-source test; DATABASE_URL if set, otherwise local SQLite.'
if ! python -m panapulse.cli init-db; then exit 2; fi
errors=0
run_source() {
  local name="$1"; shift
  echo
  echo "========== Fetching $name =========="
  if "$@"; then
    echo "PASS: $name fetch and ingestion completed"
  else
    echo "FAIL: $name fetch/parsing failed, previous valid notices retained" >&2
    errors=$((errors + 1))
  fi
}
run_source USGS python -m panapulse.cli ingest
run_source ENSA python -m panapulse.cli utilities --source ensa
run_source Naturgy python -m panapulse.cli utilities --source naturgy
echo
echo '========== Source health (not service availability) =========='
python - <<'PY'
from panapulse.config import Settings
from panapulse.models import SourceHealth, make_session_factory
_, sessions = make_session_factory(Settings.from_env().database_url)
with sessions() as session:
    for name in ("usgs", "ensa", "naturgy"):
        h = session.get(SourceHealth, name)
        if h is None:
            print(f"{name}: NOT TESTED")
            continue
        state = "ERROR" if h.last_error else "FETCHED" if h.last_success_at else "UNAVAILABLE"
        print(f"{name}: {state} | success={h.last_success_at} | count={h.last_event_count}")
        if h.last_error:
            print(f"  reason={h.last_error}")
print("FETCHED is source-collection status, never proof of current electric service.")
PY
echo
if (( errors > 0 )); then
  echo "Completed with $errors upstream failure(s). Investigate before trusting the affected category." >&2
  exit 1
fi
echo 'Three ingestions completed. Start FastAPI and inspect records and original timestamps.'
