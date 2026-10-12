"""Account wrappers must export a shared Scaffold root, not share account state.

Runs the real wrappers/account script; only external launchers and patch helpers
are fakes. Missing export, overriding an explicitly empty value, dropping argv,
or sharing auth/sessions are observable contract violations.
"""
import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parent
ARTIFACTS = ROOT.parents[1] / ".task-artifacts"
ACCOUNTS = (("kuno", "agent"), ("muu", "agent-muu"), ("rbx", "agent-rbx"))
ARGS = ["--offline", "argument with spaces", "", "--session", "session with spaces.json"]


class ScaffoldDirLauncherTests(unittest.TestCase):
    def exercise(self, launcher):
        ARTIFACTS.mkdir(exist_ok=True)
        for account, folder in ACCOUNTS:
            for setting in ("unset", "explicit", "empty"):
                with (
                    self.subTest(account=account, setting=setting, launcher=launcher),
                    tempfile.TemporaryDirectory(prefix="scaffold-launch-", dir=ARTIFACTS) as directory,
                ):
                    home = Path(directory) / "synthetic home"
                    binary = home / "bin"
                    binary.mkdir(parents=True)
                    tmp = home / "tmp"
                    tmp.mkdir()
                    for name in ("pi-account",):
                        script = binary / name
                        shutil.copyfile(ROOT / f"executable_{name}", script)
                        script.chmod(0o755)
                    for name in ("pi-extension-deps-patch", "pi-hermes-realpath-patch"):
                        script = binary / name
                        script.write_text(
                            f'#!/bin/sh\nprintf "%s\\n" "{name}" >> "$HOME/helper-calls"\n'
                        )
                        script.chmod(0o755)
                    # These fakes observe the real launch_pi boundary, without
                    # loading profiles, credentials, sessions, or host packages.
                    observer = (
                        '#!/usr/bin/env python3\n'
                        'import json, os, sys\n'
                        'from pathlib import Path\n'
                        'raw = os.environ.get("PI_CODING_AGENT_DIR")\n'
                        'agent = Path(raw or str(Path.home() / ".pi/agent"))\n'
                        'print(json.dumps({"launcher": Path(sys.argv[0]).name, '
                        '"argv": sys.argv[1:], "agent": str(agent), "raw_agent": raw, '
                        '"scaffold": os.environ.get("PI_SCAFFOLD_DIR"), '
                        '"auth": (agent / "auth.json").read_text(), '
                        '"session": (agent / "sessions/synthetic.json").read_text()}))\n'
                    )
                    for name in ("pi", "pi-profile"):
                        script = binary / name
                        script.write_text(observer)
                        script.chmod(0o755)
                    originals = {}
                    for name, agent_folder in ACCOUNTS:
                        agent = home / ".pi" / agent_folder
                        (agent / "sessions").mkdir(parents=True)
                        for relative, content in (
                            ("auth.json", f"synthetic-auth-{name}\n"),
                            ("sessions/synthetic.json", f"synthetic-session-{name}\n"),
                        ):
                            path = agent / relative
                            path.write_text(content)
                            originals[path] = path.read_bytes()
                    master = home / ".pi/agent"
                    (master / "settings.json").write_text("{}\n")
                    (master / "pi-scaffold").mkdir()
                    env = dict(os.environ)
                    for key in (
                        "PI_SCAFFOLD_DIR", "PI_SUBAGENT_CHILD", "PI_SESSION_ID",
                        "PI_SESSION_FILE", "PI_PROFILE_LAUNCH_CONTEXT",
                        "PI_CODING_AGENT_DIR", "PI_CODING_AGENT_SESSION_DIR",
                        "PI_PROFILE_LAUNCHER",
                    ):
                        env.pop(key, None)
                    env.update(HOME=str(home), PATH=f"{binary}:{os.environ['PATH']}",
                               TMPDIR=str(tmp), TMP=str(tmp), TEMP=str(tmp))
                    if launcher == "legacy":
                        env["PI_PROFILE_LAUNCHER"] = "0"
                    expected_scaffold = str(master / "pi-scaffold")
                    if setting == "explicit":
                        expected_scaffold = str(home / "explicit scaffold root")
                        env["PI_SCAFFOLD_DIR"] = expected_scaffold
                    elif setting == "empty":
                        expected_scaffold = ""
                        env["PI_SCAFFOLD_DIR"] = ""
                    result = subprocess.run(
                        ["sh", str(ROOT / f"executable_pi-{account}"), *ARGS],
                        env=env, capture_output=True, text=True, timeout=30,
                    )
                    self.assertEqual(result.returncode, 0, result.stderr)
                    self.assertEqual(result.stderr, "")
                    observed = json.loads(result.stdout)
                    self.assertEqual(observed["launcher"], "pi" if launcher == "legacy" else "pi-profile")
                    self.assertEqual(observed["argv"], ARGS if launcher == "legacy" else ["launch", "--", *ARGS])
                    agent = home / ".pi" / folder
                    self.assertEqual(observed["agent"], str(agent))
                    self.assertEqual(observed["raw_agent"], None if account == "kuno" else str(agent))
                    self.assertEqual(observed["auth"], f"synthetic-auth-{account}\n")
                    self.assertEqual(observed["session"], f"synthetic-session-{account}\n")
                    for path, content in originals.items():
                        self.assertEqual(path.read_bytes(), content)
                        self.assertFalse(path.is_symlink())
                        self.assertFalse(path.parent.is_symlink())
                    helpers = (home / "helper-calls").read_text().splitlines()
                    self.assertEqual(helpers, ["pi-extension-deps-patch"] if account == "kuno" else
                                     ["pi-extension-deps-patch", "pi-hermes-realpath-patch"])
                    if account != "kuno":
                        self.assertTrue((agent / "settings.json").is_symlink())
                        self.assertEqual((agent / "settings.json").resolve(), master / "settings.json")
                        self.assertTrue((agent / "pi-scaffold").is_symlink())
                        self.assertEqual((agent / "pi-scaffold").resolve(), master / "pi-scaffold")
                    self.assertEqual(observed["scaffold"], expected_scaffold,
                                     "PI_SCAFFOLD_DIR must default only when unset")

    def test_default_profile_launcher_preserves_scaffold_and_account_contract(self):
        self.exercise("default")

    def test_legacy_launcher_preserves_scaffold_and_account_contract(self):
        self.exercise("legacy")


if __name__ == "__main__":
    unittest.main()
