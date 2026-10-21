#!/usr/bin/env bash
# PreToolUse(Bash): refuse the few things that have bitten this repo, and run the
# quality gate before any git commit. Exit 2 blocks the command; stderr goes to Claude.
set -u
cmd=$(jq -r '.tool_input.command // empty')
[ -n "$cmd" ] || exit 0
block() { echo "$*" >&2; exit 2; }

# Backups go in .backups/ (git-ignored) with a git tag, never as .bak beside the source.
if echo "$cmd" | grep -q -E '(^|[^.[:alnum:]_-])(cp|mv|>|>>|tee)[^|;&]*\.bak([[:space:]"'"'"']|$)' && ! echo "$cmd" | grep -q '\.backups/'; then
  block "Blocked: don't write .bak files beside the source. Copy into .backups/<date>-<name>/ and tag the commit (see the backup rule in CLAUDE.md)."
fi
if echo "$cmd" | grep -q -E 'rm[[:space:]].*\.backups'; then
  block "Blocked: .backups/ holds the pre-refactor copies; it isn't deleted from a session."
fi
if echo "$cmd" | grep -q -E 'git[[:space:]]+push'; then
  if echo "$cmd" | grep -q -E -- '(^|[[:space:]])(-f|--force)([[:space:]]|$)'; then
    block "Blocked: no force pushes. Use --force-with-lease on a feature branch if a rebase really needs it, never on main."
  fi
  if echo "$cmd" | grep -q -- '--force-with-lease' && echo "$cmd" | grep -q -E '(^|[[:space:]:/])main([[:space:]]|$)'; then
    block "Blocked: no force pushes to main."
  fi
fi

# Commit gate: tools/check.sh must be green. `--no-verify` skips it, as git's own hooks do.
if echo "$cmd" | grep -q -E 'git[[:space:]]+(-[^[:space:]]+[[:space:]]+)*commit' && ! echo "$cmd" | grep -q -- '--no-verify'; then
  root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null)}"
  out=$("$root/tools/check.sh" 2>&1); rc=$?
  if [ $rc -ne 0 ]; then
    block "Blocked: the quality gate failed, so the commit was not run. Fix these, then commit again.
$out"
  fi
  echo "$out" | tail -n 1 >&2
fi
exit 0
