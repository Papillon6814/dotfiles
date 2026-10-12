#!/bin/bash
# dotfiles の自動同期。launchd から5分ごとに呼ばれる（scripts/launchd/ を参照）。
#
# 1. 外れた symlink を直す（道具が保存時にリンクを普通のファイルへ置き換えた場合）
# 2. 編集が落ち着いていれば、検査（pre-commit）を通して main にコミットし、push する
# 3. コピー型ファイルのずれと、管理フォルダに現れた新しい未登録ファイルを通知する
# 4. 1日1回 Brewfile を作り直す
#
# 環境変数:
#   DOTFILES_SYNC_DRY_RUN=1   書き込み・コミット・push をせず、何をするかだけ表示する
#   DOTFILES_SYNC_QUIET_SECS  最後の変更からこの秒数たつまで待つ（既定 180）
set -uo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export LANG="${LANG:-ja_JP.UTF-8}"

repo="$(cd "$(dirname "$0")/.." && pwd)"
here="$repo/scripts"
state="${XDG_STATE_HOME:-$HOME/.local/state}/dotfiles-sync"
dry="${DOTFILES_SYNC_DRY_RUN:-0}"
quiet_secs="${DOTFILES_SYNC_QUIET_SECS:-180}"
host="$(chezmoi execute-template '{{ .chezmoi.hostname }}' 2>/dev/null || hostname -s)"
mkdir -p "$state"

log() { printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }
run() { if [ "$dry" = 1 ]; then log "[dry-run] $*"; else "$@"; fi; }

# 同じ内容の通知は繰り返さない。key ごとに本文のハッシュを覚えておく
notify_once() {
  local key="$1" title="$2" body="$3" h
  h="$(printf '%s' "$body" | shasum -a 256 | cut -c1-16)"
  if [ "$(cat "$state/notified-$key" 2>/dev/null)" = "$h" ]; then return 0; fi
  log "通知: $title / $body"
  [ "$dry" = 1 ] || { "$here/notify.sh" "$title" "$body"; printf '%s' "$h" > "$state/notified-$key"; }
}
clear_notice() { rm -f "$state/notified-$1"; }

# 二重起動を防ぐ
lock="$state/lock"
if ! mkdir "$lock" 2>/dev/null; then
  if [ -n "$(find "$lock" -maxdepth 0 -mmin +30 2>/dev/null)" ]; then
    rmdir "$lock" 2>/dev/null; mkdir "$lock" 2>/dev/null || exit 0
  else
    log "前回の同期が実行中なので終了"; exit 0
  fi
fi
trap 'rmdir "$lock" 2>/dev/null' EXIT

cd "$repo" || exit 1

# --- 前提の確認: main にいて、途中の操作がないこと ---
branch="$(git symbolic-ref --short -q HEAD || echo '(detached)')"
gitdir="$(git rev-parse --git-dir)"
if [ "$branch" != main ]; then
  notify_once branch "dotfiles 同期を停止中" "保管庫が main ではなく $branch です。ホームの設定もこのブランチを指しています"
  exit 0
fi
if [ -d "$gitdir/rebase-merge" ] || [ -d "$gitdir/rebase-apply" ] || [ -f "$gitdir/MERGE_HEAD" ]; then
  notify_once midop "dotfiles 同期を停止中" "保管庫でマージか rebase が途中です"
  exit 0
fi
clear_notice branch; clear_notice midop

# --- 1. chezmoi の状態を見て、外れた symlink を直し、コピー型のずれを集める ---
copy_drift=""
while IFS= read -r line; do
  [ -n "$line" ] || continue
  target="${line:3}"
  path="$HOME/$target"
  src="$(chezmoi source-path "$path" 2>/dev/null)" || continue
  base="$(basename "$src")"
  if [ -f "$path" ] && [ ! -L "$path" ] && [[ "$base" != *.tmpl && "$base" != *executable_* && "$base" != private_* && "$base" != create_* ]]; then
    # リンクだったはずのものが普通のファイルになった。ホーム側が新しいので取り込んでからリンクに戻す
    log "外れたリンクを修復: $target"
    run chezmoi re-add "$path" && run chezmoi apply --force "$path"
  elif [ -f "$path" ] && [ ! -L "$path" ]; then
    copy_drift+="$target"$'\n'
  fi
done < <(chezmoi status 2>/dev/null)

if [ -n "$copy_drift" ]; then
  notify_once copydrift "dotfiles: コピー型ファイルがずれています" "$(printf '%s' "$copy_drift" | head -5 | tr '\n' ' ')（chezmoi diff で確認し、re-add か apply）"
else
  clear_notice copydrift
fi

# --- 2. 新しい未登録ファイルの通知（既存分は基準として記録し、新顔だけ知らせる） ---
managed_dirs=( "$HOME/.claude" "$HOME/.pi/agent" "$HOME/.agents/skills" "$HOME/.codex/skills" "$HOME/.codex/agents" "$HOME/.config/fish" "$HOME/.config/herdr" "$HOME/.config/nvim" )
unmanaged="$(chezmoi unmanaged "${managed_dirs[@]}" 2>/dev/null | grep -v -E '\.bak|backup|\.log$|\.lock$' | sort)"
baseline="$state/unmanaged-baseline"
if [ ! -f "$baseline" ]; then
  [ "$dry" = 1 ] || printf '%s\n' "$unmanaged" > "$baseline"
  log "未登録ファイルの基準を作成（$(printf '%s\n' "$unmanaged" | grep -c .) 件）"
else
  new_unmanaged="$(comm -13 "$baseline" <(printf '%s\n' "$unmanaged") | grep .)"
  if [ -n "$new_unmanaged" ]; then
    notify_once unmanaged "dotfiles: 未登録の新しいファイル" "$(printf '%s' "$new_unmanaged" | head -5 | tr '\n' ' ')（管理するなら chezmoi add、しないなら .chezmoiignore）"
  else
    clear_notice unmanaged
  fi
fi

# --- 3. Brewfile を1日1回作り直す ---
brewfile="$repo/brew/Brewfile.$host"
if [ ! -f "$brewfile" ] || [ -n "$(find "$brewfile" -mtime +0 2>/dev/null)" ]; then
  log "Brewfile を更新"
  run brew bundle dump --file="$brewfile" --force >/dev/null 2>&1
fi

# --- 4. 変更があればコミットする（編集が落ち着いてから） ---
changed="$(git status --porcelain --untracked-files=all)"
if [ -n "$changed" ]; then
  now="$(date +%s)"; newest=0
  while IFS= read -r f; do
    [ -e "$f" ] || continue
    m="$(stat -f %m "$f" 2>/dev/null || echo 0)"
    [ "$m" -gt "$newest" ] && newest="$m"
  done < <(git status --porcelain --untracked-files=all -z | tr '\0' '\n' | sed -E 's/^.. //' | grep .)
  if [ $((now - newest)) -lt "$quiet_secs" ]; then
    log "編集中のため次の回に回す（最終変更から $((now - newest)) 秒）"
    exit 0
  fi

  files="$(git status --porcelain --untracked-files=all | sed -E 's/^.. //' | sed -E 's#^(dot_|private_)##' | head -3 | tr '\n' ' ')"
  count="$(printf '%s\n' "$changed" | grep -c .)"
  msg="auto: $count 件の設定を同期（$host）"$'\n\n'"$(printf '%s\n' "$changed" | head -40)"
  if [ "$dry" = 1 ]; then
    log "[dry-run] コミット予定: $count 件 ($files)"
  else
    git add -A
    if out="$(git commit -q -m "$msg" 2>&1)"; then
      log "コミット: $(git log -1 --format=%h) $count 件"
      clear_notice commit
    else
      git reset -q
      notify_once commit "dotfiles: コミットを止めました" "$(printf '%s' "$out" | grep -m1 -E 'pre-commit|error|fatal' || echo '検査に失敗')（$files）"
      log "コミット失敗: $out"
    fi
  fi
fi

# --- 5. GitHub と揃える（必要なら rebase で取り込み、push） ---
if ! git fetch -q origin main 2>/dev/null; then
  log "fetch 失敗（オフラインかも）。次の回に回す"; exit 0
fi
ahead="$(git rev-list --count origin/main..main)"
behind="$(git rev-list --count main..origin/main)"
if [ "$behind" -gt 0 ]; then
  if [ "$dry" = 1 ]; then
    log "[dry-run] GitHub の方が $behind 件進んでいるので取り込む予定"
  elif ! git pull -q --rebase --autostash origin main 2>/dev/null; then
    git rebase --abort 2>/dev/null
    notify_once pull "dotfiles: GitHub との取り込みに失敗" "競合の可能性があります。保管庫で git status を確認してください"
    exit 0
  else
    clear_notice pull
    # 取り込んだ変更のうち、コピー型のファイルはホームへ反映が必要
    run chezmoi apply --force >/dev/null 2>&1 || notify_once apply "dotfiles: 反映に失敗" "chezmoi apply を手で実行してください"
    ahead="$(git rev-list --count origin/main..main)"
  fi
fi
if [ "$ahead" -gt 0 ]; then
  if [ "$dry" = 1 ]; then
    log "[dry-run] push 予定: $ahead 件"
  elif git push -q origin main 2>/dev/null; then
    log "push: $ahead 件"; clear_notice push
  else
    notify_once push "dotfiles: push に失敗" "$ahead 件のコミットが GitHub に送れていません"
  fi
fi
