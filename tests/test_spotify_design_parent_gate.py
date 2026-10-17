"""Real report regressions and a bounded, parent-owned repair decision. No models."""
from pathlib import Path
import copy
import hashlib
import json
import subprocess
import sys
import unittest
import spotify_design_output_checks as checks
from grade_spotify_design import parse_review

ROOT = Path(__file__).resolve().parents[1]
BAD = ROOT / 'tests/fixtures/spotify-design/a8ffddd2-incomplete.md'
HISTORY = ROOT / 'work/spotify-design-validation/claude-adapterfix-final-assessment.json'
MISSING = ['unverified', 'handoff', 'findings[0].change', 'findings[0].acceptance']


class ParentGateTests(unittest.TestCase):
    def assess(self, text, **kwargs):
        self.assertTrue(callable(getattr(checks, 'assess_parent_reply', None)),
                        'parent-callable required-field gate is missing')
        return checks.assess_parent_reply(text, **kwargs)

    def complete(self):
        report = parse_review(BAD.read_text())
        report['unverified'] = ['実機の動作は未確認。']
        report['handoff'] = {'changes': ['仕様と実機記録を依頼。'],
                             'preserve': ['白と青のブランド。'], 'parent_decisions': ['実機証拠の手配。']}
        report['findings'][0]['change'] = '操作の仕様と記録を親へ依頼。'
        report['findings'][0]['acceptance'] = {
            'condition': '両OSの実装を確認。', 'action': '変更入口を操作。',
            'expected': '対象を識別できる。', 'evidence': '実機記録。'}
        return report

    def test_a8ffddd2_detects_exact_missing_fields_and_generates_only_three_inputs(self):
        raw = BAD.read_text()
        d = self.assess(raw, original_input='元の入力をそのまま保持')
        self.assertEqual(d['action'], 'repair')
        self.assertEqual(d['missing_fields'], MISSING)
        self.assertEqual(d['repair_payload'], {'original_input': '元の入力をそのまま保持',
                                              'previous_response': raw, 'missing_fields': MISSING})
        self.assertEqual(d['repair_instruction'], '前回の返答を保ったまま、欠けた欄だけを補った完全な JSON を返す。')
        self.assertNotIn('修正案の推測', d['repair_instruction'])

    def test_second_incomplete_response_is_rejected_without_another_prompt(self):
        d = self.assess(BAD.read_text(), repair_count=1, original_input='元入力',
                        previous_response=BAD.read_text())
        self.assertEqual(d['action'], 'reject')
        self.assertEqual(d['missing_fields'], MISSING)
        self.assertNotIn('repair_payload', d)

    def test_complete_repair_preserves_original_values(self):
        d = self.assess(json.dumps(self.complete(), ensure_ascii=False), repair_count=1,
                        previous_response=BAD.read_text())
        self.assertEqual(d['action'], 'accept')
        self.assertEqual(d['missing_fields'], [])

    def test_complete_but_rewritten_previous_observation_is_rejected(self):
        report = self.complete()
        report['findings'][0]['observation'] = '実機で動作不能と確認した。'
        d = self.assess(json.dumps(report), repair_count=1, previous_response=BAD.read_text())
        self.assertEqual(d['action'], 'reject')
        self.assertIn('findings[0].observation', d['preservation_errors'])

    def test_unrequested_added_finding_is_not_a_missing_field_repair(self):
        report = self.complete()
        report['findings'].append(copy.deepcopy(report['findings'][0]))
        d = self.assess(json.dumps(report), repair_count=1, previous_response=BAD.read_text())
        self.assertEqual(d['action'], 'reject')

    def test_each_of_nine_finding_fields_is_inspected(self):
        for name in ['finding_id', 'target', 'observation', 'impact', 'priority',
                     'evidence_status', 'basis', 'change', 'acceptance']:
            report = self.complete()
            del report['findings'][0][name]
            d = self.assess(json.dumps(report))
            self.assertIn('findings[0].' + name, d['missing_fields'])

    def test_nested_handoff_and_acceptance_are_not_present_but_empty_shells(self):
        report = self.complete()
        del report['handoff']['preserve']
        del report['findings'][0]['acceptance']['expected']
        d = self.assess(json.dumps(report))
        self.assertEqual(d['missing_fields'], ['handoff.preserve', 'findings[0].acceptance.expected'])

    def test_design_contract_is_not_mistaken_for_missing_review_json(self):
        self.assertEqual(self.assess('通常・空・権限不足の設計表', task_mode='design')['action'], 'not-applicable')

    def test_invalid_json_is_fail_closed_not_invented_field_content(self):
        d = self.assess('{broken')
        self.assertEqual(d['action'], 'reject')
        self.assertNotIn('repair_payload', d)

    def test_parent_cli_is_json_in_json_out_without_models(self):
        p = subprocess.run([sys.executable, str(ROOT / 'tests/spotify_design_output_checks.py'), '--parent-check'],
                           input=json.dumps({'response': BAD.read_text(), 'original_input': '元入力'}),
                           text=True, capture_output=True, timeout=10)
        self.assertEqual(p.returncode, 0, p.stderr)
        d = json.loads(p.stdout)
        self.assertEqual(d['action'], 'repair')
        self.assertEqual(d['missing_fields'], MISSING)

    def test_native_parent_bridge_and_one_repair_planner_use_the_actual_gate(self):
        host = (ROOT / 'tests/spotify_design_native_host.mjs').as_uri()
        script = '''import {readFileSync} from 'node:fs';
const host=await import(process.argv[1]);
if(typeof host.parentReviewCheck!=='function'||typeof host.planContractRepair!=='function')throw Error('Parent bridge/repair planner missing');
const decision=await host.parentReviewCheck({response:readFileSync(process.argv[2],'utf8'),original_input:'original input'});
const job={index:0,agent:'same-agent',cwd:'/owned',task:'original input'};
const fresh=host.planContractRepair(job,decision,{capabilities:{resume:false}},'old-run');
const resumed=host.planContractRepair(job,decision,{capabilities:{resume:true}},'old-run');
let refused=false;try{host.planContractRepair(fresh,decision,{capabilities:{resume:false}},'new-run');}catch{refused=true;}
console.log(JSON.stringify({fresh,resumed,refused}));'''
        p = subprocess.run(['node', '--input-type=module', '-e', script, host, str(BAD)],
                           text=True, capture_output=True, timeout=15)
        self.assertEqual(p.returncode, 0, p.stderr)
        result = json.loads(p.stdout)
        self.assertEqual(result['fresh']['agent'], 'same-agent')
        self.assertEqual(result['fresh']['cwd'], '/owned')
        self.assertEqual(result['fresh']['repairOf'], 0)
        self.assertEqual(result['fresh']['correctionMode'], 'repair-start')
        self.assertEqual(result['resumed']['correctionMode'], 'resume')
        self.assertEqual(result['resumed']['resumeRunId'], 'old-run')
        instruction, payload = result['fresh']['task'].split('\n', 1)
        self.assertEqual(instruction, '前回の返答を保ったまま、欠けた欄だけを補った完全な JSON を返す。')
        self.assertEqual(set(json.loads(payload)), {'original_input', 'previous_response', 'missing_fields'})
        self.assertTrue(result['refused'])

    def test_parent_orchestrator_accepts_after_one_repair_and_rejects_after_two_bad_answers(self):
        host = (ROOT / 'tests/spotify_design_native_host.mjs').as_uri()
        script = '''import {readFileSync} from 'node:fs';
const host=await import(process.argv[1]);
if(typeof host.executeContractTrials!=='function')throw Error('Parent orchestrator missing');
const bad=readFileSync(process.argv[2],'utf8'), good=process.argv[3];
const outcomes=[];
for(const answers of [[bad,good],[bad,bad],[good]]){
 let index=0;
 // Only the live native/model boundary is doubled; real Python gate and planner run.
 const result=await host.executeContractTrials([{index:0,agent:'same',cwd:'/owned',task:'original'}],async job=>({response:answers[index++],runId:'run-'+index,runner:{capabilities:{resume:false}},usage:{turns:1}}));
 outcomes.push({accepted:result.accepted,childLaunches:result.childLaunches,repairs:result.repairs,action:result.trials[0].finalAction});
}
console.log(JSON.stringify(outcomes));'''
        p = subprocess.run(['node', '--input-type=module', '-e', script, host, str(BAD),
                            json.dumps(self.complete(), ensure_ascii=False)], text=True, capture_output=True, timeout=20)
        self.assertEqual(p.returncode, 0, p.stderr)
        self.assertEqual(json.loads(p.stdout), [
            {'accepted': 1, 'childLaunches': 2, 'repairs': 1, 'action': 'accept'},
            {'accepted': 0, 'childLaunches': 2, 'repairs': 1, 'action': 'reject'},
            {'accepted': 1, 'childLaunches': 1, 'repairs': 0, 'action': 'accept'}])

    @unittest.skipUnless(HISTORY.is_file(), 'historical local evidence absent; portable real-failure fixture still tested')
    def test_all_43_previously_accepted_reports_have_zero_false_repairs(self):
        data = json.loads(HISTORY.read_text())
        rows = data['records'] + data['retainedPiRows']
        rows = [r for r in rows if r['runId'] != 'a8ffddd2-a777-4baa-8341-8b819cf48968']
        self.assertEqual(len(rows), 43)
        false_positives = []
        for row in rows:
            path = ROOT / row['answer']
            text = path.read_text()
            self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), row['outputSha256'])
            d = self.assess(text, task_mode='design' if row['case'] == 'C1' else 'review')
            if d['action'] not in ['accept', 'not-applicable']:
                false_positives.append((row['runId'], d))
        self.assertEqual(false_positives, [])


if __name__ == '__main__':
    unittest.main()
