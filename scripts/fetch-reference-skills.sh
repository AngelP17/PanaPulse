#!/usr/bin/env bash
# Clones the design-skill repos that were reviewed but NOT vendored (web-focused or heavy), for reference.
# Clones only; never runs their installers or hooks.
set -euo pipefail
cd "$(dirname "$0")/.." && mkdir -p .reference-skills && cd .reference-skills
for r in Leonxlnx/taste-skill GrubbyLee/design-guide lotfb86/web-design-skills alchaincyf/huashu-design Netxeo/skill-file-design; do
  d=${r//\//__}; [ -d "$d" ] || git clone --depth 1 "https://github.com/$r.git" "$d"
done
echo "Reference copies in .reference-skills/ (gitignored). Review before enabling any of them."
