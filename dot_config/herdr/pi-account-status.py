#!/usr/bin/env python3
import json
import os
import subprocess
from pathlib import Path


def pi_label(agents, workspace_id, tab_id, home):
    if not workspace_id or not tab_id:
        return ""
    labels = set()
    for agent in agents:
        session = agent.get("agent_session") or {}
        if (
            agent.get("workspace_id") != workspace_id
            or agent.get("tab_id") != tab_id
            or session.get("source") != "herdr:pi"
            or session.get("kind") != "path"
        ):
            continue
        session_path = session.get("value")
        if not isinstance(session_path, str):
            continue
        for label, root in (("kuno", home / ".pi/agent"), ("muu", home / ".pi/agent-muu")):
            if Path(session_path).is_relative_to(root / "sessions"):
                labels.add(label)
    return f"pi: {', '.join(sorted(labels))}" if labels else ""


def main():
    try:
        result = subprocess.run(["herdr", "agent", "list"], capture_output=True, text=True, timeout=2, check=True)
        agents = json.loads(result.stdout)["result"]["agents"]
        label = pi_label(agents, os.environ.get("HERDR_WORKSPACE_ID"), os.environ.get("HERDR_TAB_ID"), Path.home())
        if label:
            print(label)
    except (OSError, subprocess.SubprocessError, ValueError, KeyError, TypeError):
        pass


if __name__ == "__main__":
    main()
