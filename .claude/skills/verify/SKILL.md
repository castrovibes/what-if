---
name: verify
description: Run the whole quality gate in one command (tools/check.sh - typecheck, lint with no warnings, Jest, and the Firestore rules suite when firebase/ changed). Use before every commit, after any refactor, or when asked whether the build is green. A hook runs it automatically before git commit.
---

# Verify

```
tools/check.sh            # typecheck + lint --max-warnings=0 + jest (+ rules if firebase/ changed)
tools/check.sh --quick    # typecheck + lint only (mid-edit sanity check)
tools/check.sh --rules    # force the Firestore rules suite (needs Java 21 + firebase CLI)
```

Prints one line per step and only a failing step's output (last 60 lines; the full log path is
shown). Exit 1 means fix before committing. The whole run is about 10 s when green, so run it
rather than the four commands by hand.

- The `git commit` hook runs this and blocks the commit on failure; `--no-verify` skips it, which
  is for WIP commits on a feature branch only.
- CI (`.github/workflows/ci.yml`) runs the same steps; a green `check.sh` means a green PR.
- Lint warnings count as failures (CI uses `--max-warnings=0`), so fix them, don't suppress them.
- Jest runs with `--silent`; to see a test's console output, run `npx jest path/to/test`.
