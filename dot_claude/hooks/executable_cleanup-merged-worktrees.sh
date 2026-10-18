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

# 無視ファイル（.env など）は残す理由にしない。マージ済みなら worktree ごと消す（2026-10-17）
# マージ済みなのに残したものは、理由をログに書く（後から原因を追えるように）
log_file="$HOME/.local/state/cleanup-merged-worktrees.log"
removed=""; kept=""
keep() {
  kept+="kept: $1 (${2:-detached}): $3"$'\n'
  [ $dry = 0 ] && mkdir -p "${log_file%/*}" 2>/dev/null &&
    printf '%s kept: %s (%s): %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1" "${2:-detached}" "$3" >>"$log_file"
}
first_parent=$(g rev-list --first-parent "refs/heads/$def")
on_first_parent() { printf '%s\n' "$first_parent" | grep -qxF -e "$1"; }
# 子エージェントの会話記録・証拠は、無視ファイルでも失うと resume できない（2026-10-18）
has_artifacts() { [ -e "$1/.task-artifacts" ]; }
check_and_remove() {
  local wt=$1 br=$2 head=$3
  { [ "$wt" = "$main_root" ] || [ "$br" = "$def" ]; } && return
  managed "$wt" || return
  if [ -n "$br" ]; then
    g merge-base --is-ancestor "refs/heads/$br" "refs/heads/$def" 2>/dev/null || return
    has_artifacts "$wt" && { keep "$wt" "$br" ".task-artifacts あり（子の記録）"; return; }
    # 作っただけ・既定ブランチに戻しただけのブランチも「祖先」になる。先端が既定ブランチの
    # first-parent の列に載っていれば、独自のコミットがマージで入ったのではない（2026-10-18）
    on_first_parent "$(g rev-parse "refs/heads/$br")" && { keep "$wt" "$br" "独自のコミットがマージされていない（コミットなし・早送り）"; return; }
  else
    # ブランチなし（検証・レビュー用）: HEAD が既定ブランチに含まれていれば消せる
    [ -n "$head" ] && g merge-base --is-ancestor "$head" "refs/heads/$def" 2>/dev/null || return
    has_artifacts "$wt" && { keep "$wt" "$br" ".task-artifacts あり（子の記録）"; return; }
  fi
  [ -z "$(git -C "$wt" status --porcelain -uall 2>/dev/null)" ] || { keep "$wt" "$br" "未コミットの変更あり"; return; }
  in_use "$wt" && { keep "$wt" "$br" "使用中のプロセスあり"; return; }
  if [ $dry = 0 ]; then
    g worktree remove "$wt" 2>/dev/null || { keep "$wt" "$br" "git worktree remove が失敗"; return; }
    [ -n "$br" ] && g branch -d "$br" >/dev/null 2>&1
  fi
  removed+="removed: $wt (${br:-detached})"$'\n'
}

wt=""; br=""; head=""; skip=0
while IFS= read -r line; do
  case "$line" in
    "worktree "*) wt=${line#worktree }; br=""; head=""; skip=0 ;;
    "HEAD "*) head=${line#HEAD } ;;
    "branch "*) br=${line#branch refs/heads/} ;;
    locked*|prunable*) skip=1 ;;
    "") [ -n "$wt" ] && [ $skip = 0 ] && check_and_remove "$wt" "$br" "$head"; wt="" ;;
  esac
done < <(g worktree list --porcelain; echo)
[ $dry = 0 ] && g worktree prune

[ -n "$removed$kept" ] || exit 0
if [ $mode = claude ]; then
  jq -n --arg c "マージ済み worktree の片付け結果:"$'\n'"$removed$kept" \
    '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:$c}}'
else
  printf '%s' "$removed$kept"
fi
