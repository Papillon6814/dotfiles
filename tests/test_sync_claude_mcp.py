import importlib.util
from pathlib import Path

import pytest

SCRIPT = Path(__file__).resolve().parent.parent / "dot_codex/bin/private_executable_sync-claude-mcp.py"


def load():
    spec = importlib.util.spec_from_loader("sync_claude_mcp", loader=None)
    module = importlib.util.module_from_spec(spec)
    exec(SCRIPT.read_text(), module.__dict__)
    return module


CODEX = """model = "x"

# ZVEC_GREP_START
[mcp_servers.zvec_grep]
command = "zg"
args = ["server", "--stdio"]
default_tools_approval_mode = "approve"
# ZVEC_GREP_END
"""

SOURCE = {
    "zvec_grep": {"type": "stdio", "command": "zg", "args": ["server", "--stdio"]},
    "exa": {"type": "stdio", "command": "npx", "args": ["exa"]},
}


def test_tool_owned_server_conflicts_without_selection():
    m = load()
    with pytest.raises(ValueError, match="zvec_grep"):
        m.render(SOURCE, CODEX)


def test_tool_owned_server_is_left_to_its_installer():
    m = load()
    result = m.render(m.select_sources(SOURCE), CODEX)
    assert '[mcp_servers."exa"]' in result
    assert '[mcp_servers."zvec_grep"]' not in result
    assert 'default_tools_approval_mode = "approve"' in result
