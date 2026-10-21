---
name: checklist
description: Read and update TESTFLIGHT_CHECKLIST.md and ANDROID_CHECKLIST.md without loading the whole file - list unchecked items, tick one with a dated note, add a new item in the house style. Use when asked what's next, to add items to the checklist, or when finishing work that a checklist item tracks.
---

# Checklists

Two files: `TESTFLIGHT_CHECKLIST.md` (phases 1–4 plus "Nice to have") and `ANDROID_CHECKLIST.md`.
They are the backlog; Scott's rule (2026-10-16): numbered requests go on the checklist and are done
**one at a time**, each in its own pass, to keep context clean.

## Read only what's needed
```
grep -n '^\s*- \[ \]' TESTFLIGHT_CHECKLIST.md          # every open item, with line numbers
grep -n '^\s*- \[ \] \*\*Claude' TESTFLIGHT_CHECKLIST.md # the ones that are code work
grep -n '^## ' TESTFLIGHT_CHECKLIST.md                   # the phases
sed -n '40,60p' TESTFLIGHT_CHECKLIST.md                  # one region, when editing it
```
Don't `cat` the whole file; it's long and mostly done items.

## Item style
- `- [ ] **Claude:** …` for code work in this repo; `- [ ] **You:** …` for Scott's accounts,
  decisions or content; `**You (content team):**`, `**You + clinician advisor:**` as needed.
- Imperative, one line, ending with the concrete outcome. Sub-bullets (indented `- `) hold
  notes, decisions and dates.
- Ticking: change `[ ]` to `[x]` and append the result: `Done 2026-10-20: …` or `Decided: …`.
  Keep the original text; add, don't rewrite.
- New requests go under the phase they belong to, or "Nice to have" at the end; number multi-item
  requests as sub-bullets of one item when they'll ship together.
- Owner stays accurate: if an item needs a decision before code, split it into a **You** item and
  a **Claude** item.
