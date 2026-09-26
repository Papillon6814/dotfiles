import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("pi_account_status", Path(__file__).with_name("pi-account-status.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PiLabelTests(unittest.TestCase):
    def test_isolates_tabs_and_accounts(self):
        home = Path("/home/test")
        agents = [
            {"workspace_id": "w1", "tab_id": "t1", "agent_session": {"source": "herdr:pi", "kind": "path", "value": "/home/test/.pi/agent/sessions/a.jsonl"}},
            {"workspace_id": "w1", "tab_id": "t2", "agent_session": {"source": "herdr:pi", "kind": "path", "value": "/home/test/.pi/agent-muu/sessions/b.jsonl"}},
            {"workspace_id": "w1", "tab_id": "t1", "agent_session": {"source": "herdr:codex", "kind": "path", "value": "/home/test/.pi/agent-muu/sessions/c.jsonl"}},
        ]
        self.assertEqual(module.pi_label(agents, "w1", "t1", home), "pi: kuno")
        self.assertEqual(module.pi_label(agents, "w1", "t2", home), "pi: muu")
        self.assertEqual(module.pi_label(agents, "w2", "t1", home), "")
        self.assertEqual(module.pi_label(agents, "", "t1", home), "")

    def test_rejects_similar_directory_and_unknown_session(self):
        home = Path("/home/test")
        agents = [{"workspace_id": "w1", "tab_id": "t1", "agent_session": {"source": "herdr:pi", "kind": "path", "value": "/home/test/.pi/agent-muu-other/sessions/a.jsonl"}}]
        self.assertEqual(module.pi_label(agents, "w1", "t1", home), "")


if __name__ == "__main__":
    unittest.main()
