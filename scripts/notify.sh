#!/bin/bash
# dotfiles 自動同期の通知。使い方: notify.sh <件名> <本文>
# 当面は macOS の通知センター。KunoMacEnver ができたら、DOTFILES_NOTIFY_COMMAND に
# 「件名と本文を引数で受け取るコマンド」を設定すれば、そちらに切り替わる。
set -u
title="${1:-dotfiles}"
body="${2:-}"

if [ -n "${DOTFILES_NOTIFY_COMMAND:-}" ]; then
  exec "$DOTFILES_NOTIFY_COMMAND" "$title" "$body"
fi

# AppleScript の文字列に入れるため、バックスラッシュと二重引用符を逃がす
esc() { printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'; }
osascript -e "display notification \"$(esc "$body")\" with title \"$(esc "$title")\"" >/dev/null 2>&1 || true
