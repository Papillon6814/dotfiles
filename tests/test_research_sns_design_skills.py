"""Research-only resource contracts. Live model trials are explicit, not suite side effects."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[1]
PROFILE = ROOT / 'dot_pi/private_agent/profiles/research'
SDK = Path(os.environ.get('PI_SDK_MODULE', '/opt/homebrew/lib/node_modules/@earendil-works/pi-coding-agent/dist/index.js'))


class ResearchSnsDesignSkillTests(unittest.TestCase):
    def load(self, path):
        if not shutil.which('node') or not SDK.is_file():
            self.skipTest('Installed Pi SDK required for real resource discovery')
        code = ('import {loadSkills} from ' + json.dumps(SDK.as_uri()) + ';'
                'const r=loadSkills({cwd:process.argv[1],agentDir:process.argv[1],'
                'includeDefaults:false,skillPaths:[process.argv[1]]});'
                'console.log(JSON.stringify({skills:r.skills.map(s=>({name:s.name,'
                'description:s.description,baseDir:s.baseDir})),diagnostics:r.diagnostics}));')
        result = subprocess.run(['node', '--input-type=module', '-e', code, str(path)],
                                capture_output=True, text=True, timeout=30)
        self.assertEqual(result.returncode, 0, result.stderr)
        return json.loads(result.stdout)

    def check_resource(self, name):
        result = self.load(PROFILE / 'skills' / name)
        self.assertEqual([s['name'] for s in result['skills']], [name])
        self.assertEqual(result['diagnostics'], [])
        skill = result['skills'][0]
        self.assertTrue(skill['description'])
        self.assertLessEqual(len(skill['description']), 1024)
        base = Path(skill['baseDir'])
        for relative in ('references/checklist.md', 'assets/output-template.md'):
            self.assertTrue((base / relative).is_file(), relative)
            self.assertGreater(len((base / relative).read_text()), 100)
        return base

    def test_monetization_resource(self):
        self.check_resource('sns-monetization-design')

    def test_monetization_absent_from_common_root(self):
        names = [s['name'] for s in self.load(ROOT / 'dot_pi/private_agent/skills')['skills']]
        self.assertNotIn('sns-monetization-design', names)

    def test_probe_rejects_unknown_case_without_model_call(self):
        result = subprocess.run(['node', str(ROOT / 'tests/probe_research_sns_design.mjs'),
                                 '--case', 'unknown', '--variant', 'baseline', '--out', str(ROOT / 'work/probe-invalid')],
                                capture_output=True, text=True, timeout=15)
        self.assertEqual(result.returncode, 2, result.stderr)
        self.assertIn('invalid case', result.stderr)
        self.assertFalse((ROOT / 'work/probe-invalid').exists())


if __name__ == '__main__':
    unittest.main()
