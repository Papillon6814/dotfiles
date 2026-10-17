"""Artifact/load boundary checks; behavior remains a separate live gate."""
from pathlib import Path
import os
import re
import shutil
import subprocess
import tempfile
import unittest
import yaml

ROOT = Path(__file__).resolve().parents[1]
SHARED = ROOT / 'dot_agents/skills/spotify-design'


def frontmatter(path):
    text = path.read_text()
    return yaml.safe_load(text.split('---', 2)[1]), text


class SpotifyDesignAssetTests(unittest.TestCase):
    def require(self, path):
        self.assertTrue(path.is_file(), f'Missing artifact: {path.relative_to(ROOT)}')
        return path

    def test_shared_skill_name_description_and_local_references(self):
        path = self.require(SHARED / 'SKILL.md')
        meta, text = frontmatter(path)
        self.assertEqual(meta['name'], 'spotify-design')
        self.assertTrue(1 <= len(meta['description']) <= 1024)
        self.assertNotIn('allowed-tools', meta)
        expected = {'principles', 'sources', 'ux-design-review', 'ui-design-review',
                    'inclusive-design', 'contracts', 'runtime-pi', 'runtime-claude'}
        self.assertEqual({p.stem for p in (SHARED / 'references').glob('*.md')}, expected)
        for doc in [path, *list((SHARED / 'references').glob('*.md'))]:
            for target in re.findall(r'\]\(([^)#]+)(?:#[^)]*)?\)', doc.read_text()):
                if not re.match(r'https?://', target):
                    self.assertTrue((doc.parent / target).is_file(), f'{doc.name} -> {target}')
        matches = [p for p in (ROOT / 'dot_agents/skills').glob('*/SKILL.md')
                   if frontmatter(p)[0].get('name') == 'spotify-design']
        self.assertEqual(matches, [path])

    def test_source_ids_are_unique_and_resolvable(self):
        path = self.require(SHARED / 'references/sources.md')
        ids = re.findall(r'^\| (S\d{2}) \|', path.read_text(), re.M)
        for row in path.read_text().splitlines():
            if row.startswith('| S'):
                cells = row.split('|')
                self.assertEqual(len(cells), 7, row)
                self.assertIn(cells[5].strip(), {'public-principle', 'case-study', 'external-standard'})
        self.assertEqual(len(ids), len(set(ids)))
        self.assertTrue({'S01', 'S03', 'S04', 'S11', 'S12', 'S21', 'S22', 'S23'} <= set(ids))
        for doc in SHARED.rglob('*.md'):
            referenced = set(re.findall(r'\bS\d{2}\b', doc.read_text()))
            self.assertFalse(referenced - set(ids), str(doc))
            self.assertNotIn('/Users/', doc.read_text())

    def test_both_runtimes_have_exact_read_only_tools_and_explicit_skill(self):
        for directory, tools in [('dot_pi/private_agent/agents', {'read', 'anchor_grep', 'contact_supervisor'}),
                                 ('dot_claude/agents', {'Read', 'Grep', 'Glob'})]:
            for role in ['ux', 'ui']:
                path = self.require(ROOT / directory / f'spotify-{role}-manager.md')
                meta, body = frontmatter(path)
                self.assertEqual(meta['name'], f'spotify-{role}-manager')
                actual = meta['tools']
                if isinstance(actual, str):
                    actual = [s.strip() for s in actual.split(',')]
                self.assertEqual(set(actual), tools)
                self.assertEqual(len(actual), len(tools))
                self.assertEqual(meta['skills'], ['spotify-design'])
                self.assertNotIn('model', meta)
                self.assertNotIn('runner', meta)
                self.assertNotIn('permissionMode', meta)
                self.assertIn('spotify-design', body)

    def test_chezmoi_link_and_exact_targets_in_synthetic_home(self):
        self.require(SHARED / 'SKILL.md')
        link = self.require(ROOT / 'dot_claude/skills/symlink_spotify-design')
        self.assertEqual(link.read_text().strip(), '../../.agents/skills/spotify-design')
        self.assertFalse((ROOT / 'dot_pi/private_agent/skills/symlink_spotify-design').exists())
        binary = shutil.which('chezmoi')
        self.assertIsNotNone(binary, 'chezmoi is required; do not silently skip placement verification')
        with tempfile.TemporaryDirectory(prefix='spotify-placement-') as temporary:
            base = Path(temporary)
            source = base / 'source'
            for relative in ['dot_agents/skills/spotify-design', 'dot_claude/agents',
                             'dot_claude/skills', 'dot_pi/private_agent/agents']:
                (source / relative).mkdir(parents=True, exist_ok=True)
            shutil.copytree(SHARED, source / 'dot_agents/skills/spotify-design', dirs_exist_ok=True)
            shutil.copy2(link, source / 'dot_claude/skills/symlink_spotify-design')
            shutil.copy2(ROOT / '.chezmoiignore', source / '.chezmoiignore')
            for role in ['ux', 'ui']:
                for relative in ['dot_claude/agents', 'dot_pi/private_agent/agents']:
                    name = f'spotify-{role}-manager.md'
                    shutil.copy2(ROOT / relative / name, source / relative / name)
            home = base / 'home'
            home.mkdir()
            config = base / 'config.toml'
            config.write_text('')
            targets = [home / '.agents/skills/spotify-design', home / '.claude/skills/spotify-design']
            for role in ['ux', 'ui']:
                targets += [home / f'.pi/agent/agents/spotify-{role}-manager.md',
                            home / f'.claude/agents/spotify-{role}-manager.md']
            command = [binary, '--source', str(source), '--destination', str(home),
                       '--config', str(config), '--cache', str(base / 'cache'),
                       '--persistent-state', str(base / 'state.db'), '--refresh-externals=never',
                       '--no-tty', 'apply', '--parent-dirs', '--exclude=scripts', *map(str, targets)]
            result = subprocess.run(command, env=dict(os.environ, HOME=str(home)),
                                    text=True, capture_output=True, timeout=30)
            self.assertEqual(result.returncode, 0, result.stderr)
            installed = home / '.claude/skills/spotify-design'
            self.assertTrue(installed.is_symlink())
            self.assertEqual(installed.resolve(), (home / '.agents/skills/spotify-design').resolve())
            self.assertEqual((installed / 'SKILL.md').read_bytes(), (SHARED / 'SKILL.md').read_bytes())
            for target in targets:
                self.assertTrue(target.exists(), str(target))


if __name__ == '__main__':
    unittest.main()
