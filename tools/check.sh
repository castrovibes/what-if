#!/usr/bin/env bash
# The quality gate, in one run: typecheck, lint (no warnings), unit tests, and the
# Firestore rules suite when firebase/ changed. Prints one line per step and only a
# failing step's output. Exit 1 if anything failed. Used by the commit hook and /verify.
#
#   tools/check.sh            typecheck + lint + jest (+ rules if firebase/ changed)
#   tools/check.sh --rules    always run the rules suite
#   tools/check.sh --no-rules never run it
#   tools/check.sh --quick    typecheck + lint only
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
OUT_DIR="${TMPDIR%/}/what-if-check"; mkdir -p "$OUT_DIR"
rules=auto; quick=0
for a in "$@"; do case "$a" in --rules) rules=yes ;; --no-rules) rules=no ;; --quick) quick=1 ;; esac; done

failed=0
step() {
  local name="$1"; shift
  local log="$OUT_DIR/$name.log" start=$SECONDS
  if "$@" > "$log" 2>&1; then
    printf '  ok   %-10s %ss\n' "$name" "$((SECONDS - start))"
  else
    failed=1
    printf '  FAIL %-10s %ss\n' "$name" "$((SECONDS - start))"
    # Jest prints the summary last; tsc and eslint print errors in order. 60 lines covers both.
    sed 's/^/       /' "$log" | grep -v -E '^\s*$' | tail -n 60
    echo "       (full output: $log)"
  fi
}

firebase_changed() {
  { git diff --name-only HEAD 2>/dev/null; git diff --name-only --cached 2>/dev/null
    git diff --name-only "$(git merge-base origin/main HEAD 2>/dev/null || echo HEAD)" HEAD 2>/dev/null; } | grep -q '^firebase/'
}

echo "check: $(git rev-parse --abbrev-ref HEAD 2>/dev/null) @ $(git rev-parse --short HEAD 2>/dev/null)"
step typecheck npx tsc --noEmit
step lint npx expo lint --max-warnings=0
if [ $quick = 0 ]; then
  step jest npx jest --ci --silent
  if [ $rules = yes ] || { [ $rules = auto ] && firebase_changed; }; then
    if command -v firebase >/dev/null 2>&1 || [ -x node_modules/.bin/firebase ]; then
      step rules npm run -s test:rules
    else
      echo "  skip rules      (firebase CLI not installed; CI runs the suite)"
    fi
  fi
fi
[ $failed = 0 ] && echo "check: all green" || { echo "check: FAILED"; exit 1; }
