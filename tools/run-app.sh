#!/usr/bin/env bash
# Run the app the way sessions actually do: Metro in the background with a log file,
# a readiness poll instead of a sleep, native builds with their logs kept, and a
# `doctor` that names the known failure modes. See .claude/skills/run-app/SKILL.md.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
LOG_DIR="$ROOT/.expo"; mkdir -p "$LOG_DIR"
METRO_LOG="${WHATIF_METRO_LOG:-$LOG_DIR/metro.log}"
PID_FILE="$LOG_DIR/metro.pid"
PORT="${WHATIF_METRO_PORT:-8081}"
STATUS_URL="http://localhost:$PORT/status"

die() { echo "run-app: $*" >&2; exit 1; }
metro_up() { [ "$(curl -s -m 2 "$STATUS_URL" 2>/dev/null)" = "packager-status:running" ]; }
port_owner() { lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null | head -1 || true; }

# --env mock|emulator|firebase -> EXPO_PUBLIC_* for this Metro run. These are inlined at
# bundle time, so changing them means restarting Metro (and usually --clear).
env_for() {
  case "${1:-}" in
    "") ;;
    mock) echo "EXPO_PUBLIC_AUTH_BACKEND=mock" ;;
    emulator) echo "EXPO_PUBLIC_AUTH_BACKEND=firebase EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true" ;;
    firebase) echo "EXPO_PUBLIC_AUTH_BACKEND=firebase EXPO_PUBLIC_USE_FIREBASE_EMULATOR=false" ;;
    *) die "--env must be mock, emulator or firebase" ;;
  esac
}

wait_for_metro() {
  local deadline=$((SECONDS + ${1:-90}))
  while [ $SECONDS -lt $deadline ]; do
    metro_up && return 0
    if [ -n "${METRO_PID:-}" ] && ! kill -0 "$METRO_PID" 2>/dev/null; then
      echo "run-app: Metro exited; last lines of $METRO_LOG:" >&2; tail -n 20 "$METRO_LOG" >&2; return 1
    fi
    sleep 1
  done
  echo "run-app: Metro did not answer on $STATUS_URL within ${1:-90} s" >&2; return 1
}

start() {
  local clear="" envspec="" extra=()
  while [ $# -gt 0 ]; do
    case "$1" in
      --clear) clear="--clear" ;;
      --env) envspec=$(env_for "$2"); shift ;;
      *) extra+=("$1") ;;
    esac; shift
  done
  if metro_up; then
    echo "run-app: Metro already running on $PORT (log: $([ -f "$METRO_LOG" ] && echo "$METRO_LOG" || echo 'none; started outside run-app'))"
    [ -n "$clear$envspec" ] && echo "run-app: restart it with 'stop' first to apply --clear or --env"
    return 0
  fi
  local owner; owner=$(port_owner)
  [ -n "$owner" ] && die "port $PORT is held by pid $owner ($(ps -o comm= -p "$owner")); run 'tools/run-app.sh stop' or kill it"
  : > "$METRO_LOG"
  # No CI=1 here: it turns off Metro's file watching, so edits never reach the app.
  # Without a TTY (stdin from /dev/null) Expo CLI doesn't wait on interactive keys.
  ( env EXPO_NO_TELEMETRY=1 $envspec nohup npx expo start --port "$PORT" $clear "${extra[@]}" < /dev/null >> "$METRO_LOG" 2>&1 & echo $! > "$PID_FILE" )
  METRO_PID=$(cat "$PID_FILE")
  echo "run-app: starting Metro (pid $METRO_PID${envspec:+, $envspec}) -> $METRO_LOG"
  wait_for_metro 90 && echo "run-app: Metro ready on $STATUS_URL"
}

stop() {
  local pid; pid=$(cat "$PID_FILE" 2>/dev/null || true)
  [ -n "$pid" ] && kill "$pid" 2>/dev/null && echo "run-app: stopped Metro pid $pid" || true
  pkill -f "expo start" 2>/dev/null && echo "run-app: stopped other 'expo start' processes" || true
  rm -f "$PID_FILE"
  local owner; owner=$(port_owner)
  [ -n "$owner" ] && echo "run-app: port $PORT still held by pid $owner ($(ps -o comm= -p "$owner"))" || true
}

status() {
  echo "metro: $(metro_up && echo "running on $PORT" || echo "not running")$( [ -f "$PID_FILE" ] && echo " (pid $(cat "$PID_FILE"))")"
  echo "log: $([ -f "$METRO_LOG" ] && echo "$METRO_LOG ($(wc -l < "$METRO_LOG" | tr -d ' ') lines)" || echo none)"
  echo "simulator: $(xcrun simctl list devices booted 2>/dev/null | grep '(Booted)' | sed 's/^ *//' || echo none)"
  echo "emulators: $(curl -s -m 1 -o /dev/null -w '%{http_code}' http://localhost:4000 2>/dev/null | grep -q 200 && echo "running (UI on :4000)" || echo "not running")"
  echo "android: $(command -v adb >/dev/null && (adb devices 2>/dev/null | grep -c 'device$' | sed 's/$/ device(s)/') || echo 'no adb on PATH (Android SDK not installed)')"
}

run_ios() {
  metro_up || start
  local log="$LOG_DIR/run-ios.log"
  echo "run-app: npx expo run:ios $* -> $log (this builds the native app; a few minutes on first build)"
  if env CI=1 npx expo run:ios "$@" > "$log" 2>&1; then
    echo "run-app: iOS build installed and launched"
  else
    echo "run-app: build failed; tail of $log:" >&2; tail -n 40 "$log" >&2; doctor "$log"; return 1
  fi
}

run_android() {
  command -v adb >/dev/null || die "no Android SDK on PATH; install Android Studio, then set ANDROID_HOME (see ANDROID_CHECKLIST.md)"
  metro_up || start
  local log="$LOG_DIR/run-android.log"
  echo "run-app: npx expo run:android $* -> $log"
  if env CI=1 npx expo run:android "$@" > "$log" 2>&1; then
    echo "run-app: Android build installed and launched"
  else
    echo "run-app: build failed; tail of $log:" >&2; tail -n 40 "$log" >&2; doctor "$log"; return 1
  fi
}

emulators() {
  local log="$LOG_DIR/emulators.log"
  if curl -s -m 1 -o /dev/null http://localhost:4000; then echo "run-app: Firebase emulators already running"; return; fi
  ( nohup npm run emulators >> "$log" 2>&1 & )
  echo "run-app: starting Firebase emulators -> $log"
  local deadline=$((SECONDS + 60))
  while [ $SECONDS -lt $deadline ]; do curl -s -m 1 -o /dev/null http://localhost:4000 && { echo "run-app: emulators ready (UI on :4000)"; return; }; sleep 1; done
  echo "run-app: emulators not ready after 60 s; see $log" >&2; tail -n 20 "$log" >&2; return 1
}

doctor() {
  # Known failure modes from past sessions, with the fix for each.
  local log="${1:-$METRO_LOG}"
  [ -f "$log" ] || { echo "run-app: no log at $log"; return; }
  local hit=0
  grep -q -E "EADDRINUSE|already running on port|Port $PORT is being used" "$log" && { hit=1; echo "- Port $PORT busy: tools/run-app.sh stop (or kill the pid from: lsof -nP -iTCP:$PORT -sTCP:LISTEN)"; }
  grep -q -E "Unable to resolve module|Cannot find module|Module not found" "$log" && { hit=1; echo "- Stale module graph or missing dependency: npm install, then tools/run-app.sh stop && tools/run-app.sh start --clear"; }
  grep -q -E "Sealable|duplicate symbol|Undefined symbols|ld: " "$log" && { hit=1; echo "- Native link error: cd ios && pod install; if it persists, npx expo prebuild --clean (ios/ is committed, review the diff)"; }
  grep -q -E "No such module|module map file|Could not build Objective-C module" "$log" && { hit=1; echo "- Pods out of date: cd ios && pod install, or npx expo prebuild --clean after plugin changes in app.json"; }
  grep -q -E "Unable to boot|device.*not found|No simulator" "$log" && { hit=1; echo "- Simulator not booted: open -a Simulator, then xcrun simctl boot 'iPhone 16e'"; }
  grep -q -E "xcodebuild.*error|error: The sandbox is not in sync|Command PhaseScriptExecution failed" "$log" && { hit=1; echo "- Xcode build script failed: paths with spaces break Expo's scripts (repo must stay at ~/Developer/what-if); see $LOG_DIR/xcodebuild-error.log"; }
  grep -q -E "Error: .*ENOSPC|watchman" "$log" && { hit=1; echo "- File watcher trouble: watchman watch-del-all; ulimit -n 65536"; }
  grep -q -E "Firebase.*(ECONNREFUSED|not running)|auth/network-request-failed" "$log" && { hit=1; echo "- App expects the Firebase emulators: tools/run-app.sh emulators, or start Metro with --env mock"; }
  [ $hit = 0 ] && echo "run-app: no known failure pattern in $log"
}

case "${1:-help}" in
  start) shift; start "$@" ;;
  stop) stop ;;
  restart) shift; stop; start "$@" ;;
  status) status ;;
  ios) shift; run_ios "$@" ;;
  android) shift; run_android "$@" ;;
  emulators) emulators ;;
  logs) tail -n "${2:-40}" "$METRO_LOG" ;;
  doctor) shift; doctor "$@" ;;
  *) cat <<'USAGE'
usage: tools/run-app.sh COMMAND
  start [--clear] [--env mock|emulator|firebase]   Metro in the background, log in .expo/metro.log, waits until ready
  stop | restart [...]                              stop Metro (and stray 'expo start' processes)
  status                                            Metro, log, simulator, Firebase emulators, Android
  ios [expo run:ios args]                           native build + install + launch on the booted simulator (starts Metro if needed)
  android [expo run:android args]                   same for an emulator (needs the Android SDK)
  emulators                                         Firebase emulators in the background (.expo/emulators.log)
  logs [N]                                          last N Metro lines
  doctor [LOG]                                      match a log against the known failure modes and print the fix
USAGE
  [ "${1:-help}" = help ] || exit 1 ;;
esac
