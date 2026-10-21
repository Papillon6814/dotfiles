#!/bin/bash
# scaffold-watchdog の launchd ジョブを設置する。
# 使い方: scripts/install-scaffold-watchdog.sh <pi-scaffold の導入先> <pi-subagents の導入先>
#         scripts/install-scaffold-watchdog.sh --render <pi-scaffold> <pi-subagents>   （設置せず標準出力へ）
#         scripts/install-scaffold-watchdog.sh --uninstall
# 例: ~/.pi/local-packages/pi-scaffold/<commit> と ~/.pi/agent/local/pi-subagents-<commit>
set -euo pipefail

label="com.kendrickmalar.scaffold-watchdog"
repo="$(cd "$(dirname "$0")/.." && pwd)"
dest="$HOME/Library/LaunchAgents/$label.plist"
domain="gui/$(id -u)"

render() {
  [ -f "$1/bin/scaffold-watchdog" ] || { echo "見つかりません: $1/bin/scaffold-watchdog" >&2; exit 1; }
  [ -f "$2/scripts/reconcile-stale-runs.ts" ] || { echo "見つかりません: $2/scripts/reconcile-stale-runs.ts" >&2; exit 1; }
  sed -e "s#__HOME__#$HOME#g" -e "s#__PI_SCAFFOLD__#$1#g" -e "s#__PI_SUBAGENTS__#$2#g" "$repo/scripts/launchd/$label.plist"
}

case "${1:-}" in
  --render) render "${2:?pi-scaffold}" "${3:?pi-subagents}"; exit 0 ;;
  --uninstall)
    launchctl bootout "$domain/$label" 2>/dev/null || true
    rm -f "$dest"; echo "停止して削除しました: ${dest}"; exit 0 ;;
esac

scaffold="${1:?pi-scaffold の導入先を指定してください}"; subagents="${2:?pi-subagents の導入先を指定してください}"
mkdir -p "$HOME/Library/LaunchAgents" "$HOME/.local/state"
# 新しい plist を隣の一時ファイルに作って確かめてから差し替える。失敗しても動いているジョブと今の plist は残す
tmp="$(mktemp "$dest.XXXXXX")"
trap 'rm -f "$tmp"' EXIT
render "$scaffold" "$subagents" > "$tmp"
plutil -lint "$tmp" >/dev/null
chmod 644 "$tmp"
launchctl bootout "$domain/$label" 2>/dev/null || true
mv "$tmp" "$dest"
launchctl bootstrap "$domain" "$dest"
echo "設置しました: ${dest}"
echo "ログ: $HOME/.local/state/scaffold-watchdog.log"
