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
            if isinstance(value, str) and value.strip() and not re.search(r'[ぁ-んァ-ヶ一-龠]', value)
            and not ('.acceptance.condition' in name and re.fullmatch(
                r'(?:iOS|Android|VoiceOver|TalkBack)(?:[/×・＋+ ]+(?:iOS|Android|VoiceOver|TalkBack))*', value))]


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


# Parent-facing review gate: presence/completeness only, not semantic grading.
def missing_review_fields(report):
    missing = []
    if not isinstance(report, dict):
        return ['$']

    def string(value):
        return isinstance(value, str) and bool(value.strip())

    def object_fields(value, path, fields, predicate):
        if not isinstance(value, dict):
            missing.append(path)
        else:
            for key in fields:
                if not predicate(value.get(key)):
                    missing.append(path + '.' + key)

    if not isinstance(report.get('unverified'), list):
        missing.append('unverified')
    object_fields(report.get('handoff'), 'handoff', ['changes', 'preserve', 'parent_decisions'],
                  lambda value: isinstance(value, list))
    findings = report.get('findings')
    if not isinstance(findings, list):
        return missing + ['findings']
    for index, finding in enumerate(findings):
        path = f'findings[{index}]'
        if not isinstance(finding, dict):
            missing.append(path)
            continue
        for key in ['finding_id', 'target', 'observation', 'impact']:
            if not string(finding.get(key)):
                missing.append(path + '.' + key)
        object_fields(finding.get('priority'), path + '.priority', ['level', 'reason'], string)
        if not string(finding.get('evidence_status')):
            missing.append(path + '.evidence_status')
        basis = finding.get('basis')
        if not isinstance(basis, list) or not basis:
            missing.append(path + '.basis')
        else:
            for j, item in enumerate(basis):
                object_fields(item, path + f'.basis[{j}]', ['source_id', 'year', 'category', 'scope'],
                              lambda value: value is not None and bool(str(value).strip()))
        if not string(finding.get('change')):
            missing.append(path + '.change')
        object_fields(finding.get('acceptance'), path + '.acceptance',
                      ['condition', 'action', 'expected', 'evidence'], string)
    return missing


def _preservation_errors(before, after, missing, path=''):
    if path in missing:
        return []
    if isinstance(before, dict) and isinstance(after, dict):
        errors = []
        for key, value in before.items():
            child = path + '.' + key if path else key
            errors += [child] if key not in after else _preservation_errors(value, after[key], missing, child)
        for key in after.keys() - before.keys():
            child = path + '.' + key if path else key
            if child not in missing:
                errors.append(child)
        return errors
    if isinstance(before, list) and isinstance(after, list):
        if len(before) != len(after):
            return [path]
        return [error for i, value in enumerate(before)
                for error in _preservation_errors(value, after[i], missing, path + f'[{i}]')]
    return [] if type(before) is type(after) and before == after else [path]


def assess_parent_reply(response, original_input='', task_mode='review', repair_count=0,
                        previous_response=None):
    from grade_spotify_design import parse_review
    if type(repair_count) is not int or repair_count not in [0, 1]:
        return {'action': 'reject', 'missing_fields': [], 'reason': 'repair-budget-invalid'}
    if task_mode == 'design':
        return {'action': 'not-applicable', 'missing_fields': []}
    if task_mode != 'review' or not isinstance(response, str):
        return {'action': 'reject', 'missing_fields': [], 'reason': 'invalid-input'}
    try:
        report = parse_review(response)
    except (ValueError, TypeError):
        return {'action': 'reject', 'missing_fields': [], 'reason': 'invalid-json'}
    if not isinstance(report, dict):
        return {'action': 'reject', 'missing_fields': [], 'reason': 'review-not-object'}
    missing = missing_review_fields(report)
    preservation = []
    if repair_count:
        try:
            before = parse_review(previous_response)
            if not isinstance(before, dict):
                raise ValueError('previous-not-object')
        except (ValueError, TypeError, AttributeError):
            return {'action': 'reject', 'missing_fields': missing, 'reason': 'previous-response-unavailable'}
        preservation = _preservation_errors(before, report, set(missing_review_fields(before)))
    action = 'reject' if preservation or (missing and repair_count) else 'repair' if missing else 'accept'
    result = {'action': action, 'missing_fields': missing, 'preservation_errors': preservation}
    if action == 'repair':
        result['repair_instruction'] = '前回の返答を保ったまま、欠けた欄だけを補った完全な JSON を返す。'
        result['repair_payload'] = {'original_input': original_input, 'previous_response': response,
                                    'missing_fields': missing}
    return result


if __name__ == '__main__':
    import json
    import sys
    if sys.argv[1:] != ['--parent-check']:
        raise SystemExit('Use --parent-check with a JSON object on stdin')
    raw = sys.stdin.read(2_000_001)
    try:
        if len(raw) > 2_000_000:
            raise ValueError('input-too-large')
        request = json.loads(raw)
        result = assess_parent_reply(**request)
    except (ValueError, TypeError):
        print(json.dumps({'action': 'reject', 'reason': 'invalid-parent-request'}))
        raise SystemExit(2)
    print(json.dumps(result, ensure_ascii=False))
