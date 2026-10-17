"""Output checks consume reports, not instruction wording. Models remain a live gate."""
import unittest
from spotify_design_output_checks import review_language_errors, design_state_label_errors


class OutputChecks(unittest.TestCase):
    def test_english_report_is_rejected_even_when_its_json_keys_are_valid(self):
        report = {'summary': 'The response can be lost after a change.', 'good_points': [], 'findings': []}
        self.assertEqual(review_language_errors(report), ['summary: expected Japanese prose'])

    def test_japanese_prose_preserves_english_keys_and_technical_names(self):
        report = {'summary': 'APIの応答消失は結果不明として扱う。', 'good_points': ['SaveとDeleteを分離できる。'],
                  'findings': [{'observation': '完了の後に応答がない。', 'impact': '結果を取り違える可能性。',
                                'change': '結果を照合する。', 'priority': {'reason': '主要タスクに関係する。'},
                                'acceptance': {'condition': '応答を遮断。', 'action': '状態を照合。',
                                               'expected': '二重反映しない。', 'evidence': 'APIログと記録。'}}]}
        self.assertEqual(review_language_errors(report), [])

    def test_japanese_summary_does_not_hide_english_body(self):
        report = {'summary': '結果不明を分ける。', 'good_points': [],
                  'findings': [{'change': 'Resend without checking.', 'observation': '応答なし。', 'impact': '誤操作の可能性。'}]}
        self.assertIn('findings[0].change: expected Japanese prose', review_language_errors(report))

    def test_technical_only_accessibility_condition_is_not_an_english_report(self):
        report = {'summary': '読み上げを確認する。', 'good_points': [],
                  'findings': [{'observation': '実機記録なし。', 'impact': '対象を誤認する可能性。',
                                'change': '実機で確認する。', 'acceptance': {'condition': 'VoiceOver/TalkBack',
                                 'action': '各要素へ移動。', 'expected': '名前を区別できる。', 'evidence': 'OS別の記録。'}}]}
        self.assertEqual(review_language_errors(report), [])

    def test_c1_missing_state_labels_are_not_hidden_by_communication_table(self):
        text = '通常の予約確認→日付選択→確定。未送信・確定失敗・結果不明・成功。読込中、期限切れ、再送、取消と復帰。'
        self.assertEqual(design_state_label_errors(text), ['missing state label: initial', 'missing state label: empty', 'missing state label: permission'])

    def test_state_applicability_matrix_can_explain_not_applicable_without_new_features(self):
        text = '初回：専用機能不要。通常：予約確認。空：取得済み0件だけ。読込：進行中。成功：照合後。エラー：明示拒否。接続不良：結果不明。権限不足：既存認証へ戻る、新機能不要。取消：未送信のみ。再試行：未反映確認後。復帰：状態照合。'
        self.assertEqual(design_state_label_errors(text), [])


if __name__ == '__main__':
    unittest.main()
