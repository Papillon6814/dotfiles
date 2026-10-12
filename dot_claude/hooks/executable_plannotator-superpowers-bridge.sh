#!/bin/bash
# PostToolUse(Write) hook — opens Plannotator UI when superpowers writes a plan.
# Fires only when file_path matches */docs/superpowers/plans/*.md.
# Non-blocking: launches plannotator detached and exits immediately.
#
# Debug: tail -f /tmp/plannotator-hook.log
# Test:  PLANNOTATOR_HOOK_SKIP=1 echo '<json>' | bash this-script.sh

set -e

input=$(cat || true)
[ -z "$input" ] && exit 0

file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)
[ -z "$file_path" ] && exit 0

case "$file_path" in
  */docs/superpowers/plans/*.md)
    echo "$(date '+%Y-%m-%d %H:%M:%S') fired $file_path" >> /tmp/plannotator-hook.log
    if [ -z "$PLANNOTATOR_HOOK_SKIP" ]; then
      nohup /Users/papillon/.local/bin/plannotator annotate "$file_path" </dev/null >/dev/null 2>&1 &
      disown 2>/dev/null || true
    fi
    ;;
esac

exit 0
