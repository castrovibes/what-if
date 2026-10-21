#!/usr/bin/env bash
# PostToolUse(Bash): any simulator screenshot taken by hand is resized in place to
# <=600 px tall (tools/sim/sim shot already does this; --full or KEEP_FULL=1 opts out).
set -u
cmd=$(jq -r '.tool_input.command // empty')
echo "$cmd" | grep -q 'simctl io' || exit 0
echo "$cmd" | grep -q 'screenshot' || exit 0
echo "$cmd" | grep -q -E -- '--full|KEEP_FULL=1|tools/sim/sim' && exit 0
for f in $(echo "$cmd" | grep -o -E '[^[:space:]"'"'"']+\.png'); do
  [ -f "$f" ] || continue
  h=$(sips -g pixelHeight "$f" 2>/dev/null | awk '/pixelHeight/ {print $2}')
  [ -n "$h" ] && [ "$h" -gt 600 ] && sips -Z 600 "$f" --out "$f" >/dev/null 2>&1 && echo "resized $f to <=600 px (KEEP_FULL=1 to keep full size)"
done
exit 0
