"""scripts/muxy-settings-compare.py の試験。

基準（MBP）の値が、比べる側（mini）にすべて同じ値で入っているかを確かめる。
--ignore で指定した項目（作業状態）は比べない。比べる側にだけある項目は許す。
"""
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "muxy-settings-compare.py"

BASE = """
[appearance]
light_theme = "Muxy Light"
project_recent = ["a", "b"]

[keymap]
close_pane = "cmd-w"
close_tab = "cmd-shift-w"
"""


class MuxySettingsCompare(unittest.TestCase):
    def run_compare(self, base, other, *ignore):
        with tempfile.TemporaryDirectory() as d:
            a = Path(d, "a.toml")
            b = Path(d, "b.toml")
            a.write_text(base)
            b.write_text(other)
            args = [sys.executable, str(SCRIPT), str(a), str(b)]
            for path in ignore:
                args += ["--ignore", path]
            return subprocess.run(args, capture_output=True, text=True)

    def test_same_files_match(self):
        result = self.run_compare(BASE, BASE)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_keymap_value_difference_is_reported(self):
        other = BASE.replace('close_pane = "cmd-w"', 'close_pane = "cmd-shift-w"')
        result = self.run_compare(BASE, other)
        self.assertEqual(result.returncode, 1)
        self.assertIn("keymap.close_pane", result.stdout)

    def test_ignored_state_key_is_not_compared(self):
        other = BASE.replace('["a", "b"]', '["x"]')
        result = self.run_compare(BASE, other, "appearance.project_recent")
        self.assertEqual(result.returncode, 0, result.stdout)

    def test_key_missing_on_other_side_is_reported(self):
        other = BASE.replace('close_tab = "cmd-shift-w"\n', "")
        result = self.run_compare(BASE, other)
        self.assertEqual(result.returncode, 1)
        self.assertIn("keymap.close_tab", result.stdout)

    def test_extra_key_on_other_side_is_allowed(self):
        other = BASE + '\n[browser]\nenabled = true\n'
        result = self.run_compare(BASE, other)
        self.assertEqual(result.returncode, 0, result.stdout)


if __name__ == "__main__":
    unittest.main()
