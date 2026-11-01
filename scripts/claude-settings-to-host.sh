#!/bin/bash
# MBP の Claude 設定から別の機械用の ~/.claude/settings.json を作り、SSH で書き込む。
# 規則は scripts/claude-settings-for-host.py を参照。既定は差を見せるだけで、--apply で書き込む。
#
# 使い方: scripts/claude-settings-to-host.sh macmini@100.70.132.157 [--apply]
# 相手のログインシェルが fish でも動くよう、相手側のコマンドは bash -c で実行する。
set -euo pipefail
host="${1:?接続先（user@host）を指定してください}"
apply="${2:-}"
repo="$(cd "$(dirname "$0")/.." && pwd)"
work="$(mktemp -d "${TMPDIR:-/tmp}/claude-settings-to-host.XXXXXX")"
trap 'rm -rf -- "$work"' EXIT

remote_home="$(ssh "$host" 'bash -c "printf %s \"\$HOME\""')"
ssh "$host" 'bash -c "cat \"\$HOME/.claude/settings.json\""' > "$work/current.json"
python3 "$repo/scripts/claude-settings-for-host.py" \
  --source "$repo/dot_claude/settings.json" --target-current "$work/current.json" --home "$remote_home" \
  > "$work/new.json"

python3 - "$work/current.json" "$work/new.json" <<'PY'
import json, sys
cur, new = (json.load(open(p)) for p in sys.argv[1:3])
for key in sorted(set(cur) | set(new)):
    if cur.get(key) != new.get(key):
        state = "追加" if key not in cur else "削除" if key not in new else "変更"
        print(f"{state}: {key}")
PY

if [ "$apply" != "--apply" ]; then
  echo "（差を見せただけです。書き込むには --apply を付けてください）"
  exit 0
fi
stamp="$(date +%Y%m%d-%H%M%S)"
ssh "$host" "bash -c 'cp -p \"\$HOME/.claude/settings.json\" \"\$HOME/.claude/settings.json.bak-$stamp\"'"
ssh "$host" 'bash -c "cat > \"\$HOME/.claude/settings.json.new\" && mv \"\$HOME/.claude/settings.json.new\" \"\$HOME/.claude/settings.json\""' < "$work/new.json"
echo "書き込みました（退避: ~/.claude/settings.json.bak-${stamp}）"
