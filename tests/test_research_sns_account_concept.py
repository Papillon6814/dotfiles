"""Research-only skill discovery and empirical model-output contracts.

These are resource/consumer boundary checks, not proof from grepping guidance.
Live model trials are opt-in evidence, never launched by the unittest suite.
"""
import json
import os
from pathlib import Path
import shutil
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[1]
PROFILE = ROOT / "dot_pi/private_agent/profiles/research"
SDK = Path(os.environ.get("PI_SDK_MODULE", "/opt/homebrew/lib/node_modules/@earendil-works/pi-coding-agent/dist/index.js"))
ITEMS = ("目的", "対象者", "欲求・関心", "競合・代替", "フォローする価値", "発信者との適合", "投稿への具体化", "一貫性と範囲", "継続可能性", "検証")


class ResearchSnsSkillContractTests(unittest.TestCase):
    def load(self, directory):
        if not shutil.which("node") or not SDK.is_file():
            self.skipTest("Installed Pi SDK is required for resource discovery")
        code = (
            "import {loadSkills} from " + json.dumps(SDK.as_uri()) + ";"
            "const r=loadSkills({cwd:process.argv[1],agentDir:process.argv[1],"
            "includeDefaults:false,skillPaths:[process.argv[1]]});"
            "console.log(JSON.stringify({skills:r.skills.map(s=>({name:s.name,filePath:s.filePath,baseDir:s.baseDir})),"
            "diagnostics:r.diagnostics.map(d=>d.message)}));"
        )
        r = subprocess.run(["node", "--input-type=module", "-e", code, str(directory)],
                           capture_output=True, text=True, timeout=30)
        self.assertEqual(r.returncode, 0, r.stderr)
        return json.loads(r.stdout)

    def test_research_advertises_skill_with_readable_reference(self):
        result = self.load(PROFILE / "skills/sns-account-concept")
        self.assertEqual([s["name"] for s in result["skills"]], ["sns-account-concept"])
        self.assertEqual(result["diagnostics"], [])
        skill = result["skills"][0]
        reference = Path(skill["baseDir"]) / "references/checklist.md"
        self.assertTrue(reference.is_file(), "The consumer must be able to read the bundled reference")
        self.assertGreater(len(reference.read_text()), 100)

    def test_common_skill_root_does_not_advertise_research_skill(self):
        result = self.load(ROOT / "dot_pi/private_agent/skills")
        self.assertNotIn("sns-account-concept", [s["name"] for s in result["skills"]])

    def model_evidence(self):
        directory = os.environ.get("SNS_MODEL_EVIDENCE_DIR")
        if not directory:
            self.skipTest("Empirical model evidence not supplied; not an LLM compliance result")
        p = Path(directory) / "with-summary.json"
        self.assertTrue(p.is_file(), "Run the live treatment probes before claiming compliance")
        data = json.loads(p.read_text())
        self.assertEqual(data["model"], "openai-codex/gpt-6.1-sol")
        self.assertEqual(len(data["samples"]), 5)
        return data

    def test_treatment_model_outputs_cover_all_ten_items(self):
        data = self.model_evidence()
        for sample in data["samples"]:
            with self.subTest(sample=sample["index"]):
                self.assertEqual(sample["stopReason"], "stop")
                self.assertEqual(sample["coveredItems"], list(ITEMS))
                self.assertTrue(sample["tableHasFiveColumns"])
                self.assertFalse(sample["generatedTenNewPosts"])

    def test_treatment_evidence_matches_current_guidance(self):
        import hashlib
        data = self.model_evidence()
        skill = PROFILE / "skills/sns-account-concept/SKILL.md"
        reference = PROFILE / "skills/sns-account-concept/references/checklist.md"
        for path, field in [(skill, "skillSha256"), (reference, "referenceSha256")]:
            self.assertEqual(data[field], hashlib.sha256(path.read_bytes()).hexdigest(),
                             "Old model evidence cannot prove compliance with changed guidance")


    def session_evidence(self, name):
        directory = os.environ.get("SNS_MODEL_EVIDENCE_DIR")
        if not directory:
            self.skipTest("Live SDK routing evidence not supplied")
        path = Path(directory) / (name + ".json")
        self.assertTrue(path.is_file(), "Live routing result is required")
        return json.loads(path.read_text())

    def test_profile_driven_analysis_loads_skill_and_all_criteria(self):
        data = self.session_evidence("route-analysis")
        self.assertEqual(data["stopReason"], "stop")
        self.assertFalse(data["guidanceInjected"])
        self.assertTrue(data["readSkill"])
        self.assertTrue(data["readReference"])
        self.assertEqual(data["coveredItems"], list(ITEMS))
        import hashlib
        self.assertEqual(data["instructionsSha256"], hashlib.sha256((PROFILE / "instructions.md").read_bytes()).hexdigest())

    def test_ordinary_technical_query_does_not_load_sns_skill(self):
        data = self.session_evidence("route-technical")
        self.assertEqual(data["stopReason"], "stop")
        self.assertFalse(data["readSkill"])
        self.assertFalse(data["readReference"])
        self.assertEqual(data["coveredItems"], [])
        import hashlib
        self.assertEqual(data["instructionsSha256"], hashlib.sha256((PROFILE / "instructions.md").read_bytes()).hexdigest())

if __name__ == "__main__":
    unittest.main()
