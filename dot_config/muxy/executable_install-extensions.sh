#!/bin/sh
# Muxy の自作拡張を再導入する。~/.config/muxy/extensions/<name> は chezmoi が ~/Code/<name> への symlink として配る。
set -eu
REPO="$HOME/Code/muxy-herdr-agent-status"
if [ ! -d "$REPO/.git" ]; then
  gh repo clone Papillon6814/muxy-herdr-agent-status "$REPO"
fi
(cd "$REPO" && npm run build)
cat <<'MSG'
次は Muxy 側で手動:
  1. Settings → Extensions → Reload Extensions → muxy-herdr-agent-status を有効化
  2. ⌘⇧P → 「herdr Status: Start color sync loop」（python3 / sleep の実行許可は Allow & remember）
  ※ Muxy 再起動・拡張 Reload のたびに 2 を実行する
MSG
