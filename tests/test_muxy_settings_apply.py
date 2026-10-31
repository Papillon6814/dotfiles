"""dot_local/bin/executable_muxy-settings-apply の試験。

Muxy の設定は、Muxy が起動中だと書き戻されて消えるため、終了しているときだけ当てる。
pgrep と chezmoi を偽物に差し替えて、止まる条件と chezmoi への渡し方を確かめる。
"""
import os
import subprocess
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent.parent / "dot_local" / "bin" / "executable_muxy-settings-apply"


class MuxySettingsApply(unittest.TestCase):
    def run_apply(self, running_apps, *args):
        with tempfile.TemporaryDirectory() as d:
            bin_dir = Path(d, "bin")
            bin_dir.mkdir()
            log = Path(d, "chezmoi.log")
            # pgrep -fl の偽物: 起動中のアプリとして渡された行を返す
            pgrep = bin_dir / "pgrep"
            pgrep.write_text(
                "#!/bin/sh\n"
                f"printf '%s' '{running_apps}' | grep -E \"$2\" && exit 0\n"
                "exit 1\n"
            )
            # chezmoi の偽物: 環境変数と引数を記録する
            chezmoi = bin_dir / "chezmoi"
            chezmoi.write_text(
                "#!/bin/sh\n"
                f"echo \"CHEZMOI_MUXY=$CHEZMOI_MUXY $*\" >> '{log}'\n"
            )
            for f in (pgrep, chezmoi):
                f.chmod(0o755)
            env = dict(os.environ, PATH=f"{bin_dir}:/usr/bin:/bin", HOME=d)
            result = subprocess.run(
                ["/bin/sh", str(SCRIPT), *args], capture_output=True, text=True, env=env
            )
            calls = log.read_text() if log.exists() else ""
            return result, calls

    def test_refuses_while_muxy_beta_is_running(self):
        result, calls = self.run_apply(
            "123 /Applications/Muxy Beta.app/Contents/MacOS/muxy-app\n"
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Muxy", result.stderr)
        self.assertEqual(calls, "")

    def test_refuses_while_stable_muxy_is_running(self):
        result, calls = self.run_apply(
            "456 /Applications/Muxy.app/Contents/MacOS/muxy-app\n"
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(calls, "")

    def test_applies_muxy_files_with_opt_in_when_closed(self):
        result, calls = self.run_apply("")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("CHEZMOI_MUXY=1 apply", calls)
        self.assertIn("Library/Application Support/Muxy Beta", calls)
        self.assertIn("Library/Application Support/Muxy 2", calls)

    def test_diff_mode_runs_even_while_running_and_does_not_apply(self):
        result, calls = self.run_apply(
            "123 /Applications/Muxy Beta.app/Contents/MacOS/muxy-app\n", "--diff"
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("CHEZMOI_MUXY=1 diff", calls)
        self.assertNotIn(" apply", calls)


if __name__ == "__main__":
    unittest.main()
