#!/bin/sh
set -eu

codex_home_dir=${CODEX_HOME:-/Users/papillon/.codex}
auth_file="$codex_home_dir/auth.json"
workspace_id=${HERDR_WORKSPACE_ID:-}
tab_id=${HERDR_TAB_ID:-}

if [ ! -r "$auth_file" ]; then
    exit 0
fi

agent_list_json=$(herdr agent list 2>/dev/null || true)
AGENT_LIST_JSON="$agent_list_json" python3 - "$auth_file" "$workspace_id" "$tab_id" <<'PY'
import base64
import json
import os
import sys
from pathlib import Path


def current_tab_has_codex(agent_list, workspace_id, tab_id):
    for agent in agent_list.get("result", {}).get("agents", []):
        if workspace_id and agent.get("workspace_id") != workspace_id:
            continue
        if tab_id and agent.get("tab_id") != tab_id:
            continue
        if agent.get("agent_session", {}).get("source") == "herdr:codex":
            return True
    return False


try:
    agent_list = json.loads(os.environ["AGENT_LIST_JSON"])
    if not current_tab_has_codex(agent_list, sys.argv[2], sys.argv[3]):
        raise SystemExit

    auth = json.loads(Path(sys.argv[1]).read_text())
    token = auth["tokens"]["id_token"]
    payload = token.split(".")[1]
    payload += "=" * (-len(payload) % 4)
    claims = json.loads(base64.urlsafe_b64decode(payload).decode())
    email = claims.get("email")
    if isinstance(email, str) and email:
        print(f"codex: {email}")
except (OSError, KeyError, IndexError, ValueError, TypeError, json.JSONDecodeError):
    pass
PY
