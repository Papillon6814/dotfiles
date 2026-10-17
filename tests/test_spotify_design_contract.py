"""Validate public handoff structure; never substitutes for human semantic review."""
import copy
import importlib.util
from pathlib import Path
import unittest

MODULE = Path(__file__).with_name('grade_spotify_design.py')


class ReviewContractTests(unittest.TestCase):
    def validate(self, value):
        self.assertTrue(MODULE.is_file(), 'Review contract validator is missing')
        spec = importlib.util.spec_from_file_location('spotify_grade', MODULE)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module.review_errors(value)

    def good(self):
        return {
            'target': '予約画面', 'evidence': ['image'], 'visual_mode': 'brand-adapted',
            'status': 'needs-evidence', 'summary': '未検証', 'good_points': [],
            'findings': [{'finding_id': 'UI-01', 'target': 'link', 'observation': '同じラベル',
                          'impact': '取り違える可能性', 'priority': {'level': 'major', 'reason': '対象選択'},
                          'evidence_status': 'needs-evidence',
                          'basis': [{'source_id': 'S01', 'year': '2020', 'category': 'public-principle', 'scope': '原則'}],
                          'change': '調べる', 'acceptance': {'condition': 'iOS', 'action': '読む',
                                                        'expected': '区別する', 'evidence': '記録'}}],
            'unverified': ['読み上げ'], 'handoff': {'changes': [], 'preserve': ['brand'], 'parent_decisions': []}}

    def test_complete_contract_is_accepted(self):
        self.assertEqual(self.validate(self.good()), [])

    def test_missing_fields_ambiguous_evidence_and_duplicate_ids_are_rejected(self):
        mutations = [
            lambda x: x['findings'][0].pop('target'),
            lambda x: x['findings'][0].pop('finding_id'),
            lambda x: x['findings'][0].update(evidence_status='confirmed / needs-evidence'),
            lambda x: x['findings'].append(copy.deepcopy(x['findings'][0])),
            lambda x: x['findings'][0]['basis'][0].update(year='2023'),
            lambda x: x['findings'][0]['basis'][0].update(category='case-study'),
            lambda x: x['findings'][0]['basis'][0].update(source_id='S99'),
            lambda x: x['findings'][0]['acceptance'].pop('condition'),
            lambda x: x['findings'][0]['priority'].pop('reason'),
            lambda x: x.update(status='passed'),
            lambda x: x.pop('handoff')]
        for mutate in mutations:
            value = self.good()
            mutate(value)
            self.assertTrue(self.validate(value))

    def test_clarification_does_not_invent_missing_inputs(self):
        value = self.good()
        value.update(target=None, visual_mode=None, status='needs-clarification', findings=[])
        value['handoff']['parent_decisions'] = ['OSと目的を確認']
        self.assertEqual(self.validate(value), [])


if __name__ == '__main__':
    unittest.main()
