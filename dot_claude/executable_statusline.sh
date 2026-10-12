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
CACHE_RATIO=$(echo "$INPUT" | jq -r '.prompt_cache.hit_ratio // empty')
CACHE_MISSES=$(echo "$INPUT" | jq -r '.prompt_cache.misses // 0')
CACHE_REBUILDS=$(echo "$INPUT" | jq -r '.prompt_cache.expected_rebuilds // 0')
CACHE_WARM=$(echo "$INPUT" | jq -r '
  if .prompt_cache.warm == true then "warm"
  elif .prompt_cache.warm == false then "cold"
  else "—"
  end
')

if [ -n "$CACHE_RATIO" ]; then
  CACHE_PCT=$(awk -v ratio="$CACHE_RATIO" 'BEGIN {printf "%.0f", ratio * 100}')
  CACHE_FMT="cache ${CACHE_PCT}%/${CACHE_MISSES}m/${CACHE_REBUILDS}r/${CACHE_WARM}"
else
  CACHE_FMT="cache —"
fi

# ログイン中アカウント（設定ディレクトリの .claude.json から）
EMAIL=$(jq -r '.oauthAccount.emailAddress // ""' "${CLAUDE_CONFIG_DIR:-$HOME}/.claude.json" 2>/dev/null)
EMAIL_FMT=""
if [ -n "$EMAIL" ]; then
  EMAIL_FMT="\033[36m${EMAIL}\033[0m "
fi

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

printf "[%s] ${EMAIL_FMT}%s ${COLOR}%s${RESET} %d%% | %s tokens | %s | %s%s\n" \
  "$MODEL" "$DIR_DISPLAY" "$BAR" "$PCT" "$TOKEN_FMT" "$TIME_FMT" "$CACHE_FMT" "$GIT_FMT"
