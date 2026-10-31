"""scripts/claude-settings-for-host.py の試験。

MBP の Claude 設定から、別の機械（mini）用の設定を作る。
- ホームのパスをその機械のものに置き換える
- muxy-ask-relay の hook は、その機械が自分で書いたもの（今の設定にあるもの）を使う
- otel（Honeycomb 送信）は外す
- statusLine の herdr-agent-quota は install-plugins.sh が作る場所を指す
"""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "claude-settings-for-host.py"

RELAY_MBP = "/opt/homebrew/Cellar/node/26.10.0_1/bin/node /Users/papillon/.local/share/muxy-ask-relay/current/claude-hook.mjs Stop # muxy-ask-relay"
RELAY_MINI = "/opt/homebrew/Cellar/node/26.10.0_1/bin/node /Users/macmini/.local/share/muxy-ask-relay/current/claude-hook.mjs Stop # muxy-ask-relay"
STATE_HOOK = "bash '/Users/papillon/.claude/hooks/herdr-agent-state.sh' stop"

SOURCE = {
    "model": "opus[1m]",
    "env": {
        "MCP_TIMEOUT": "600000",
        "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
        "CLAUDE_CODE_ENHANCED_TELEMETRY_BETA": "1",
        "OTEL_METRICS_EXPORTER": "otlp",
    },
    "otelHeadersHelper": "/Users/papillon/.config/otel/claude-otel-headers.sh",
    "statusLine": {
        "type": "command",
        "command": "HERDR_PLUGIN_STATE_DIR='/Users/papillon/.local/state/herdr/plugins/herdr-agent-quota' "
                   "'/Users/papillon/.config/herdr/plugins/github/herdr-agent-quota-651432b09361/target/release/herdr-agent-quota' claude-statusline",
    },
    "hooks": {
        "Stop": [
            {"hooks": [{"type": "command", "command": STATE_HOOK}]},
            {"hooks": [{"type": "command", "command": RELAY_MBP, "timeout": 10}]},
        ],
    },
}

TARGET_NOW = {
    "model": "opus",
    "hooks": {
        "Stop": [
            {"hooks": [{"type": "command", "command": RELAY_MINI, "timeout": 10}]},
        ],
    },
}


class ClaudeSettingsForHost(unittest.TestCase):
    def generate(self, source=SOURCE, target=TARGET_NOW, home="/Users/macmini"):
        with tempfile.TemporaryDirectory() as d:
            src = Path(d, "source.json")
            cur = Path(d, "target.json")
            src.write_text(json.dumps(source))
            cur.write_text(json.dumps(target))
            result = subprocess.run(
                [sys.executable, str(SCRIPT), "--source", str(src), "--target-current", str(cur), "--home", home],
                capture_output=True, text=True,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            return json.loads(result.stdout)

    def all_commands(self, settings):
        return [h["command"] for groups in settings["hooks"].values() for g in groups for h in g["hooks"]]

    def test_home_paths_are_replaced(self):
        out = self.generate()
        self.assertNotIn("/Users/papillon", json.dumps(out))
        self.assertIn("bash '/Users/macmini/.claude/hooks/herdr-agent-state.sh' stop", self.all_commands(out))

    def test_relay_hooks_come_from_target_machine(self):
        commands = self.all_commands(self.generate())
        self.assertIn(RELAY_MINI, commands)
        self.assertEqual(sum("# muxy-ask-relay" in c for c in commands), 1)

    def test_otel_is_removed(self):
        out = self.generate()
        self.assertNotIn("otelHeadersHelper", out)
        self.assertEqual(out["env"], {"MCP_TIMEOUT": "600000"})

    def test_statusline_points_to_install_plugins_build(self):
        command = self.generate()["statusLine"]["command"]
        self.assertIn("'/Users/macmini/Code/herdr-agent-quota/target/release/herdr-agent-quota' claude-statusline", command)
        self.assertIn("HERDR_PLUGIN_STATE_DIR='/Users/macmini/.local/state/herdr/plugins/herdr-agent-quota'", command)

    def test_other_values_follow_source(self):
        self.assertEqual(self.generate()["model"], "opus[1m]")

    def test_target_without_relay_gets_no_relay_hooks(self):
        out = self.generate(target={"hooks": {}})
        self.assertFalse(any("# muxy-ask-relay" in c for c in self.all_commands(out)))


if __name__ == "__main__":
    unittest.main()
