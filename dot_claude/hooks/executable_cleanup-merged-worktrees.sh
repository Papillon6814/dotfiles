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

# 親ブランチ（epic/* ＞ feat/* ＞ その他）へ --no-ff で取り込まれたら、worktree だけ先に消す。
# ブランチは既定ブランチに入るまで残し、入ったら pending の記録から消す（2026-10-27）
rank() { case "$1" in epic/*) echo 2 ;; feat/*) echo 1 ;; *) echo 0 ;; esac; }
fp_dir=$(mktemp -d "${TMPDIR:-/tmp}/cleanup-wt.XXXXXX") || exit 0
trap 'rm -rf "$fp_dir"' EXIT
merged_parent() {
  local br=$1 tip=$2 p r f
  r=$(rank "$br")
  for p in $(g for-each-ref --contains "$tip" --format='%(refname:short)' refs/heads/epic refs/heads/feat); do
    [ "$p" = "$br" ] && continue
    [ "$(rank "$p")" -gt "$r" ] || continue
    f="$fp_dir/$(printf '%s' "$p" | tr '/' '_')"
    [ -f "$f" ] || g rev-list --first-parent "refs/heads/$p" >"$f"
    grep -qxF -e "$tip" "$f" && continue
    echo "$p"; return 0
  done
  return 1
}
pending_file="$HOME/.local/state/cleanup-merged-worktrees.branches"
pending_new=""

check_and_remove() {
  local wt=$1 br=$2 head=$3 tip into=""
  { [ "$wt" = "$main_root" ] || [ "$br" = "$def" ]; } && return
  managed "$wt" || return
  # Epic は段階ごとに何度も既定ブランチへ入り、その後も続く。worktree もブランチも自動では消さない（2026-10-27）
  case "$br" in epic/*) return ;; esac
  if [ -n "$br" ]; then
    tip=$(g rev-parse "refs/heads/$br")
    if g merge-base --is-ancestor "$tip" "refs/heads/$def" 2>/dev/null; then
      has_artifacts "$wt" && { keep "$wt" "$br" ".task-artifacts あり（子の記録）"; return; }
      # 作っただけ・既定ブランチに戻しただけのブランチも「祖先」になる。先端が既定ブランチの
      # first-parent の列に載っていれば、独自のコミットがマージで入ったのではない（2026-10-18）
      on_first_parent "$tip" && { keep "$wt" "$br" "独自のコミットがマージされていない（コミットなし・早送り）"; return; }
    else
      into=$(merged_parent "$br" "$tip") || return
      has_artifacts "$wt" && { keep "$wt" "$br" ".task-artifacts あり（子の記録）"; return; }
    fi
  else
    # ブランチなし（検証・レビュー用）: HEAD が既定ブランチに含まれていれば消せる
    [ -n "$head" ] && g merge-base --is-ancestor "$head" "refs/heads/$def" 2>/dev/null || return
    has_artifacts "$wt" && { keep "$wt" "$br" ".task-artifacts あり（子の記録）"; return; }
  fi
  [ -z "$(git -C "$wt" status --porcelain -uall 2>/dev/null)" ] || { keep "$wt" "$br" "未コミットの変更あり"; return; }
  in_use "$wt" && { keep "$wt" "$br" "使用中のプロセスあり"; return; }
  if [ $dry = 0 ]; then
    g worktree remove "$wt" 2>/dev/null || { keep "$wt" "$br" "git worktree remove が失敗"; return; }
    if [ -n "$into" ]; then pending_new+="$main_root"$'\t'"$br"$'\n'
    elif [ -n "$br" ]; then g branch -d "$br" >/dev/null 2>&1; fi
  fi
  if [ -n "$into" ]; then
    removed+="removed: $wt ($br): $into に取り込み済み。ブランチは $def に入るまで残す"$'\n'
  else
    removed+="removed: $wt (${br:-detached})"$'\n'
  fi
}

# worktree だけ消したブランチを、既定ブランチに独自のコミットが入っていれば消す
sweep_pending() {
  local root br tip rest="" line wt_branches
  [ -f "$pending_file" ] || return 0
  wt_branches=$(g worktree list --porcelain | sed -n 's#^branch refs/heads/##p')
  while IFS= read -r line; do
    [ -n "$line" ] || continue
    root=${line%%$'\t'*}; br=${line#*$'\t'}
    [ "$root" = "$main_root" ] || { rest+="$line"$'\n'; continue; }
    tip=$(g rev-parse -q --verify "refs/heads/$br") || continue
    printf '%s\n' "$wt_branches" | grep -qxF -e "$br" && { rest+="$line"$'\n'; continue; }
    if g merge-base --is-ancestor "$tip" "refs/heads/$def" 2>/dev/null && ! on_first_parent "$tip"; then
      g branch -d "$br" >/dev/null 2>&1 && { removed+="removed branch: $br ($def に取り込み済み)"$'\n'; continue; }
    fi
    rest+="$line"$'\n'
  done <"$pending_file"
  printf '%s' "$rest" >"$pending_file"
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
if [ $dry = 0 ]; then
  g worktree prune
  if [ -n "$pending_new" ]; then mkdir -p "${pending_file%/*}" 2>/dev/null && printf '%s' "$pending_new" >>"$pending_file"; fi
  sweep_pending
fi

[ -n "$removed$kept" ] || exit 0
if [ $mode = claude ]; then
  jq -n --arg c "マージ済み worktree の片付け結果:"$'\n'"$removed$kept" \
    '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:$c}}'
else
  printf '%s' "$removed$kept"
fi
