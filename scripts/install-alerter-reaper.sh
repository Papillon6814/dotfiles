#!/bin/bash
# herdr の通知（alerter）を一定時間で閉じる launchd ジョブを設置する。
# 使い方: scripts/install-alerter-reaper.sh            （設置して、すぐ1回動かす）
#         scripts/install-alerter-reaper.sh --render   （設置せず標準出力へ）
#         scripts/install-alerter-reaper.sh --uninstall
# 設置先のリポジトリは、このスクリプトがある checkout（通常は ~/Code/dotfiles）。
set -euo pipefail

label="com.kendrickmalar.alerter-reaper"
repo="$(cd "$(dirname "$0")/.." && pwd)"
dest="$HOME/Library/LaunchAgents/$label.plist"
domain="gui/$(id -u)"

render() { sed -e "s#__HOME__#$HOME#g" -e "s#__REPO__#$repo#g" "$repo/scripts/launchd/$label.plist"; }

case "${1:-}" in
  --render) render; exit 0 ;;
  --uninstall)
    launchctl bootout "$domain/$label" 2>/dev/null || true
    rm -f "$dest"; echo "停止して削除しました: ${dest}"; exit 0 ;;
esac

mkdir -p "$HOME/Library/LaunchAgents" "$HOME/.local/state"
# 新しい plist を隣の一時ファイルに作って確かめてから差し替える。失敗しても動いているジョブと今の plist は残す
tmp="$(mktemp "$dest.XXXXXX")"
trap 'rm -f "$tmp"' EXIT
render > "$tmp"
plutil -lint "$tmp" >/dev/null
chmod 644 "$tmp"
launchctl bootout "$domain/$label" 2>/dev/null || true
mv "$tmp" "$dest"
launchctl bootstrap "$domain" "$dest"
echo "設置しました: ${dest}（リポジトリ: ${repo}）"
echo "ログ: $HOME/.local/state/alerter-reaper.log"
