---
name: handoff
description: Write docs/HANDOFF.md at the end of a session (or before going idle) so the next session starts with the state, not a re-read - branch, what landed, what's mid-flight, open decisions. The SessionStart hook prints it. Use when asked to wrap up, hand off, save state, or before /clear.
---

# Handoff

Write `docs/HANDOFF.md` (git-ignored; `docs/` is local notes). Overwrite it; the PreCompact hook
appends its own dated sections below, and the SessionStart hook prints the first 60 lines.

```markdown
# Handoff — 2026-10-20 (branch: welcome-guide-tap)

## State
- Branch / PR: `welcome-guide-tap`, PR #12 open (or: not pushed; 3 commits ahead of main).
- Gate: tools/check.sh green at <short sha>.
- App: Metro running / not; simulator iPhone 16e booted.

## Landed this session
- One line per commit or feature, in the user's words.

## Mid-flight
- What's half done, which file, and what the next step is. "Nothing" is a fine answer.

## Open decisions for Scott
- Questions that blocked or shaped work, with the default taken.

## Next
- The single next item from the checklist (line number), and anything learned that isn't in CLAUDE.md yet.
```

Keep it under 40 lines. Facts that should outlive the session (preferences, project constraints)
go to memory, not here; the checklist stays the backlog.
