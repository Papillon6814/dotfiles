#!/bin/bash
# マージ済みで未使用の worktree とブランチを片付ける（--force は使わない）
# usage: cleanup-merged-worktrees.sh [--dry-run] [DIR]
#        cleanup-merged-worktrees.sh --from-command CMD CWD    (pi 拡張から)
#        cleanup-merged-worktrees.sh --claude-post-tool-use    (stdin: hook JSON)
set -u
dry=0; mode=dir
case "${1:-}" in
  --dry-run) dry=1; shift ;;
  --from-command) mode=cmd ;;
  --claude-post-tool-use) mode=claude ;;
esac

# コマンド文字列から対象ディレクトリを決める。git merge でなければ何も出さない
dir_from_command() {
  local cmd=$1 cwd=$2 p
  printf '%s' "$cmd" | grep -qE '(^|[;&|[:space:]])git([[:space:]]+-C[[:space:]]+[^[:space:]]+)?[[:space:]]+merge([[:space:]]|$)' || return 0
  p=$(printf '%s' "$cmd" | sed -nE 's/.*git[[:space:]]+-C[[:space:]]+([^[:space:]]+)[[:space:]]+merge.*/\1/p' | head -1)
  [ -z "$p" ] && p=$(printf '%s' "$cmd" | sed -nE 's/^[[:space:]]*cd[[:space:]]+([^[:space:];&]+)[[:space:]]*&&.*/\1/p' | head -1)
  p=${p/#\~/$HOME}; p=${p//\"/}; p=${p//\'/}
  case "$p" in "") echo "$cwd" ;; /*) echo "$p" ;; *) echo "$cwd/$p" ;; esac
}

case $mode in
  cmd) dir=$(dir_from_command "${2:-}" "${3:-$PWD}") ;;
  claude)
    input=$(cat)
    dir=$(dir_from_command "$(jq -r '.tool_input.command // empty' <<<"$input")" "$(jq -r '.cwd // empty' <<<"$input")") ;;
  *) dir=${1:-$PWD} ;;
esac
[ -n "$dir" ] || exit 0

git -C "$dir" rev-parse --git-dir >/dev/null 2>&1 || exit 0
main_root=$(git -C "$dir" worktree list --porcelain | sed -n '1s/^worktree //p')
[ -n "$main_root" ] || exit 0
g() { git -C "$main_root" "$@"; }

# 既定ブランチ（ローカル）: origin/HEAD の指す名前、なければ main → master
def=$(g symbolic-ref --short -q refs/remotes/origin/HEAD 2>/dev/null); def=${def#origin/}
if [ -z "$def" ] || ! g show-ref -q --verify "refs/heads/$def"; then
  def=""
  for b in main master; do g show-ref -q --verify "refs/heads/$b" && { def=$b; break; }; done
fi
[ -n "$def" ] || exit 0

managed() {
  case "$1" in
    */.claude/worktrees/*|*/.worktrees/*|"$HOME"/.config/superpowers/worktrees/*|"$HOME"/.pi/agent/worktrees/*) return 0 ;;
  esac
  return 1
}

# 全プロセスの cwd（フック自身と、別ペインの Claude / pi を含む）
cwds=$(${CLEANUP_WT_LSOF_CMD:-lsof -a -d cwd -Fn} 2>/dev/null | sed -n 's/^n//p')
in_use() {
  local wt
  wt=$(cd "$1" && pwd -P) || return 0
  printf '%s\n' "$cwds" | grep -qxF -e "$wt" && return 0
  printf '%s\n' "$cwds" | grep -qF -e "$wt/"
}

# worktree remove は無視ファイルも消すため、作り直せるもの以外があれば残す
valuable_ignored() {
  git -C "$1" status --porcelain --ignored -uall 2>/dev/null | sed -n 's/^!! //p' \
    | grep -vE '(^|/)(node_modules|\.venv|__pycache__)/|(^|/)\.DS_Store$' | grep -q .
}

removed=""
check_and_remove() {
  local wt=$1 br=$2
  { [ "$wt" = "$main_root" ] || [ -z "$br" ] || [ "$br" = "$def" ]; } && return
  managed "$wt" || return
  g merge-base --is-ancestor "refs/heads/$br" "refs/heads/$def" 2>/dev/null || return
  # 作っただけでコミットのないブランチも「祖先」になるため、reflog で除外する
  [ "$(g reflog show --format=%H "refs/heads/$br" 2>/dev/null | wc -l)" -ge 2 ] || return
  [ -z "$(git -C "$wt" status --porcelain -uall 2>/dev/null)" ] || return
  valuable_ignored "$wt" && return
  in_use "$wt" && return
  if [ $dry = 0 ]; then
    g worktree remove "$wt" 2>/dev/null || return
    g branch -d "$br" >/dev/null 2>&1
  fi
  removed+="removed: $wt ($br)"$'\n'
}

wt=""; br=""; skip=0
while IFS= read -r line; do
  case "$line" in
    "worktree "*) wt=${line#worktree }; br=""; skip=0 ;;
    "branch "*) br=${line#branch refs/heads/} ;;
    detached|locked*|prunable*) skip=1 ;;
    "") [ -n "$wt" ] && [ $skip = 0 ] && check_and_remove "$wt" "$br"; wt="" ;;
  esac
done < <(g worktree list --porcelain; echo)
[ $dry = 0 ] && g worktree prune

[ -n "$removed" ] || exit 0
if [ $mode = claude ]; then
  jq -n --arg c "マージ済み worktree を片付けました:"$'\n'"$removed" \
    '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:$c}}'
else
  printf '%s' "$removed"
fi
