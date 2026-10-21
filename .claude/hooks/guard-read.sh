#!/usr/bin/env bash
# PreToolUse(Read): refuse tall images. A full-size simulator screenshot (2532 px) costs
# many times the context of a 600 px one and shows nothing extra.
set -u
f=$(jq -r '.tool_input.file_path // empty')
case "$f" in *.png|*.PNG|*.jpg|*.jpeg|*.JPG) ;; *) exit 0 ;; esac
[ -f "$f" ] || exit 0
h=$(sips -g pixelHeight "$f" 2>/dev/null | awk '/pixelHeight/ {print $2}')
[ -n "$h" ] || exit 0
if [ "$h" -gt 800 ]; then
  echo "Blocked: $f is ${h}px tall. Resize before reading: sips -Z 600 \"$f\" --out \"${f%.*}-small.png\"; or take screenshots with tools/sim/sim shot, which resizes. Prefer the ui-verifier agent so the image never enters this window." >&2
  exit 2
fi
exit 0
