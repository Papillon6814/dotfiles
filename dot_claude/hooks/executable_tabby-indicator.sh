#!/bin/bash
# Claude Code の状態を tabby サイドバーに反映する（busy=作業中 / input=返答待ち / bell=完了）
# usage: tabby-indicator.sh <prompt|tool-done|ask|notify|stop|end>

TABBY="$HOME/.tmux/plugins/tabby/bin/tabby"
[ -n "$TMUX_PANE" ] && [ -x "$TABBY" ] || exit 0

ind() { "$TABBY" hook set-indicator "$1" "$2" >/dev/null 2>&1; }
opt() { tmux show-options -wqv -t "$TMUX_PANE" "@tabby_$1" 2>/dev/null; }

case "$1" in
  prompt)
    [ -n "$(opt input)" ] && ind input 0
    ind busy 1
    ;;
  tool-done)
    # input 1 は busy を落とすため、許可・質問への回答後に立て直す
    if [ -z "$(opt busy)" ]; then
      [ -n "$(opt input)" ] && ind input 0
      ind busy 1
    fi
    ;;
  ask)
    ind input 1
    ;;
  notify)
    case "$(jq -r '.notification_type // empty' 2>/dev/null)" in
      permission_prompt|elicitation_dialog) ind input 1 ;;
      # 中断（Esc）では Stop が発火しないため、プロンプトで待機中なら busy を落とす
      idle_prompt) [ -n "$(opt busy)" ] && ind busy 0 ;;
    esac
    ;;
  stop)
    # バックグラウンドタスクが残っている間は作業中のままにする
    running=$(jq -r '[.background_tasks[]? | select(.status == "running")] | length' 2>/dev/null)
    [ "${running:-0}" -gt 0 ] 2>/dev/null && exit 0
    ind bell 1
    ;;
  end)
    ind busy 0
    ind input 0
    ind bell 0
    ;;
esac

exit 0
