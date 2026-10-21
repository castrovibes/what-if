#!/usr/bin/env bash
# SessionStart: the few facts every session used to rediscover by hand.
set -u
root="${CLAUDE_PROJECT_DIR:-$(pwd)}"; cd "$root" || exit 0
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
dirty=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
echo "Branch: $branch ($dirty changed files)$( [ "$branch" = main ] && echo ' — start a feature branch before editing')"
for f in TESTFLIGHT_CHECKLIST.md ANDROID_CHECKLIST.md; do
  [ -f "$f" ] && echo "$f: $(grep -c '^\s*- \[ \]' "$f") unchecked ($(grep -c '^\s*- \[ \] \*\*Claude' "$f") for Claude)"
done
metro=$(curl -s -m 1 http://localhost:8081/status 2>/dev/null)
echo "Metro: $([ "$metro" = packager-status:running ] && echo running || echo 'not running (tools/run-app.sh start)')"
booted=$(xcrun simctl list devices booted 2>/dev/null | grep '(Booted)' | head -1 | sed 's/^ *//; s/ (.*//')
echo "Simulator: ${booted:-none booted (tools/run-app.sh ios)}"
curl -s -m 1 -o /dev/null http://localhost:4000 2>/dev/null && echo "Firebase emulators: running"
if [ -f docs/HANDOFF.md ]; then
  echo; echo "--- docs/HANDOFF.md (from the last session) ---"; head -n 60 docs/HANDOFF.md
fi
echo; echo "Skills: /sim /run-app /verify /ship /checklist /handoff. Agents: ui-verifier, design-critic, screen-restyler, release-checker."
exit 0
