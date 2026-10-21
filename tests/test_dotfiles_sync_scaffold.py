"""scripts/dotfiles-sync.sh の scaffold-profiles の点検（2.5）を、仮のホームで本物のスクリプトを動かして確かめる。

dry-run で動かし、ログの「通知:」行と「[dry-run] git ... pull」行を見る。保管庫・scaffold-profiles・claude-scaffold は
仮のものを作る。生成器と install-config は、合否をファイルで切り替えられる小さな代役にする。
"""
import os, pathlib, shutil, subprocess, tempfile, unittest

REPO = pathlib.Path(__file__).resolve().parents[1]
PROFILES = ("development", "roblox-game")
GIT_ENV = {"GIT_AUTHOR_NAME": "t", "GIT_AUTHOR_EMAIL": "t@example.com", "GIT_COMMITTER_NAME": "t", "GIT_COMMITTER_EMAIL": "t@example.com"}


def git(cwd, *args):
    subprocess.run(["git", "-C", str(cwd), *args], check=True, capture_output=True, env={**os.environ, **GIT_ENV})


class SyncScaffoldChecks(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="sync-scaffold-")
        root = pathlib.Path(os.path.realpath(self.tmp.name))
        self.home = root / "home"
        self.home.mkdir()
        # 保管庫: scripts/ だけを写した main の git リポジトリ
        self.repo = root / "dotfiles"
        shutil.copytree(REPO / "scripts", self.repo / "scripts")
        git(root, "init", "-q", "-b", "main", str(self.repo))
        git(self.repo, "add", "-A")
        git(self.repo, "commit", "-q", "-m", "init")
        # scaffold-profiles: 生成器と install-config の代役。FAIL_CHECK / FAIL_CONFIG があれば失敗する
        self.sp = root / "scaffold-profiles"
        (self.sp / "bin").mkdir(parents=True)
        (self.sp / "bin/generate.ts").write_text(
            "const fs = require('node:fs');\n"
            "if (fs.existsSync('FAIL_CHECK')) { console.error('dist/ が一致しません:\\n  M pi/development/instructions.md'); process.exit(1); }\n"
            "console.log('ok');\n")
        (self.sp / "bin/install-config.sh").write_text(
            "#!/bin/bash\ncd \"$(dirname \"$0\")/..\"\n"
            "if [ -f FAIL_CONFIG ]; then echo '  M /x/pi-gh-permissions.json: 生成物と違います'; exit 1; fi\necho ok\n")
        (self.sp / "bin/install-config.sh").chmod(0o755)
        for prof in PROFILES:
            for d in (f"dist/pi/{prof}", f"dist/claude/{prof}/skills", f"dist/claude/{prof}/agents", f"dist/claude/{prof}/templates"):
                (self.sp / d).mkdir(parents=True, exist_ok=True)
            (self.sp / f"dist/claude/{prof}/instructions.md").write_text("x")
        (self.sp / ".gitignore").write_text("FAIL_CHECK\nFAIL_CONFIG\n")
        git(root, "init", "-q", "-b", "main", str(self.sp))
        git(self.sp, "add", "-A")
        git(self.sp, "commit", "-q", "-m", "init")
        # 正しいリンク
        (self.home / ".pi/agent/profiles").mkdir(parents=True)
        self.cs = root / "claude-scaffold"
        for prof in PROFILES:
            (self.home / f".pi/agent/profiles/{prof}").symlink_to(self.sp / f"dist/pi/{prof}")
            (self.cs / f"profile/{prof}").mkdir(parents=True)
            for name in ("instructions.md", "skills", "agents", "templates"):
                (self.cs / f"profile/{prof}" / name).symlink_to(self.sp / f"dist/claude/{prof}/{name}")

    def tearDown(self):
        self.tmp.cleanup()

    def run_sync(self):
        env = {**os.environ, **GIT_ENV, "HOME": str(self.home), "XDG_STATE_HOME": str(self.home / ".state"),
               "DOTFILES_SYNC_DRY_RUN": "1", "DOTFILES_SYNC_QUIET_SECS": "0",
               "SCAFFOLD_PROFILES_DIR": str(self.sp), "CLAUDE_SCAFFOLD_DIR": str(self.cs)}
        r = subprocess.run(["bash", str(self.repo / "scripts/dotfiles-sync.sh")], env=env, capture_output=True, text=True, timeout=120)
        return r.stdout + r.stderr

    def notices(self, out):
        return [l for l in out.splitlines() if "通知: scaffold-profiles" in l]

    def test_all_good_pulls_and_stays_quiet(self):
        out = self.run_sync()
        self.assertEqual(self.notices(out), [], out)
        self.assertIn(f"[dry-run] git -C {self.sp} pull -q --ff-only", out)

    def test_generated_files_differ(self):
        (self.sp / "FAIL_CHECK").write_text("")
        n = self.notices(self.run_sync())
        self.assertTrue(any("生成物が原本と違います" in l and "M pi/development/instructions.md" in l for l in n), n)

    def test_installed_config_is_stale(self):
        (self.sp / "FAIL_CONFIG").write_text("")
        n = self.notices(self.run_sync())
        self.assertTrue(any("設定ファイルが古いか壊れています" in l for l in n), n)

    def test_pi_link_replaced_by_real_directory(self):
        link = self.home / ".pi/agent/profiles/development"
        link.unlink()
        link.mkdir()
        n = self.notices(self.run_sync())
        self.assertTrue(any("リンクが外れています" in l and "development がリンクではありません" in l for l in n), n)

    def test_claude_links_replaced_or_pointing_elsewhere(self):
        (self.cs / "profile/development/instructions.md").unlink()
        (self.cs / "profile/development/instructions.md").write_text("real")
        (self.cs / "profile/development/agents").unlink()
        (self.cs / "profile/development/agents").symlink_to(self.home)
        n = self.notices(self.run_sync())
        self.assertTrue(any("instructions.md がリンクではありません" in l and "agents の指す先が違います" in l for l in n), n)

    def test_roblox_game_links_are_checked_too(self):
        link = self.home / ".pi/agent/profiles/roblox-game"
        link.unlink()
        link.symlink_to(self.sp / "dist/pi/development")
        (self.cs / "profile/roblox-game/templates").unlink()
        (self.cs / "profile/roblox-game/templates").symlink_to(self.sp / "dist/claude/development/templates")
        n = self.notices(self.run_sync())
        self.assertTrue(any("roblox-game の指す先が違います" in l and "roblox-game/templates の指す先が違います" in l for l in n), n)

    def test_profile_not_linked_yet_is_quiet(self):
        # まだ chezmoi apply・link-profiles をしていない Profile は点検しない（無いリンクは問題にしない）
        (self.home / ".pi/agent/profiles/roblox-game").unlink()
        for name in ("instructions.md", "skills", "agents", "templates"):
            (self.cs / "profile/roblox-game" / name).unlink()
        self.assertEqual(self.notices(self.run_sync()), [])

    def test_local_change_blocks_pull_but_untracked_does_not(self):
        (self.sp / ".codemogger").mkdir()
        self.assertIn("pull -q --ff-only", self.run_sync())
        (self.sp / "dist/claude/development/instructions.md").write_text("edited")
        self.assertNotIn("pull -q --ff-only", self.run_sync())

    def test_skipped_when_scaffold_profiles_absent(self):
        shutil.rmtree(self.sp)
        out = self.run_sync()
        self.assertEqual(self.notices(out), [], out)
        self.assertNotIn("pull -q --ff-only", out)


if __name__ == "__main__":
    unittest.main()
