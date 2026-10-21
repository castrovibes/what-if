---
name: run-app
description: Start, stop and check Metro and the native app with tools/run-app.sh (background Metro with a log file, readiness poll, expo run:ios, Firebase emulators, known failure modes). Use when asked to run or start the app, when the simulator shows a red error or "could not connect", or before simulator checks.
---

# Running the app

Metro runs **in the background with a log file**; nothing here asks the user to open a terminal.

```
tools/run-app.sh status                 # Metro, log, simulator, emulators, Android SDK
tools/run-app.sh start [--clear] [--env mock|emulator|firebase]
tools/run-app.sh stop | restart
tools/run-app.sh ios [--device "iPhone 16e"]   # native build+install+launch; log in .expo/run-ios.log
tools/run-app.sh android                # needs the Android SDK on PATH (not installed yet)
tools/run-app.sh emulators              # Firebase emulators, background, .expo/emulators.log
tools/run-app.sh logs [N]
tools/run-app.sh doctor [LOG]           # match a log against the known failures, print the fix
```

- `start` polls `http://localhost:8081/status` until `packager-status:running`; it never sleeps a
  fixed time. The log is `.expo/metro.log` (git-ignored); `tools/sim/sim log` reads it.
- Code changes hot-reload. Rebuild natively (`ios`) only after changing `app.json` plugins,
  native modules, fonts in `assets/fonts/`, or `ios/`. After plugin changes run
  `npx expo prebuild --clean` first and review the `ios/` diff.
- `EXPO_PUBLIC_*` values are inlined at bundle time: to change the backend, `stop`, then
  `start --clear --env mock` (no Firebase needed) or `--env emulator` (run `emulators` first).
- Dev builds show the LogBox warning toast over the tab bar; `tools/sim/sim tap 358 781` closes it.

## Known failures (what `doctor` looks for)

| Symptom | Fix |
|---|---|
| `EADDRINUSE` / port 8081 busy | `tools/run-app.sh stop`; if still held, `lsof -nP -iTCP:8081 -sTCP:LISTEN` and kill that pid |
| `Unable to resolve module` after a dependency change | `npm install`, then `restart --clear` |
| Link error mentioning `Sealable`, duplicate or undefined symbols | `cd ios && pod install`; if it persists `npx expo prebuild --clean` |
| `No such module` / module map errors | pods out of date: `cd ios && pod install` |
| `Command PhaseScriptExecution failed` | a path with spaces; the repo must stay at `~/Developer/what-if` |
| App stuck on "could not connect to development server" | Metro died: `start`, then `tools/sim/sim relaunch` |
| Red screen `auth/network-request-failed` or ECONNREFUSED | app expects the emulators: `emulators`, or restart Metro with `--env mock` |
| Watchman / `ENOSPC` | `watchman watch-del-all; ulimit -n 65536` |

Tests (`npm test`) and the type check don't need Metro; see /verify.
