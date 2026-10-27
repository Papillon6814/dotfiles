"""Static policy regression checks; not a live browser/model test."""
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ENTRIES = ("dot_claude/CLAUDE.md", "dot_pi/private_agent/AGENTS.md")
FORCED = re.compile(r"ブラウザ操作は必ずエージェントチーム|コーディネーターはブラウザツールを直接呼び出さない|ブラウザ操作は利用可能ならサブエージェントに委任")

class BrowserOperationPolicyTests(unittest.TestCase):
    def test_main_owns_browser_and_human_wait(self):
        for name in ENTRIES:
            with self.subTest(path=name):
                text = (ROOT / name).read_text()
                self.assertIn("ブラウザ操作はメインエージェントが直接行う", text)
                self.assertIn("本人操作待ち", text)
                self.assertIn("接続", text)
                self.assertNotRegex(text, FORCED)
                self.assertNotRegex(text, r"(?m)^undefined$")

    def test_browser_workers_are_opt_in(self):
        for name in ("dot_pi/private_agent/agents/browser-verifier.md",):
            with self.subTest(path=name):
                self.assertIn("明示的に委任", (ROOT / name).read_text())

    def test_optional_workers_keep_connection_during_human_wait(self):
        for name in ("dot_pi/private_agent/agents/browser-verifier.md",):
            with self.subTest(path=name):
                text = (ROOT / name).read_text()
                self.assertTrue("本人操作待ちは終了せず" in text, name)
                self.assertTrue("継続不能" in text, name)
                self.assertNotIn("継続方法を確認してから終了する", text)

    def test_social_workflow_does_not_restore_finn_delegation(self):
        text = (ROOT / "dot_pi/private_agent/skills/social-browser-research-common/WORKFLOW.md").read_text()
        self.assertNotIn("requires browser work through a dedicated subagent", text)
        self.assertIn("main agent", text)
        for fence in ("CAPTCHA", "MFA", "Never open DMs", "cookies/tokens"):
            self.assertIn(fence, text)

    def test_existing_safety_boundaries_remain(self):
        pi = (ROOT / ENTRIES[1]).read_text()
        for fence in ("playwright-browser", "自分で開いたタブ", "MFA・CAPTCHA", "経路切替で回避しない"):
            self.assertIn(fence, pi)
        claude = (ROOT / ENTRIES[0]).read_text()
        self.assertIn("利用者が開いている既存のタブは操作しない", claude)

if __name__ == "__main__":
    unittest.main()
