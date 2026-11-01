"""dot_local/bin/executable_muxy-settings-apply の試験。

Muxy の設定は、Muxy が起動中だと書き戻されて消えるため、終了しているときだけ当てる。
正の機械（MBP）では当てずに、現物と dotfiles の写しのずれを確かめる・写し直す。
pgrep・hostname・chezmoi を偽物に差し替えて確かめる。
"""
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SCRIPT = REPO / "dot_local" / "bin" / "executable_muxy-settings-apply"
SOURCE_HOST = "Soichiros-MacBook-Pro"
SNAPSHOT = '[keymap]\nclose_pane = "cmd-w"\n\n[appearance]\nproject_recent = ["a"]\n'


class MuxySettingsApply(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.home = Path(self.tmp.name, "home")
        self.src = Path(self.tmp.name, "src")
        self.bin = Path(self.tmp.name, "bin")
        self.log = Path(self.tmp.name, "chezmoi.log")
        for d in (self.home, self.bin, self.src / "scripts", self.src / ".chezmoitemplates" / "muxy"):
            d.mkdir(parents=True)
        shutil.copy(REPO / "scripts" / "muxy-settings-compare.py", self.src / "scripts")
        (self.src / ".chezmoitemplates" / "muxy" / "beta-settings.toml").write_text(SNAPSHOT)
        self.support = self.home / "Library" / "Application Support"
        self.write_tool("chezmoi", f'[ "$1" = source-path ] && {{ echo "{self.src}"; exit 0; }}\n'
                                   f'echo "CHEZMOI_MUXY=$CHEZMOI_MUXY $*" >> "{self.log}"\n')
        self.write_tool("hostname", 'echo "$FAKE_HOST"\n')

    def tearDown(self):
        self.tmp.cleanup()

    def write_tool(self, name, body):
        tool = self.bin / name
        tool.write_text("#!/bin/sh\n" + body)
        tool.chmod(0o755)

    def live(self, app, name, text):
        path = self.support / app / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text)
        return path

    def run_apply(self, *args, running="", host="MacMininoMac-mini-4"):
        self.write_tool("pgrep", f"printf '%s' '{running}' | grep -E \"$2\" && exit 0\nexit 1\n")
        env = dict(os.environ, PATH=f"{self.bin}:{Path(sys.executable).parent}:/usr/bin:/bin", HOME=str(self.home), FAKE_HOST=host)
        result = subprocess.run(["/bin/sh", str(SCRIPT), *args], capture_output=True, text=True, env=env)
        calls = self.log.read_text() if self.log.exists() else ""
        return result, calls

    def test_refuses_while_muxy_beta_is_running(self):
        result, calls = self.run_apply(running="123 /Applications/Muxy Beta.app/Contents/MacOS/muxy-app\n")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Muxy", result.stderr)
        self.assertEqual(calls, "")

    def test_refuses_while_stable_muxy_is_running(self):
        result, calls = self.run_apply(running="456 /Applications/Muxy.app/Contents/MacOS/muxy-app\n")
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(calls, "")

    def test_applies_muxy_files_with_opt_in_when_closed(self):
        result, calls = self.run_apply()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("CHEZMOI_MUXY=1 apply", calls)
        self.assertIn("Library/Application Support/Muxy Beta", calls)
        self.assertIn("Library/Application Support/Muxy 2", calls)

    def test_backs_up_settings_before_apply(self):
        self.live("Muxy Beta", "settings.toml", "old")
        self.live("Muxy Beta", "terminal.toml", "old")
        result, _ = self.run_apply()
        self.assertEqual(result.returncode, 0, result.stderr)
        backups = [p.name for p in (self.support / "Muxy Beta").iterdir() if ".bak-" in p.name]
        self.assertTrue(any(n.startswith("settings.toml.bak-") for n in backups), backups)
        self.assertTrue(any(n.startswith("terminal.toml.bak-") for n in backups), backups)

    def test_diff_mode_runs_even_while_running_and_does_not_apply(self):
        result, calls = self.run_apply("--diff", running="123 /Applications/Muxy Beta.app/Contents/MacOS/muxy-app\n")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("CHEZMOI_MUXY=1 diff", calls)
        self.assertNotIn(" apply", calls)

    def test_source_host_does_not_apply_and_points_to_snapshot(self):
        result, calls = self.run_apply(host=SOURCE_HOST)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("--snapshot", result.stderr)
        self.assertNotIn("apply", calls)

    def test_check_passes_when_live_matches_snapshot_except_state(self):
        self.live("Muxy Beta", "settings.toml", SNAPSHOT.replace('["a"]', '["b", "c"]'))
        result, _ = self.run_apply("--check", host=SOURCE_HOST)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_check_reports_drift_when_live_setting_changed(self):
        self.live("Muxy Beta", "settings.toml", SNAPSHOT.replace('"cmd-w"', '"cmd-shift-w"'))
        result, _ = self.run_apply("--check", host=SOURCE_HOST)
        self.assertEqual(result.returncode, 1)
        self.assertIn("keymap.close_pane", result.stdout)

    def test_check_reports_key_missing_from_snapshot(self):
        self.live("Muxy Beta", "settings.toml", SNAPSHOT + '\n[panes]\nfocus_follows_mouse = true\n')
        result, _ = self.run_apply("--check", host=SOURCE_HOST)
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("panes", result.stdout)

    def use_python_without_tomllib(self, with_uv):
        """python3 が 3.9（tomllib なし）の機械を真似る。with_uv なら uv 経由で本物の python を使える。"""
        self.write_tool("python3", 'case "$*" in *tomllib*) exit 1;; esac\n'
                                   'echo "ModuleNotFoundError: No module named tomllib" >&2; exit 1\n')
        if with_uv:
            self.write_tool("uv", f'while [ "$1" != python ]; do shift; done; shift\nexec "{sys.executable}" "$@"\n')

    def test_check_uses_uv_when_python3_lacks_tomllib(self):
        self.use_python_without_tomllib(with_uv=True)
        self.live("Muxy Beta", "settings.toml", SNAPSHOT.replace('"cmd-w"', '"cmd-shift-w"'))
        result, _ = self.run_apply("--check", host=SOURCE_HOST)
        self.assertEqual(result.returncode, 1)
        self.assertIn("keymap.close_pane", result.stdout)

    def test_check_fails_when_no_python_with_tomllib(self):
        self.use_python_without_tomllib(with_uv=False)
        self.live("Muxy Beta", "settings.toml", SNAPSHOT)
        result, _ = self.run_apply("--check", host=SOURCE_HOST)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("tomllib", result.stderr)

    def test_snapshot_copies_live_files_into_source(self):
        changed = SNAPSHOT.replace('"cmd-w"', '"cmd-shift-w"')
        self.live("Muxy Beta", "settings.toml", changed)
        self.live("Muxy Beta", "ghostty.conf", "font-size = 15\n")
        result, _ = self.run_apply("--snapshot", host=SOURCE_HOST)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual((self.src / ".chezmoitemplates/muxy/beta-settings.toml").read_text(), changed)
        ghostty = self.src / "private_Library/private_Application Support/private_Muxy Beta/private_ghostty.conf"
        self.assertEqual(ghostty.read_text(), "font-size = 15\n")


if __name__ == "__main__":
    unittest.main()
