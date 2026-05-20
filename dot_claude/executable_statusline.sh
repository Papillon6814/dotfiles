#!/bin/bash
# Claude Code Status Line
# stdin から JSON を受け取り、1行ステータスラインを出力

read -r INPUT

# jq でパース（null フォールバック付き）
MODEL=$(echo "$INPUT" | jq -r '.model.display_name // "—"')
DIR=$(echo "$INPUT" | jq -r '.workspace.current_dir // ""')
PCT=$(echo "$INPUT" | jq -r '.context_window.used_percentage // 0')
TOKENS=$(echo "$INPUT" | jq -r '.context_window.current_usage.input_tokens // 0')
DURATION_MS=$(echo "$INPUT" | jq -r '.cost.total_duration_ms // 0')

# Git ブランチ
BRANCH=""
if [ -n "$DIR" ] && [ -d "$DIR" ]; then
  BRANCH=$(git -C "$DIR" branch --show-current 2>/dev/null)
fi

# プログレスバー (10幅)
FILLED=$(( PCT / 10 ))
EMPTY=$(( 10 - FILLED ))
BAR=""
for ((i=0; i<FILLED; i++)); do BAR+="█"; done
for ((i=0; i<EMPTY; i++)); do BAR+="░"; done

# 色（ANSI）
if [ "$PCT" -ge 90 ]; then
  COLOR="\033[31m"  # 赤
elif [ "$PCT" -ge 70 ]; then
  COLOR="\033[33m"  # 黄
else
  COLOR="\033[32m"  # 緑
fi
RESET="\033[0m"

# トークン数 (1000以上は k 表記)
if [ "$TOKENS" -ge 1000 ]; then
  TOKEN_FMT="$(awk "BEGIN{printf \"%.1fk\", $TOKENS/1000}")"
else
  TOKEN_FMT="${TOKENS}"
fi

# 経過時間
TOTAL_SEC=$(( DURATION_MS / 1000 ))
MINS=$(( TOTAL_SEC / 60 ))
SECS=$(( TOTAL_SEC % 60 ))
TIME_FMT="${MINS}m ${SECS}s"

# Git ブランチ表示
GIT_FMT=""
if [ -n "$BRANCH" ]; then
  GIT_FMT=" | $BRANCH"
fi

# ディレクトリ表示 (~ 短縮)
DIR_DISPLAY="${DIR/#$HOME/~}"

printf "[%s] %s ${COLOR}%s${RESET} %d%% | %s tokens | %s%s\n" \
  "$MODEL" "$DIR_DISPLAY" "$BAR" "$PCT" "$TOKEN_FMT" "$TIME_FMT" "$GIT_FMT"
