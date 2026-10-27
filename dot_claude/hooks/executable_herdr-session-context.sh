#!/bin/sh
# SessionStart: herdr 上のセッションでのみ、その旨をコンテキストに1行入れる。
# tmux・ヘッドレス実行など herdr 外では何も出力しない。
# 状態報告は herdr 管理の herdr-agent-state.sh が担当（あちらは編集しない）。

set -eu

cat >/dev/null 2>&1 || true

[ "${HERDR_ENV:-}" = "1" ] || exit 0
[ -n "${HERDR_PANE_ID:-}" ] || exit 0
command -v herdr >/dev/null 2>&1 || exit 0

printf '【herdr】このセッションは herdr 上で動作中（pane %s / tab %s / workspace %s）。他ペイン・他エージェントの確認や操作は herdr スキルの手順で行える。ただしユーザーが求めたときのみ使い、自発的にペインを増やしたり他エージェントへ指示を送ったりしないこと。\n' \
  "$HERDR_PANE_ID" "${HERDR_TAB_ID:-?}" "${HERDR_WORKSPACE_ID:-?}"
