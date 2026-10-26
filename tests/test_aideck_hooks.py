"""aideck の Claude hooks 登録が dot_claude/settings.json に入っていることを検査する（#33）。

- 1: 12 事象それぞれに __aideck の グループがちょうど1つあり、`aideck hooks print --json` の同じ事象と完全一致する。
- 2: __aideck 以外のグループは基準コミットの settings.json と事象ごとに同じ順序・内容で残り、hooks 以外のキーも同一。
- 3: 適用後の settings.json に aideck の syncClaudeSettings を当てると、変更なし（state ok、changed false、バイト不変）になる。

AIDECK_REPO で aideck の worktree を指定する。無ければ既定パスを見て、それも無ければ 1 と 3 は skip する。
"""
import json
import os
import pathlib
import shutil
import subprocess
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
SETTINGS = ROOT / "dot_claude" / "settings.json"
BASE = "72f81550b97a646f0f8e3c3b3e9c8cb62d1a7f0e"
AIDECK = pathlib.Path(os.environ.get(
    "AIDECK_REPO",
    "/Users/papillon/.config/superpowers/worktrees/ccdeck-profiles/feat-10-dotfiles-hooks",
))
MARK = "__aideck"

# syncClaudeSettings(path, {command}) を node から呼ぶ小さなスクリプト。テストの一時 dir に書いて実行し、終わったら消える。
SYNC_JS = """\
import { pathToFileURL } from "node:url";
const [moduleFile, settingsFile, command] = process.argv.slice(2);
const mod = await import(pathToFileURL(moduleFile).href);
const out = await mod.syncClaudeSettings(settingsFile, { command });
process.stdout.write(JSON.stringify(out) + "\\n");
"""


def load(path):
    return json.loads(pathlib.Path(path).read_text(encoding="utf-8"))


def is_aideck(group):
    return isinstance(group, dict) and group.get(MARK) is True


def hooks_print():
    """`aideck hooks print --json` の出力。AIDECK の worktree で node を実行する（読み取りのみ）。"""
    proc = subprocess.run(
        ["node", "bin/agent-dag.js", "hooks", "print", "--json"],
        cwd=AIDECK, capture_output=True, text=True, timeout=120,
    )
    if proc.returncode != 0:
        raise AssertionError(f"hooks print が失敗: exit={proc.returncode}\n{proc.stderr}")
    return json.loads(proc.stdout)["hooks"]


def base_settings():
    proc = subprocess.run(
        ["git", "show", f"{BASE}:dot_claude/settings.json"],
        cwd=ROOT, capture_output=True, text=True, check=True,
    )
    return json.loads(proc.stdout)


def aideck_available():
    return (AIDECK / "bin" / "agent-dag.js").is_file() and (AIDECK / "src" / "server" / "hook-targets.mjs").is_file()


class AideckHookRegistration(unittest.TestCase):
    def test_each_event_has_one_aideck_group_equal_to_hooks_print(self):
        if not aideck_available():
            self.skipTest(f"aideck の worktree が無い: {AIDECK}（AIDECK_REPO で指定する）")
        printed = hooks_print()
        self.assertEqual(len(printed), 12, f"hooks print の事象数: {sorted(printed)}")
        current = load(SETTINGS).get("hooks", {})
        for event, groups in printed.items():
            with self.subTest(event=event):
                self.assertEqual(len(groups), 1, "hooks print は事象ごとに1グループのはず")
                ours = [g for g in current.get(event, []) if is_aideck(g)]
                self.assertEqual(len(ours), 1, f"{event} の __aideck グループ数（期待 1）")
                self.assertEqual(ours[0], groups[0])

    def test_non_aideck_groups_and_top_level_keys_match_base(self):
        base = base_settings()
        current = load(SETTINGS)
        self.assertEqual(
            {k: v for k, v in current.items() if k != "hooks"},
            {k: v for k, v in base.items() if k != "hooks"},
            "hooks 以外のトップレベルのキーが基準と違う",
        )
        base_hooks = base.get("hooks", {})
        current_hooks = current.get("hooks", {})
        events = sorted(set(base_hooks) | set(current_hooks))
        for event in events:
            with self.subTest(event=event):
                kept = [g for g in current_hooks.get(event, []) if not is_aideck(g)]
                self.assertEqual(kept, base_hooks.get(event, []))


class AideckHookReproduction(unittest.TestCase):
    def apply_settings(self, dest):
        """dot_claude/settings.json を dest/.claude/settings.json へ出す。

        chezmoi を一時 dir だけに向けて使う（空の config と state も一時 dir）。実機の HOME・
        ~/.config/chezmoi・chezmoi の state は読まず書かない。chezmoi が無い／失敗したときは、
        同じ内容を copy する（chezmoi はテンプレートを使わない単純なコピーなので、バイトは同じ）。
        """
        target = dest / ".claude" / "settings.json"
        target.parent.mkdir(parents=True)
        chezmoi = shutil.which("chezmoi")
        if chezmoi:
            config = dest / "chezmoi.toml"
            config.write_text("", encoding="utf-8")
            proc = subprocess.run(
                [chezmoi, "--source", str(ROOT), "--config", str(config),
                 "--persistent-state", str(dest / "chezmoistate.boltdb"),
                 "--destination", str(dest), "--no-tty", "apply", str(target)],
                capture_output=True, text=True, timeout=120,
            )
            if proc.returncode == 0 and target.is_file():
                return "chezmoi"
        shutil.copyfile(SETTINGS, target)
        return "copy"

    def sync(self, workdir, settings_file, command):
        script = workdir / "sync_claude_settings.mjs"
        script.write_text(SYNC_JS, encoding="utf-8")
        proc = subprocess.run(
            ["node", str(script), str(AIDECK / "src" / "server" / "hook-targets.mjs"),
             str(settings_file), command],
            capture_output=True, text=True, timeout=120,
        )
        if proc.returncode != 0:
            raise AssertionError(f"syncClaudeSettings の実行に失敗: exit={proc.returncode}\n{proc.stderr}")
        return json.loads(proc.stdout)

    @unittest.skipUnless(aideck_available(), "aideck の worktree が無い（AIDECK_REPO で指定する）")
    def test_applied_settings_are_a_noop_for_aideck_sync(self):
        command = hooks_print()["SessionStart"][0]["hooks"][0]["command"]
        with tempfile.TemporaryDirectory(prefix="aideck-hooks-") as tmp:
            dest = pathlib.Path(tmp)
            self.apply_settings(dest)
            target = dest / ".claude" / "settings.json"
            self.assertEqual(target.read_bytes(), SETTINGS.read_bytes(), "適用後の内容が dot_claude/settings.json と違う")
            before = target.read_bytes()
            result = self.sync(dest, target, command)
            self.assertEqual(result, {"state": "ok", "changed": False})
            self.assertEqual(target.read_bytes(), before, "syncClaudeSettings がファイルを書き換えた")


if __name__ == "__main__":
    unittest.main()
