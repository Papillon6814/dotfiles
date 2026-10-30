#!/bin/bash
# herdr-focus-notify が出す通知（alerter）を、一定時間で閉じる。
# alerter は表示中に1分あたり約20MB ずつメモリが増える。プラグインの timeout は 3600 秒の固定値で、設定では変えられない。
# 対象は --group herdr- を持つ alerter だけ。閉じると通知が消え、待っていた focus-*.sh も終わる（エージェントには影響しない）。
# 使い方: scripts/alerter-reaper.sh [--dry-run]
# 環境変数: ALERTER_REAPER_MINUTES（既定 5）、テスト用に ALERTER_REAPER_PS_CMD・ALERTER_REAPER_KILL_CMD・ALERTER_REAPER_LOG
set -u
dry=0; [ "${1:-}" = "--dry-run" ] && dry=1
minutes="${ALERTER_REAPER_MINUTES:-5}"
log_file="${ALERTER_REAPER_LOG:-$HOME/.local/state/alerter-reaper.log}"

log() {
  printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
  [ $dry = 0 ] && mkdir -p "${log_file%/*}" 2>/dev/null && printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >>"$log_file"
}

# ps の etime（[[dd-]hh:]mm:ss）を秒にする
seconds() {
  local t=$1 d=0 h=0 m s
  case $t in *-*) d=${t%%-*}; t=${t#*-} ;; esac
  case $t in *:*:*) h=${t%%:*}; t=${t#*:} ;; esac
  m=${t%%:*}; s=${t#*:}
  echo $(( 10#$d * 86400 + 10#$h * 3600 + 10#$m * 60 + 10#$s ))
}

limit=$((minutes * 60)); closed=0
while read -r pid etime cmd; do
  # 実行ファイル名が alerter で、herdr のグループを持つものだけ
  case "${cmd%% *}" in */alerter|alerter) ;; *) continue ;; esac
  case " $cmd " in *" --group herdr-"*) ;; *) continue ;; esac
  [ "$(seconds "$etime")" -ge "$limit" ] || continue
  if [ $dry = 1 ]; then
    log "would close: $pid（${etime}）"
  else
    ${ALERTER_REAPER_KILL_CMD:-kill} -TERM "$pid" 2>/dev/null && log "closed: $pid（${etime}）"
  fi
  closed=$((closed + 1))
done < <(${ALERTER_REAPER_PS_CMD:-ps -axo pid=,etime=,command=} 2>/dev/null)
[ $dry = 0 ] && [ $closed -gt 0 ] && log "合計 ${closed} 件"
exit 0
