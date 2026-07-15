#!/bin/bash
# after-new-window hook: assign ungrouped new windows to the "AI" group.
# Windows that already have @tabby_group set (e.g. created via `tabby new-window`)
# are left untouched.
set -u
win_id=$(tmux display-message -p '#{window_id}')
[ -z "$win_id" ] && exit 0

group=$(tmux show-option -wqv -t "$win_id" @tabby_group)
[ -n "$group" ] && exit 0

# Ensure the "AI" group exists in the tabby config (idempotent guard via grep)
config_file="$HOME/.config/tabby/config.yaml"
if ! grep -qE '^\s*-\s*name:\s*AI\s*$' "$config_file" 2>/dev/null; then
  "$HOME/.tmux/plugins/tabby/bin/tabby" manage-group add AI >/dev/null 2>&1 || true
fi

tmux set-window-option -t "$win_id" @tabby_group "AI"

# Nudge the daemon so the sidebar reflects the new grouping
"$HOME/.tmux/plugins/tabby/scripts/signal-daemon.sh" >/dev/null 2>&1 || true
