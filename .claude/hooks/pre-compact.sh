#!/usr/bin/env bash
# PreCompact: leave a trail in docs/HANDOFF.md before the conversation is summarized.
set -u
root="${CLAUDE_PROJECT_DIR:-$(pwd)}"; cd "$root" || exit 0
mkdir -p docs
{
  echo; echo "## Compaction $(date '+%Y-%m-%d %H:%M') on $(git rev-parse --abbrev-ref HEAD 2>/dev/null)"
  echo '```'; git status --short | head -n 30; echo '```'
  echo "Recent commits:"; git log --oneline -5 | sed 's/^/- /'
  echo "Open Claude items:"
  grep -h '^\s*- \[ \] \*\*Claude' TESTFLIGHT_CHECKLIST.md ANDROID_CHECKLIST.md 2>/dev/null | head -n 12 | sed 's/^\s*//'
} >> docs/HANDOFF.md
exit 0
