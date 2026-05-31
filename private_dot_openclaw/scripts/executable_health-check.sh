#!/bin/bash
# openclaw gateway health check script
# launchd から定期実行し、gateway が落ちていたら自動復旧する

LOG="/Users/macmini/.openclaw/logs/health-check.log"
PLIST="ai.openclaw.gateway"
PLIST_PATH="/Users/macmini/Library/LaunchAgents/${PLIST}.plist"
PROBE_URL="ws://127.0.0.1:18789"
MAX_LOG_LINES=500

log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') $1" >> "$LOG"
}

# Trim log file if too large
if [ -f "$LOG" ] && [ "$(wc -l < "$LOG")" -gt "$MAX_LOG_LINES" ]; then
  tail -n 200 "$LOG" > "${LOG}.tmp" && mv "${LOG}.tmp" "$LOG"
fi

# Check if gateway process is running via launchctl
if ! launchctl list "$PLIST" &>/dev/null; then
  log "WARN: gateway LaunchAgent not loaded. Attempting launchctl load..."
  launchctl load "$PLIST_PATH" 2>>"$LOG"
  sleep 5
  if launchctl list "$PLIST" &>/dev/null; then
    log "OK: gateway LaunchAgent loaded successfully"
  else
    log "ERROR: failed to load gateway LaunchAgent"
  fi
  exit 0
fi

# Check RPC probe via HTTP (simple TCP check on gateway port)
if ! curl -s --max-time 5 -o /dev/null http://127.0.0.1:18789/ 2>/dev/null; then
  log "WARN: gateway not responding on port 18789. Restarting..."
  # Unload and reload (safer than openclaw gateway restart which can fail)
  launchctl unload "$PLIST_PATH" 2>>"$LOG"
  sleep 2
  launchctl load "$PLIST_PATH" 2>>"$LOG"
  sleep 5
  if curl -s --max-time 5 -o /dev/null http://127.0.0.1:18789/ 2>/dev/null; then
    log "OK: gateway recovered after restart"
  else
    log "ERROR: gateway still not responding after restart"
  fi
  exit 0
fi

log "OK: gateway healthy (port 18789)"

# Check canvas-server
CANVAS_PLIST="ai.openclaw.canvas-server"
if ! curl -s --max-time 3 -o /dev/null http://127.0.0.1:18801/ 2>/dev/null; then
  log "WARN: canvas-server not responding on port 18801. Restarting..."
  launchctl unload "/Users/macmini/Library/LaunchAgents/${CANVAS_PLIST}.plist" 2>>"$LOG"
  sleep 2
  launchctl load "/Users/macmini/Library/LaunchAgents/${CANVAS_PLIST}.plist" 2>>"$LOG"
  sleep 3
  if curl -s --max-time 3 -o /dev/null http://127.0.0.1:18801/ 2>/dev/null; then
    log "OK: canvas-server recovered after restart"
  else
    log "ERROR: canvas-server still not responding after restart"
  fi
else
  log "OK: canvas-server healthy (port 18801)"
fi
