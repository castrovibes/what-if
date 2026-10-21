---
name: sim
description: Drive the booted iOS Simulator from the shell with tools/sim/sim (tap, swipe, screenshot, light/dark, text size, relaunch, logs). Use for any "check it in the simulator", "take a screenshot", "tap/swipe", or "does it look right" request. Prefer the ui-verifier agent when more than one screenshot is needed, so images stay out of this window.
---

# Simulator driver

One committed driver, `tools/sim/sim`, replaces the per-session CGEvent scripts. Coordinates are
**device points** (iPhone 16e: 390 × 844, origin top-left). It calibrates itself against the
Simulator window and recalibrates when the window moves. Screenshots come back **≤ 600 px tall**.

```
tools/sim/sim status                        # simulator, app, appearance, Metro, calibration
tools/sim/sim shot NAME                     # -> $TMPDIR/what-if-sim/NAME.png (resized); --full keeps 3x
tools/sim/sim tap X Y
tools/sim/sim swipe left|right|up|down [X Y]
tools/sim/sim drag X1 Y1 X2 Y2 [ms]
tools/sim/sim appearance light|dark|toggle    # waits 1.5 s for the repaint; warns if the app's own darkMode pref overrides it
tools/sim/sim textsize default|large|largest  # Dynamic Type; the deck caps its scale at 1.6x
tools/sim/sim relaunch [--reset]            # cold start; waits for Metro's "Bundled" line, no sleep
tools/sim/sim reset-first-launch            # back to the Welcome screen
tools/sim/sim clear-pref darkMode           # drop an AsyncStorage key (in-app toggles override the system)
tools/sim/sim log [N]                       # console.log/warn/error lines from the Metro log
tools/sim/sim syslog [MIN]                  # native log for the app process (crashes)
tools/sim/sim sheet OUT.png A.png B.png     # contact sheet, labeled, for light/dark comparisons
tools/sim/sim type "text" | key return      # keyboard input
```

Taps bring the Simulator to the front (clicks go to whatever window is under the pointer), so the
editor loses focus for a moment. Metro must be started with `tools/run-app.sh start` for
`relaunch` and `log` to see its log file.

## Workflow

1. `tools/sim/sim status`. If Metro isn't running: `tools/run-app.sh start`. If nothing is booted:
   `tools/run-app.sh ios`.
2. After a code change Metro hot-reloads; for a cold start or a first-launch flow use `relaunch`.
3. `shot` what you need, then `sheet` light and dark (or before/after) into **one** image and read
   that. Never read a full-size screenshot (a hook refuses images over 800 px tall).
4. Before any dark-mode check, `status` shows "app darkMode pref": if it isn't `none`, the in-app
   toggle wins over the simulator setting; `clear-pref darkMode` then `relaunch`.
5. Dismiss the dev LogBox toast first when it's showing; it covers the tab bar: `tap 358 781`.
6. For more than a couple of screenshots, hand the whole check to the **ui-verifier** agent and act
   on its text report.

## Known tap targets (iPhone 16e, device points)

Verify against a screenshot before relying on these; layout changes move them.

| Target | Point |
|---|---|
| Tab bar: Prompts / Explore / Create / You | (67, 778) / (152, 778) / (238, 778) / (323, 778) |
| Deck title card: Start a session | (195, 695) |
| Deck action row (above the tab bar): Previous / Twist / ♥ | about (85, 690) / (195, 690) / (305, 690); Twist is absent for prompts without twists |
| Page-turn zones (empty space beside the card) | back (40, 420), forward (350, 420) |
| Skip to the next prompt | `swipe left 195 400` |
| Dev LogBox toast close (×) | (358, 781) |
| Age group / Anywhere filter pills | (60, 165) / (160, 165) |

Age card on the deck: the four age options are stacked in the card; shoot it and tap the one you
need. Welcome guide: the arrow sits in each tip card's bottom corner; `swipe left` also turns pages.

## If taps don't land

- Pointer moves but nothing happens: the Simulator wasn't in front; the driver activates it now,
  so retry once.
- Pointer doesn't move: the terminal needs **Accessibility** permission (System Settings > Privacy
  & Security > Accessibility).
- `calibrate` fails with "no light pixels": a dark or covered screen; it switches to light mode
  itself, so an in-app dark preference is set: `clear-pref darkMode` and relaunch.
- Everything is offset: `tools/sim/sim calibrate` and compare `where 0 0` with the window.
