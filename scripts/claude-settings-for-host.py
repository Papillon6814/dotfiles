#!/usr/bin/env python3
"""MBP の Claude 設定（dot_claude/settings.json）から、別の機械用の settings.json を作る。

使い方:
  claude-settings-for-host.py --source dot_claude/settings.json \\
      --target-current <その機械の今の settings.json> --home /Users/macmini > 新しい設定

Claude の設定を1つのファイルで共有しない理由: muxy-ask-relay などは、入れる・更新するたびに
その機械の絶対パスで hook を書き直す。共有すると、片方の更新でもう片方が壊れる。
そこで MBP を正として、機械ごとのファイルをこのスクリプトで作る。

- 文字列中の MBP のホーム（/Users/papillon）を --home に置き換える
- muxy-ask-relay の hook（印 "# muxy-ask-relay"）は、その機械の今の設定にあるものを使う
- otel（Honeycomb への送信）は外す（mini には鍵を置かない、2026-11-01 決定）
- statusLine の herdr-agent-quota は、install-plugins.sh がビルドする場所を指す
"""
import argparse
import json
import re
import sys
from typing import Any

SOURCE_HOME = "/Users/papillon"
RELAY_MARKER = "# muxy-ask-relay"
OTEL_ENV_KEYS = ("CLAUDE_CODE_ENABLE_TELEMETRY", "CLAUDE_CODE_ENHANCED_TELEMETRY_BETA")
QUOTA_BINARY = re.compile(r"'[^']*/herdr-agent-quota[^/']*/target/release/herdr-agent-quota'")


def replace_home(value: Any, home: str) -> Any:
    if isinstance(value, dict):
        return {k: replace_home(v, home) for k, v in value.items()}
    if isinstance(value, list):
        return [replace_home(v, home) for v in value]
    if isinstance(value, str):
        return value.replace(SOURCE_HOME, home)
    return value


def is_relay_group(group):
    return any(RELAY_MARKER in h.get("command", "") for h in group.get("hooks", []))


def merge_relay_hooks(hooks, target_hooks):
    # MBP の relay hook を外し、その機械の relay hook を同じイベントの末尾に足す
    out = {}
    for event, groups in hooks.items():
        kept = [g for g in groups if not is_relay_group(g)]
        if kept:
            out[event] = kept
    for event, groups in target_hooks.items():
        own = [g for g in groups if is_relay_group(g)]
        if own:
            out.setdefault(event, []).extend(own)
    return out


def build(source, target_current, home):
    if not isinstance(source, dict):
        raise SystemExit("Claude の設定の一番外側が JSON オブジェクトではありません")
    settings: dict[str, Any] = replace_home(source, home)
    settings["hooks"] = merge_relay_hooks(settings.get("hooks", {}), target_current.get("hooks", {}))
    settings.pop("otelHeadersHelper", None)
    env: dict[str, Any] = settings.get("env", {})
    for key in list(env):
        if key.startswith("OTEL_") or key in OTEL_ENV_KEYS:
            del env[key]
    status: dict[str, Any] = settings.get("statusLine", {})
    if "command" in status:
        status["command"] = QUOTA_BINARY.sub(
            f"'{home}/Code/herdr-agent-quota/target/release/herdr-agent-quota'", status["command"]
        )
    return settings


def main():
    parser = argparse.ArgumentParser(description="MBP の Claude 設定から別の機械用の設定を作る")
    parser.add_argument("--source", required=True)
    parser.add_argument("--target-current", required=True)
    parser.add_argument("--home", required=True)
    args = parser.parse_args()
    with open(args.source) as f:
        source = json.load(f)
    with open(args.target_current) as f:
        target_current = json.load(f)
    json.dump(build(source, target_current, args.home), sys.stdout, ensure_ascii=False, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
