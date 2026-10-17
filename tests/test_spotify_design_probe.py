"""Owned fixture / CLI boundary tests. Never starts a provider or live model."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
import uuid

ROOT = Path(__file__).resolve().parents[1]
PROBE = ROOT / 'tests/probe_spotify_design_managers.mjs'
NODE = shutil.which('node')
EVIDENCE = ROOT / 'work/spotify-design-validation'


@unittest.skipUnless(NODE, 'Node is required; no dependency is installed by this suite')
class SpotifyDesignProbeTests(unittest.TestCase):
    def setUp(self):
        EVIDENCE.mkdir(parents=True, exist_ok=True)
        self.out = EVIDENCE / ('unit-' + uuid.uuid4().hex)

    def call(self, *extra, out=None, env=None):
        return subprocess.run(
            [NODE, str(PROBE), '--runtime', 'pi', '--role', 'ux', '--case', 'micro',
             '--variant', 'baseline', '--samples', '1', '--out', str(out or self.out),
             '--prepare-only', *extra], cwd=ROOT, env=env,
            capture_output=True, text=True, timeout=30)

    def test_unknown_case_is_rejected_before_output_creation(self):
        result = self.call('--case', 'not-a-case')
        self.assertEqual(result.returncode, 2, result.stderr)
        self.assertIn('invalid case', result.stderr)
        self.assertFalse(self.out.exists())

    def test_invalid_dimensions_are_rejected_before_output_creation(self):
        for flag, value in [('--runtime', 'remote'), ('--role', 'writer'),
                            ('--variant', 'guess'), ('--samples', '0'),
                            ('--samples', '6'), ('--samples', '1.5')]:
            with self.subTest(flag=flag, value=value):
                result = self.call(flag, value)
                self.assertEqual(result.returncode, 2, result.stderr)
                self.assertFalse(self.out.exists())

    def test_output_outside_owned_root_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            out = Path(directory) / 'foreign'
            result = self.call(out=out)
            self.assertEqual(result.returncode, 2, result.stderr)
            self.assertFalse(out.exists())

    def test_existing_evidence_is_preserved(self):
        self.out.mkdir()
        marker = self.out / 'keep.txt'
        marker.write_text('previous evidence')
        result = self.call()
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(marker.read_text(), 'previous evidence')
        self.assertEqual(list(self.out.iterdir()), [marker])

    def test_symlink_output_cannot_escape_owned_root(self):
        with tempfile.TemporaryDirectory() as directory:
            self.out.symlink_to(directory, target_is_directory=True)
            result = self.call(out=self.out / 'escape')
            self.assertEqual(result.returncode, 2, result.stderr)
            self.assertFalse((Path(directory) / 'escape').exists())

    def test_prepare_baseline_has_no_target_skill_or_model_launch(self):
        with tempfile.TemporaryDirectory() as directory:
            trap = Path(directory)
            marker = trap / 'called'
            for command in ['pi', 'claude']:
                script = trap / command
                script.write_text('#!/bin/sh\nprintf called >> "' + str(marker) + '"\nexit 81\n')
                script.chmod(0o700)
            env = dict(os.environ, PATH=str(trap))
            result = self.call('--samples', '5', env=env)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertFalse(marker.exists())
        manifest = json.loads((self.out / 'manifest.json').read_text())
        self.assertEqual(manifest['state'], 'prepared')
        self.assertEqual(manifest['samples'], 5)
        self.assertEqual(manifest['modelRequests'], 0)
        self.assertEqual(manifest['targetSkills'], [])
        self.assertEqual(len(manifest['jobs']), 5)
        self.assertTrue(manifest['sourceHashes'])
        project = self.out / 'fixture'
        self.assertFalse((project / '.claude/skills/spotify-design').exists())
        control = project / '.claude/agents/spotify-control-ux.md'
        self.assertTrue(control.is_file())
        self.assertNotIn('skills:', control.read_text())
        self.assertEqual(manifest['effectiveToolIntent']['pi'], ['read', 'anchor_grep'])
        self.assertEqual(manifest['effectiveToolIntent']['claude'], ['Read', 'Grep', 'Glob'])

    def test_missing_treatment_is_not_silently_substituted(self):
        if (ROOT / 'dot_agents/skills/spotify-design/SKILL.md').exists():
            self.skipTest('Missing-resource boundary is exercised before assets are authored')
        result = self.call('--variant', 'treatment')
        self.assertEqual(result.returncode, 2, result.stderr)
        self.assertIn('target skill unavailable', result.stderr)
        self.assertFalse(self.out.exists())

    def test_native_claude_proof_reads_complete_stdout_not_bounded_display(self):
        self.out.mkdir()
        stdout = self.out / 'external-0.stdout.log'
        events = [
            {'type': 'system', 'subtype': 'init', 'model': 'fixture-model',
             'tools': ['Read', 'Grep', 'Glob']},
            {'type': 'system', 'subtype': 'fixture_padding', 'data': 'x' * 90000},
            {'type': 'result', 'subtype': 'success', 'is_error': False, 'result': 'review text'}]
        raw = '\n'.join(json.dumps(event) for event in events) + '\n'
        stdout.write_text(raw)
        (self.out / 'output.md').write_text(raw[-65535:])
        module = (ROOT / 'tests/spotify_design_native_host.mjs').as_uri()
        script = f'''import {{ readClaudeProof }} from {json.dumps(module)};
const root = process.argv[1];
const proof = await readClaudeProof({{results:[{{externalProcess:{{stdoutPath:root+'/external-0.stdout.log',exitCode:0}}}}]}},{{details:{{asyncDir:root}}}});
console.log(JSON.stringify({{model:proof.model,tools:proof.tools,result:proof.result.result}}));'''
        result = subprocess.run([NODE, '--input-type=module', '-e', script, str(self.out)],
                                capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout), {
            'model': 'fixture-model', 'tools': ['Read', 'Grep', 'Glob'], 'result': 'review text'})

    def test_native_terminal_requires_matching_success_and_observed_process(self):
        import copy
        complete = {
            'runId': 'owned-run', 'success': True, 'state': 'complete',
            'results': [{'agent': 'control', 'success': True, 'status': 'completed'}]}
        status = {
            'details': {'runId': 'owned-run', 'lifecycleStatus': {'processTerminal': {
                'runId': 'owned-run', 'state': 'observed',
                'instances': [{'kind': 'runner', 'exitCode': 0, 'signal': None}]}}},
            'asyncSnapshot': {'runs': [{'id': 'owned-run', 'state': 'complete'}]}}
        payloads = [{'completion': complete, 'status': status}]
        for mutate in [
            lambda c, s: c.update(success=False),
            lambda c, s: c.update(state='failed'),
            lambda c, s: c.update(runId='foreign-run'),
            lambda c, s: c['results'][0].update(agent='other-agent'),
            lambda c, s: s['asyncSnapshot'].update(runs=[]),
            lambda c, s: s['asyncSnapshot']['runs'][0].update(state='running'),
            lambda c, s: s['details']['lifecycleStatus']['processTerminal'].update(state='pending'),
            lambda c, s: s['details']['lifecycleStatus']['processTerminal']['instances'][0].update(exitCode=1)]:
            c, s = copy.deepcopy(complete), copy.deepcopy(status)
            mutate(c, s)
            payloads.append({'completion': c, 'status': s})
        module = (ROOT / 'tests/spotify_design_native_host.mjs').as_uri()
        script = f'''import {{ validateNativeTerminal }} from {json.dumps(module)};
const cases = JSON.parse(process.argv[1]);
console.log(JSON.stringify(cases.map(x=>{{try{{validateNativeTerminal('owned-run','control',x.completion,x.status);return true;}}catch{{return false;}}}})));'''
        result = subprocess.run([NODE, '--input-type=module', '-e', script, json.dumps(payloads)],
                                capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout), [True, False, False, False, False, False, False, False, False])

    def test_prepare_records_owned_isolation_canaries_and_definition_hashes(self):
        import hashlib
        result = self.call()
        self.assertEqual(result.returncode, 0, result.stderr)
        manifest = json.loads((self.out / 'manifest.json').read_text())
        self.assertEqual(set(manifest.get('isolation', {}).get('canaries', [])), {
            'SPOTIFY_ANCESTOR_CANARY', 'SPOTIFY_FIXTURE_HOME_CANARY', 'Pi 汎用基本ルール'})
        for name in ['AGENTS.md', 'CLAUDE.md', 'host/AGENTS.md', 'observer.mjs']:
            self.assertTrue((self.out / name).is_file(), name)
        for path, value in manifest['definitionHashes'].items():
            self.assertEqual(hashlib.sha256((self.out / 'fixture' / path).read_bytes()).hexdigest(), value)
        self.assertIn('.pi/agents/spotify-control-ux.md', manifest['definitionHashes'])
        self.assertIn('.claude/agents/spotify-control-ux.md', manifest['definitionHashes'])

    def test_pi_runtime_observation_requires_real_child_and_read_only_tools(self):
        import copy
        good = {'phase': 'before_agent_start', 'sessionFile': '/owned/session.jsonl',
                'cwd': '/owned/fixture', 'model': 'provider/model',
                'activeTools': ['read', 'anchor_grep'], 'commands': [], 'canaryHits': []}
        cases = [[good], [], [dict(good, phase='session_start')],
                 [dict(good, activeTools=['read', 'anchor_grep', 'bash'])],
                 [dict(good, sessionFile='/foreign/session.jsonl')],
                 [dict(good, cwd='/foreign')],
                 [dict(good, canaryHits=['SPOTIFY_ANCESTOR_CANARY'])],
                 [dict(good, commands=[{'name': 'spotify-ancestor-sentinel', 'source': 'skill'}])]]
        module = (ROOT / 'tests/spotify_design_native_host.mjs').as_uri()
        script = f'''import {{ validatePiObservations }} from {json.dumps(module)};
const cases=JSON.parse(process.argv[1]);
console.log(JSON.stringify(cases.map(rows=>{{try{{validatePiObservations(rows,'/owned/session.jsonl','/owned/fixture');return true;}}catch{{return false;}}}})));'''
        result = subprocess.run([NODE, '--input-type=module', '-e', script, json.dumps(copy.deepcopy(cases))],
                                capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout), [True, False, False, False, False, False, False, False])

    def test_fixture_is_an_independent_git_root(self):
        result = self.call()
        self.assertEqual(result.returncode, 0, result.stderr)
        project = self.out / 'fixture'
        result = subprocess.run(['git', '-C', str(project), 'rev-parse', '--show-toplevel'],
                                capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(Path(result.stdout.strip()).resolve(), project.resolve())

    def test_prepare_claude_uses_native_role_and_read_only_tool_intent(self):
        result = self.call('--runtime', 'claude', '--role', 'ui', '--case', 'C4')
        self.assertEqual(result.returncode, 0, result.stderr)
        manifest = json.loads((self.out / 'manifest.json').read_text())
        role = self.out / 'fixture/.claude/agents/spotify-control-ui.md'
        self.assertTrue(role.is_file())
        self.assertEqual(manifest['runtime'], 'claude')
        self.assertEqual(manifest['modelRequests'], 0)
        self.assertTrue((self.out / 'fixture/input/screen.png').is_file())
        self.assertNotIn('source-facts.md', manifest['jobs'][0]['task'])
        self.assertNotIn('Write', role.read_text().split('---')[1])


if __name__ == '__main__':
    unittest.main()
