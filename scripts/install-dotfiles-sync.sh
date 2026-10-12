#!/bin/bash
# dotfiles 自動同期の launchd ジョブを設置する。使い方: scripts/install-dotfiles-sync.sh [--uninstall]
# 設置先のリポジトリは、このスクリプトがある checkout（通常は ~/Documents/Github/dotfiles）。
set -euo pipefail

label="com.kendrickmalar.dotfiles-sync"
repo="$(cd "$(dirname "$0")/.." && pwd)"
dest="$HOME/Library/LaunchAgents/$label.plist"
domain="gui/$(id -u)"

launchctl bootout "$domain/$label" 2>/dev/null || true
if [ "${1:-}" = "--uninstall" ]; then
  rm -f "$dest"
  echo "停止して削除しました: $dest"
  exit 0
fi

mkdir -p "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"
sed -e "s#__HOME__#$HOME#g" -e "s#__REPO__#$repo#g" "$repo/scripts/launchd/$label.plist" > "$dest"
plutil -lint "$dest" >/dev/null
launchctl bootstrap "$domain" "$dest"
echo "設置しました: $dest（リポジトリ: $repo）"
echo "ログ: $HOME/Library/Logs/dotfiles-sync.log"
