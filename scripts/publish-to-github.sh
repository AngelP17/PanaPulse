#!/usr/bin/env bash
set -euo pipefail

# Intentionally non-destructive first push to an EMPTY GitHub repository.
REPO="${PANAPULSE_GITHUB_URL:-https://github.com/AngelP17/PanaPulse.git}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -n "$(git -c core.filemode=false status --porcelain)" ]]; then
  echo 'Working tree is not clean. Commit or stash your changes before publishing.' >&2
  exit 1
fi

if git remote get-url origin >/dev/null 2>&1; then
  EXISTING="$(git remote get-url origin)"
  if [[ "$EXISTING" != "$REPO" ]]; then
    echo "origin already points at $EXISTING, not $REPO; refusing to replace it." >&2
    exit 1
  fi
else
  git remote add origin "$REPO"
fi

if [[ -n "$(git ls-remote --heads origin refs/heads/main)" ]]; then
  echo 'Remote main already exists. Refusing to overwrite it; merge manually.' >&2
  exit 1
fi

echo 'Publishing current branded build as main, plus original and recovery refs…'
git push origin feature/brand-integration:refs/heads/main
git push origin master:refs/heads/v0.2-original recovery:refs/heads/recovery preview/b-refinement:refs/heads/preview/b-refinement
git push origin --tags

echo 'Published. Open https://github.com/AngelP17/PanaPulse'
