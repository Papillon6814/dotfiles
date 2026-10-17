"""Prescreens for actual reports. Passing never replaces semantic review.

Japanese checks do not infer semantic quality. State labels only identify obvious
omissions; humans must still verify applicability/reasons and safe transitions.
"""
import re


def review_language_errors(report):
    fields = [('summary', report.get('summary'))]
    fields += [(f'good_points[{i}]', value) for i, value in enumerate(report.get('good_points', []))]
    for i, finding in enumerate(report.get('findings', [])):
        for key in ['observation', 'impact', 'change']:
            fields.append((f'findings[{i}].{key}', finding.get(key)))
        fields.append((f'findings[{i}].priority.reason', finding.get('priority', {}).get('reason')))
        for key, value in finding.get('acceptance', {}).items():
            fields.append((f'findings[{i}].acceptance.{key}', value))
    return [name + ': expected Japanese prose' for name, value in fields
            if isinstance(value, str) and value.strip() and not re.search(r'[ぁ-んァ-ヶ一-龠]', value)]


def design_state_label_errors(text):
    labels = {
        'initial': r'初回|初期', 'normal': r'通常', 'empty': r'空|0件|ゼロ件',
        'loading': r'読込|読み込|取得中', 'success': r'成功|完了',
        'error': r'エラー|失敗|拒否', 'disconnected': r'接続|切断|結果不明',
        'permission': r'権限|認証不足', 'cancel': r'取消|取り消|キャンセル',
        'retry': r'再試行|再送', 'restore': r'復帰|戻',
    }
    return ['missing state label: ' + name for name, pattern in labels.items()
            if not re.search(pattern, text)]
