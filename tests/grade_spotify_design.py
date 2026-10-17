"""Structure-only grading of native answers. Semantic judgments remain manual."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def review_errors(value):
    errors = []
    if not isinstance(value, dict):
        return ['review must be an object']
    required = {'target', 'evidence', 'visual_mode', 'status', 'summary', 'good_points',
                'findings', 'unverified', 'handoff'}
    errors += ['missing ' + name for name in sorted(required - value.keys())]
    if value.get('status') not in {'needs-clarification', 'needs-evidence', 'changes-required',
                                  'ready-for-implementation', 'reviewed-within-scope'}:
        errors.append('invalid status')
    if value.get('visual_mode') not in {'spotify-inspired', 'brand-adapted', None}:
        errors.append('invalid visual_mode')
    for name in ['evidence', 'good_points', 'unverified', 'findings']:
        if not isinstance(value.get(name), list):
            errors.append(name + ' must be array')
    handoff = value.get('handoff')
    if not isinstance(handoff, dict) or any(not isinstance(handoff.get(name), list)
                                          for name in ['changes', 'preserve', 'parent_decisions']):
        errors.append('incomplete handoff')
    sources = {}
    for row in (ROOT / 'dot_agents/skills/spotify-design/references/sources.md').read_text().splitlines():
        if re.match(r'^\| S\d{2} \|', row):
            cols = [s.strip() for s in row.split('|')[1:-1]]
            year = re.search(r'20\d{2}', cols[2])
            sources[cols[0]] = (year.group() if year else '更新型', cols[4])
    sources['our'] = ('2026', 'our-recommendation')
    ids = set()
    for index, finding in enumerate(value.get('findings', []) if isinstance(value.get('findings'), list) else []):
        prefix = f'finding {index}: '
        if not isinstance(finding, dict):
            errors.append(prefix + 'not an object')
            continue
        for name in ['finding_id', 'target', 'observation', 'impact', 'change']:
            if not isinstance(finding.get(name), str) or not finding[name].strip():
                errors.append(prefix + 'missing ' + name)
        identity = finding.get('finding_id')
        if identity in ids:
            errors.append(prefix + 'duplicate finding_id')
        if isinstance(identity, str):
            ids.add(identity)
        if finding.get('evidence_status') not in {'confirmed', 'recommendation', 'needs-evidence'}:
            errors.append(prefix + 'ambiguous evidence_status')
        priority = finding.get('priority')
        if not isinstance(priority, dict) or priority.get('level') not in {'blocker', 'major', 'minor'} or not priority.get('reason'):
            errors.append(prefix + 'incomplete priority')
        acceptance = finding.get('acceptance')
        if not isinstance(acceptance, dict) or any(not isinstance(acceptance.get(n), str) or not acceptance[n].strip()
                                                for n in ['condition', 'action', 'expected', 'evidence']):
            errors.append(prefix + 'incomplete acceptance')
        basis = finding.get('basis')
        if not isinstance(basis, list) or not basis:
            errors.append(prefix + 'basis missing')
        else:
            for reference in basis:
                if not isinstance(reference, dict):
                    errors.append(prefix + 'invalid reference')
                    continue
                expected = sources.get(reference.get('source_id'))
                if expected is None or (str(reference.get('year')), reference.get('category')) != expected or not reference.get('scope'):
                    errors.append(prefix + 'source year/category/scope mismatch: ' + str(reference.get('source_id')))
    return errors


def parse_review(text):
    stripped = text.strip()
    blocks = re.findall(r'```json\s*\n(.*?)\n```', stripped, re.S)
    if blocks:
        if len(blocks) != 1:
            raise ValueError('Expected one review JSON block')
        stripped = blocks[0]
    return json.loads(stripped)
