---
name: ship
description: Commit, push and open a PR the way this repo does it - Conventional Commit subject in the repo's style, the gate run first, a PR body written from the Summary/Testing template, the checklist ticked. Use when asked to commit, push, open a PR, or "ship it".
---

# Ship

One feature branch per session, branched from `main`. Never commit on `main`.

## 1. Gate
`tools/check.sh` (the commit hook runs it too). Fix anything red first.

## 2. Commit
Style from the history: `type(scope): lowercase sentence, no period`, present tense, specific.

```
feat(prompts): offer reflections with a toast, not a sheet
fix(signup): Done stays up 2 s before returning (was 1.6 s)
docs(checklist): sign-up flow review items
refactor: providers in one folder, MadLibs renamed to PromptBuilder
chore(tooling): Jest, ESLint, CI, and explicit native config
```

Scopes in use: `prompts`, `welcome`, `you`, `signup`, `auth`, `explore`, `tabs`, `app`,
`content`, `firebase`, `checklist`, `tooling`. Omit the scope when a change spans the app.
Body: only when the subject can't carry the why. Always end with the attribution line from the
session's system reminder (`Co-Authored-By: …`). Stage by path (`git add src/... `), not `-A`,
and look at `git status` for stray files first.

## 3. Push and PR
```
git push -u origin <branch>
gh pr create --title "<Short title>" --body-file /path/to/body.md
```
Write the body to a file in the scratchpad, not inline. Template (what PR #8 and earlier used):

```markdown
## Summary
- **Thing changed:** what it does now, in the user's words, with the file in backticks when a
  reviewer would open it.
- …

## What testers will notice
- One line per visible change; "nothing" if it's internal.

## Not in this PR
- Related work deliberately left out, with where it's tracked (checklist item).

## Testing
- `tools/check.sh`: typecheck, lint, N of N tests.
- Simulator, light and dark: what was checked (from the ui-verifier report).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```
Title: the branch's purpose in title case, like "Login flow" or "Play in deck polish".

## 4. Checklist
Tick the item this delivers in `TESTFLIGHT_CHECKLIST.md` or `ANDROID_CHECKLIST.md` (see
/checklist) in the same PR, with a dated note of what was decided or verified.

## After the merge
Tell the user to `/clear`; the next piece of work starts a new branch from an updated `main`.
