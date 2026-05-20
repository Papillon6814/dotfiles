#!/bin/bash
# macOS通知を送る（terminal-notifier使用）

# JSONから必要な情報を抽出
input=$(cat)
notification_type=$(echo "$input" | jq -r '.notification_type // ""')
hook_event=$(echo "$input" | jq -r '.hook_event_name // ""')
tool_name=$(echo "$input" | jq -r '.tool_name // ""')

# 通知のタイトルとメッセージを決定
title="Claude Code"
message=""

case "$hook_event" in
  "Notification")
    case "$notification_type" in
      "idle_prompt")
        title="Claude Code"
        message="Waiting for your input"
        ;;
      "permission_prompt")
        title="Claude Code"
        message="Approval needed"
        ;;
      *)
        exit 0
        ;;
    esac
    ;;
  "PostToolUse")
    if [ "$tool_name" = "Bash" ]; then
      command=$(echo "$input" | jq -r '.tool_input.command // "command"' | head -c 50)
      title="Command completed"
      message="$command"
    else
      exit 0
    fi
    ;;
  "SubagentStop")
    title="Background task completed"
    message="Task has finished"
    ;;
  *)
    exit 0
    ;;
esac

# terminal-notifier でmacOS通知を送る（音付き）
if [ -n "$message" ]; then
  terminal-notifier -title "$title" -message "$message" -sound "Hero"
fi

exit 0
