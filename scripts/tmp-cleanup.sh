#!/bin/bash
# /private/tmp に作りっぱなしになる大きな作業場（ael-*・scaffold-pr-*）を片付ける。
# 対象は直下の項目だけ。中のどれかが3日以内に更新されたもの、どれかのプロセスが開いているものは残す。
# 使い方: scripts/tmp-cleanup.sh [--dry-run]
# 環境変数（テスト用）: TMP_CLEANUP_ROOT・TMP_CLEANUP_DAYS・TMP_CLEANUP_LSOF_CMD・TMP_CLEANUP_LOG
set -u
dry=0; [ "${1:-}" = "--dry-run" ] && dry=1
root="${TMP_CLEANUP_ROOT:-/private/tmp}"
days="${TMP_CLEANUP_DAYS:-3}"
log_file="${TMP_CLEANUP_LOG:-$HOME/.local/state/tmp-cleanup.log}"
patterns=('ael-*' 'scaffold-pr-*')

log() {
  printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
  [ $dry = 0 ] && mkdir -p "${log_file%/*}" 2>/dev/null && printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >>"$log_file"
}

# 開いているファイルと cwd を一度だけ集める（結果が空なら lsof の失敗とみなし、何も消さない）
open_paths=$(${TMP_CLEANUP_LSOF_CMD:-lsof -Fn} 2>/dev/null | sed -n 's/^n//p')
[ -n "$open_paths" ] || { log "lsof の結果が空なので中止"; exit 0; }
in_use() { printf '%s\n' "$open_paths" | grep -qF -e "$1/" || printf '%s\n' "$open_paths" | grep -qxF -e "$1"; }

cd "$root" 2>/dev/null || exit 0
root=$(pwd -P)
removed=0; freed=0
shopt -s nullglob
for name in "${patterns[@]}"; do
  for entry in $name; do
    path="$root/$entry"
    [ -e "$path" ] || [ -L "$path" ] || continue
    # 中身のどれかが新しければ使用中とみなす（直下の mtime だけでは中の書き込みが分からない）
    [ -n "$(/usr/bin/find -P "$path" -mtime "-${days}" -print -quit 2>/dev/null)" ] && continue
    in_use "$path" && { log "kept: $path（プロセスが開いている）"; continue; }
    kb=$(du -sk "$path" 2>/dev/null | cut -f1); kb=${kb:-0}
    if [ $dry = 1 ]; then
      log "would remove: $path（${kb}KB）"
    else
      rm -rf -- "$path" 2>/dev/null
      if [ -e "$path" ] || [ -L "$path" ]; then log "kept: $path（消せなかった）"; continue; fi
      log "removed: $path（${kb}KB）"
    fi
    removed=$((removed + 1)); freed=$((freed + kb))
  done
done
[ $removed -gt 0 ] && log "合計 ${removed} 件・$((freed / 1024))MB"
exit 0
