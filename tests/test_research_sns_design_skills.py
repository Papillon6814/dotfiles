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

    def test_all_three_discoverable_only_in_research(self):
        expected = {'sns-monetization-design', 'sns-account-direction', 'sns-ai-feasibility'}
        result = self.load(PROFILE / 'skills')
        self.assertEqual(result['diagnostics'], [])
        names = [s['name'] for s in result['skills']]
        for name in expected:
            self.assertEqual(names.count(name), 1)
        common = {s['name'] for s in self.load(ROOT / 'dot_pi/private_agent/skills')['skills']}
        self.assertFalse(expected & common)

    def test_existing_checker_and_profile_config_unchanged(self):
        for file in ('profile.json', 'skills/sns-account-concept/SKILL.md', 'skills/sns-account-concept/references/checklist.md'):
            path = PROFILE / file
            old = subprocess.run(['git', '-C', str(ROOT), 'show', '8ad9116:' + str(path.relative_to(ROOT))],
                                 capture_output=True, check=True).stdout
            self.assertEqual(path.read_bytes(), old)

    def test_route_instructions(self):
        # Routing evidence exercises the consumer; without evidence this is explicitly unverified.
        directory = os.environ.get('SNS_DESIGN_ROUTING_EVIDENCE_DIR')
        if not directory:
            self.skipTest('Live routing evidence not supplied')
        import hashlib
        data = json.loads((Path(directory) / 'summary.json').read_text())
        self.assertEqual(data['instructionsSha256'], hashlib.sha256((PROFILE / 'instructions.md').read_bytes()).hexdigest())
        for relative, digest in data['sourceHashes'].items():
            self.assertEqual(hashlib.sha256((ROOT / relative).read_bytes()).hexdigest(), digest)
        self.assertEqual(len(data['samples']), 7)
        expected = [ {'sns-monetization-design'}, {'sns-account-direction', 'sns-account-concept'},
                     {'sns-ai-feasibility'}, {'sns-monetization-design', 'sns-account-direction', 'sns-ai-feasibility', 'sns-account-concept'},
                     set(), {'sns-account-concept'}, {'sns-monetization-design', 'sns-account-direction', 'sns-ai-feasibility', 'sns-account-concept'} ]
        new = {'sns-monetization-design', 'sns-account-direction', 'sns-ai-feasibility'}
        for sample, required in zip(data['samples'], expected):
            self.assertEqual(sample['stopReason'], 'stop')
            used = {Path(r['args'].get('path', '')).parent.name for r in sample['reads'] if Path(r['args'].get('path', '')).name == 'SKILL.md'}
            self.assertTrue(required <= used, (sample['index'], required, used))
            if sample['index'] in (4, 5):
                self.assertFalse(used & new)

    def test_missing_checker_fixture(self):
        import tempfile
        evidence = ROOT / 'work/sns-design-evidence'
        evidence.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(dir=evidence) as directory:
            output = Path(directory) / 'fixture-run'
            result = subprocess.run(['node', str(ROOT / 'tests/probe_research_sns_design.mjs'),
                                     '--case', 'direction-missing', '--variant', 'treatment', '--samples', '1',
                                     '--prepare-only', '--out', str(output)],
                                    capture_output=True, text=True, timeout=30)
            self.assertEqual(result.returncode, 0, result.stderr)
            fixture = output / 'fixture/profile'
            self.assertEqual([s['name'] for s in self.load(fixture / 'skills')['skills']], ['sns-account-direction'])
            self.assertFalse((fixture / 'skills/sns-account-concept/SKILL.md').exists())
            self.assertTrue((PROFILE / 'skills/sns-account-concept/SKILL.md').is_file())

    def test_direction_resource_and_existing_checker(self):
        base = self.check_resource('sns-account-direction')
        for relative in ('../sns-account-concept/SKILL.md', '../sns-account-concept/references/checklist.md'):
            self.assertTrue((base / relative).is_file(), relative)
            self.assertGreater(len((base / relative).read_text()), 100)

    def test_feasibility_resource(self):
        self.check_resource('sns-ai-feasibility')

    def test_monetization_resource(self):
        self.check_resource('sns-monetization-design')

    def test_monetization_absent_from_common_root(self):
        names = [s['name'] for s in self.load(ROOT / 'dot_pi/private_agent/skills')['skills']]
        self.assertNotIn('sns-monetization-design', names)

    def test_probe_rejects_invalid_sample_count_without_model_call(self):
        result = subprocess.run(['node', str(ROOT / 'tests/probe_research_sns_design.mjs'),
                                 '--case', 'monetization', '--variant', 'baseline', '--samples', '0',
                                 '--out', str(ROOT / 'work/sns-design-evidence/invalid-count')],
                                capture_output=True, text=True, timeout=15)
        self.assertEqual(result.returncode, 2, result.stderr)
        self.assertIn('invalid samples', result.stderr)
        self.assertFalse((ROOT / 'work/sns-design-evidence/invalid-count').exists())

    def test_probe_rejects_unknown_case_without_model_call(self):
        result = subprocess.run(['node', str(ROOT / 'tests/probe_research_sns_design.mjs'),
                                 '--case', 'unknown', '--variant', 'baseline', '--out', str(ROOT / 'work/probe-invalid')],
                                capture_output=True, text=True, timeout=15)
        self.assertEqual(result.returncode, 2, result.stderr)
        self.assertIn('invalid case', result.stderr)
        self.assertFalse((ROOT / 'work/probe-invalid').exists())


if __name__ == '__main__':
    unittest.main()
