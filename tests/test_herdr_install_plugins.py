"""dot_config/herdr/executable_install-plugins.sh の試験（herdr-agent-quota の入れ方）。

herdr・git・gh・cargo を偽物に差し替え、修正版（pi-own-auth）をコミット固定で取ってきて
ビルドし、~/Code/herdr-agent-quota を herdr にリンクすることを確かめる。
"""
import os
import subprocess
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent.parent / "dot_config" / "herdr" / "executable_install-plugins.sh"
QUOTA_COMMIT = "3c65904d301f5c17a8146c7c7b81b35a795654bb"


class HerdrInstallPlugins(unittest.TestCase):
    def run_install(self, quota_cloned):
        with tempfile.TemporaryDirectory() as home:
            bin_dir = Path(home, "fakebin")
            bin_dir.mkdir()
            log = Path(home, "calls.log")
            extra = {
                "gh": 'mkdir -p "$4/.git"\n',
                # cargo build は本物と同じく実行ファイルを作る
                "cargo": 'mkdir -p target/release && touch target/release/herdr-agent-quota && chmod +x target/release/herdr-agent-quota\n',
            }
            for name in ("herdr", "git", "gh", "cargo"):
                tool = bin_dir / name
                tool.write_text(f"#!/bin/sh\necho \"{name} $* (in $PWD)\" >> '{log}'\n{extra.get(name, '')}")
                tool.chmod(0o755)
            if quota_cloned:
                Path(home, "Code", "herdr-agent-quota", ".git").mkdir(parents=True)
            env = dict(os.environ, HOME=home, PATH=f"{bin_dir}:/usr/bin:/bin")
            result = subprocess.run(["/bin/sh", str(SCRIPT)], capture_output=True, text=True, env=env, cwd=home)
            return result, (log.read_text() if log.exists() else ""), home

    def test_clones_private_quota_repo_when_missing(self):
        result, calls, home = self.run_install(quota_cloned=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn(f"gh repo clone KendrickMalar/herdr-agent-quota-private {home}/Code/herdr-agent-quota", calls)

    def test_checks_out_pinned_fix_commit_builds_and_links(self):
        result, calls, home = self.run_install(quota_cloned=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        repo = f"{home}/Code/herdr-agent-quota"
        self.assertIn(f"git -C {repo} fetch origin fix/pi-own-auth-quota", calls)
        self.assertIn(f"git -C {repo} checkout --detach {QUOTA_COMMIT}", calls)
        self.assertIn(f"cargo build --release (in {repo})", calls)
        self.assertIn(f"herdr plugin link {repo} --enabled", calls)
        self.assertNotIn("herdr-agent-quota-multi-account", calls)

    def test_other_plugins_stay_pinned(self):
        _, calls, _ = self.run_install(quota_cloned=True)
        self.assertIn("herdr plugin install -y --ref 99002e24525a9ae327450cd83a17b1e86b2ee81f plannotator/herdr-annotate", calls)
        self.assertEqual(calls.count("herdr plugin install -y --ref"), 6)


if __name__ == "__main__":
    unittest.main()
