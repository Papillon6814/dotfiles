#!/bin/bash
# openclaw gateway daily restart + session cleanup
# Runs at 4:00 AM JST via crontab

LOG="$HOME/.openclaw/logs/daily-restart.log"
echo "=== $(date '+%Y-%m-%d %H:%M:%S') ===" >> "$LOG"

# Clean up large session JSONL files (>500KB)
deleted=$(find "$HOME/.openclaw/agents" -name "*.jsonl" -size +500k -delete -print 2>/dev/null | wc -l | tr -d ' ')
echo "Cleaned $deleted session file(s)" >> "$LOG"

# Clean up stale .reset.* files older than 3 days
find "$HOME/.openclaw/agents" -name ".reset.*" -mtime +3 -delete 2>/dev/null

# Restart gateway
openclaw gateway restart >> "$LOG" 2>&1

# Wait and verify
sleep 10
openclaw gateway status >> "$LOG" 2>&1
echo "" >> "$LOG"
