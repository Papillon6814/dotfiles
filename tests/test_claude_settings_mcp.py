import unittest, json, pathlib
SETTINGS=pathlib.Path(__file__).resolve().parents[1]/"dot_claude/settings.json"
class ProjectMcp(unittest.TestCase):
 def test_roblox_studio_from_project_mcp_json_needs_no_prompt(self):
  # Studio MCP は Roblox 系リポジトリの .mcp.json に置く。無人の工程で承認待ちにならないよう名前で許可する（2026-10-18）
  self.assertIn("Roblox_Studio",json.loads(SETTINGS.read_text()).get("enabledMcpjsonServers",[]))
if __name__=="__main__":unittest.main()
