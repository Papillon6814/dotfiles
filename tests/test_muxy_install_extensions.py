"""dot_config/muxy/executable_install-extensions.sh.tmpl の試験。

テンプレートを chezmoi で展開し、gh・git・npm を偽物に差し替えて実行する。
"""
import os
import subprocess
import tempfile
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
TEMPLATE = REPO / "dot_config" / "muxy" / "executable_install-extensions.sh.tmpl"
EXTENSIONS = ("muxy-herdr-agent-status", "muxy-tab-names")


def render():
    return subprocess.run(
        ["chezmoi", "--source", str(REPO), "execute-template", "--file", str(TEMPLATE)],
        capture_output=True, text=True, check=True,
    ).stdout


class MuxyInstallExtensions(unittest.TestCase):
    def run_install(self, existing=(), release=False):
        with tempfile.TemporaryDirectory() as home:
            bin_dir = Path(home, "fakebin")
            bin_dir.mkdir()
            log = Path(home, "calls.log")
            for name in ("gh", "git", "npm"):
                tool = bin_dir / name
                # gh repo clone は本物と同じく clone 先（4番目の引数）を作る
                make_dest = 'mkdir -p "$4"\n' if name == "gh" else ""
                tool.write_text(f"#!/bin/sh\necho \"{name} $* (in $PWD)\" >> '{log}'\n{make_dest}")
                tool.chmod(0o755)
            for name in existing:
                Path(home, "Code", name, ".git").mkdir(parents=True)
            if release:
                stable = render().split("releases/")[1].split()[0].strip("\"'")
                Path(home, ".local/share/muxy-herdr-agent-status/stable/releases", stable).mkdir(parents=True)
            script = Path(home, "install.sh")
            script.write_text(render())
            env = dict(os.environ, HOME=home, PATH=f"{bin_dir}:/usr/bin:/bin")
            result = subprocess.run(["/bin/sh", str(script)], capture_output=True, text=True, env=env, cwd=home)
            return result, (log.read_text() if log.exists() else ""), home

    def test_clones_missing_extensions_and_builds_both(self):
        result, calls, home = self.run_install()
        self.assertEqual(result.returncode, 0, result.stderr)
        for name in EXTENSIONS:
            self.assertIn(f"gh repo clone KendrickMalar/{name} {home}/Code/{name}", calls)
            self.assertIn(f"npm run build (in {home}/Code/{name})", calls)

    def test_pulls_existing_extensions_fast_forward_only(self):
        result, calls, home = self.run_install(existing=EXTENSIONS)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertNotIn("gh repo clone", calls)
        for name in EXTENSIONS:
            self.assertIn(f"git -C {home}/Code/{name} pull --ff-only", calls)

    def test_warns_how_to_copy_stable_release_when_missing(self):
        result, _, _ = self.run_install(existing=EXTENSIONS)
        self.assertIn("rsync", result.stdout + result.stderr)

    def test_no_stable_release_warning_when_present(self):
        result, _, _ = self.run_install(existing=EXTENSIONS, release=True)
        self.assertNotIn("rsync", result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
