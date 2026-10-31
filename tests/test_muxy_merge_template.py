"""Muxy の settings.toml 用 modify テンプレート（.chezmoitemplates/muxy-merge）の試験。

実際の modify ファイルを chezmoi で展開し、mini の現物に当てたときに
機械ごとの設定（プロジェクト別の設定、最近使った一覧）が残り、
MBP の値（keymap など）が当たることを確かめる。
"""
import subprocess
import tempfile
import tomllib
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SUPPORT = REPO / "private_Library" / "private_Application Support"
STABLE = SUPPORT / "private_Muxy 2" / "modify_private_settings.toml"
BETA = SUPPORT / "private_Muxy Beta" / "modify_private_settings.toml"

MINI_NOW = """
[appearance]
project_recent = ["mini-project"]
light_theme = "Muxy"

[keymap]
close_tab = "cmd-w"
only_on_mini = "cmd-k"

[ai.project_pr_prompts.abc]
create_pr = "mini のプロジェクト別の文面"

[worktrees.projects.abc]
parent_path = "/Users/macmini/wt"
"""


def minimal_source(tmp):
    """chezmoi の source を、テンプレートの展開に要るものだけで作る（work/ などの状態に左右されないため）。"""
    import shutil
    for name in (".chezmoitemplates", ".chezmoidata"):
        shutil.copytree(REPO / name, Path(tmp) / name)
    return Path(tmp)


def apply(modify_file, current):
    with tempfile.TemporaryDirectory() as tmp:
        out = subprocess.run(
            ["chezmoi", "--source", str(minimal_source(tmp)), "execute-template", "--with-stdin", modify_file.read_text()],
            input=current, capture_output=True, text=True, check=True,
        ).stdout
    return tomllib.loads(out)


class MuxyMergeTemplate(unittest.TestCase):
    def test_stable_keeps_per_project_settings_of_the_machine(self):
        out = apply(STABLE, MINI_NOW)
        self.assertEqual(out["worktrees"]["projects"]["abc"]["parent_path"], "/Users/macmini/wt")
        self.assertEqual(out["ai"]["project_pr_prompts"]["abc"]["create_pr"], "mini のプロジェクト別の文面")

    def test_beta_keeps_per_project_settings_of_the_machine(self):
        out = apply(BETA, MINI_NOW)
        self.assertEqual(out["worktrees"]["projects"]["abc"]["parent_path"], "/Users/macmini/wt")
        self.assertEqual(out["ai"]["project_pr_prompts"]["abc"]["create_pr"], "mini のプロジェクト別の文面")

    def test_keymap_is_replaced_whole_by_mbp_values(self):
        out = apply(BETA, MINI_NOW)
        self.assertEqual(out["keymap"]["close_tab"], "cmd-shift-w")
        self.assertNotIn("only_on_mini", out["keymap"])

    def test_recent_projects_stay_and_theme_follows_mbp(self):
        out = apply(BETA, MINI_NOW)
        self.assertEqual(out["appearance"]["project_recent"], ["mini-project"])
        self.assertEqual(out["appearance"]["light_theme"], "Muxy Light")


if __name__ == "__main__":
    unittest.main()
