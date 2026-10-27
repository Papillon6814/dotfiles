import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest


ROOT = Path(__file__).resolve().parent
LOCAL_STATE = ("mcp-cache.json", "mcp-npx-cache.json", "mcp-project-approvals.json")
PACKAGE_PATHS = (
    "npm/node_modules/pi-hermes-memory",
    "npm/node_modules/pi-hashline-edit-pro",
    "npm/node_modules/@schovest/pi-goal",
    "npm/node_modules/@georgedong32/pi-review",
    "pi-deep-research-exa",
)
HOST_DEPENDENCIES = (
    "@earendil-works/pi-tui", "typebox", "typebox",
    "@sinclair/typebox", "@sinclair/typebox",
)
PEER_DEPENDENCIES = (
    "@earendil-works/pi-tui", "typebox", "typebox",
    "typebox", "@sinclair/typebox",
)


class StartupWarningsTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.home = Path(self.temp.name)
        self.master = self.home / ".pi/agent"
        self.master.mkdir(parents=True)
        self.bin = self.home / "bin"
        self.bin.mkdir()
        self.env = dict(os.environ, HOME=str(self.home), PATH=f"{self.bin}:{os.environ['PATH']}")
        self.env.pop("PI_CODING_AGENT_DIR", None)
        for name in ("pi-hermes-realpath-patch", "pi-extension-deps-patch"):
            script = self.bin / name
            script.write_text(f'#!/bin/sh\nprintf "%s\\n" "{name}" >> "$HOME/calls"\n')
            script.chmod(0o755)
        pi = self.bin / "pi"
        pi.write_text('#!/usr/bin/env python3\nimport json, os, sys\nprint(json.dumps({"profile": os.environ.get("PI_CODING_AGENT_DIR"), "args": sys.argv[1:]}))\n')
        pi.chmod(0o755)
        (self.master / "settings.json").write_text('{}\n')
        (self.master / "auth.json").write_text("master-auth\n")
        for name in LOCAL_STATE:
            (self.master / name).write_text(f"master-{name}\n")

    def launch(self, profile, *args):
        return subprocess.run(["bash", str(ROOT / "executable_pi-account"), profile, *args],
                              env=self.env, capture_output=True, text=True, check=True)

    def test_existing_profile_state_is_preserved_without_warnings(self):
        for profile in ("rbx", "muu"):
            with self.subTest(profile=profile):
                target = self.home / f".pi/agent-{profile}"
                target.mkdir()
                (target / "auth.json").write_text(f"{profile}-auth\n")
                for name in LOCAL_STATE:
                    (target / name).write_text(f"{profile}-{name}\n")
                result = self.launch(profile, "--offline", "argument with spaces")
                self.assertEqual(result.stderr, "")
                self.assertEqual(json.loads(result.stdout),
                                 {"profile": str(target), "args": ["--offline", "argument with spaces"]})
                self.assertTrue((target / "settings.json").is_symlink())
                self.assertEqual((target / "auth.json").read_text(), f"{profile}-auth\n")
                self.assertFalse((target / "auth.json").is_symlink())
                for name in LOCAL_STATE:
                    self.assertFalse((target / name).is_symlink())
                    self.assertEqual((target / name).read_text(), f"{profile}-{name}\n")
                    self.assertEqual((self.master / name).read_text(), f"master-{name}\n")

    def test_missing_profile_state_is_not_borrowed_from_master(self):
        self.launch("rbx")
        target = self.home / ".pi/agent-rbx"
        for name in (*LOCAL_STATE, "auth.json"):
            self.assertFalse((target / name).exists())
            self.assertFalse((target / name).is_symlink())

    def test_patch_runs_for_all_profiles(self):
        for profile in ("kuno", "rbx", "muu"):
            self.launch(profile)
        self.assertEqual((self.home / "calls").read_text().splitlines().count("pi-extension-deps-patch"), 3)

    def test_unexpected_nonshared_settings_still_warns(self):
        target = self.home / ".pi/agent-rbx"
        target.mkdir()
        (target / "settings.json").write_text('{"private":true}\n')
        self.assertIn("settings.json が共有されていません", self.launch("rbx").stderr)

    def test_invalid_profile_does_not_run_patches(self):
        result = subprocess.run(["bash", str(ROOT / "executable_pi-account"), "invalid"],
                                env=self.env, capture_output=True, text=True)
        self.assertEqual(result.returncode, 2)
        self.assertFalse((self.home / "calls").exists())

    def test_dependency_patch_preserves_other_fields_and_is_idempotent(self):
        files = []
        for relative, dep in zip(PACKAGE_PATHS, HOST_DEPENDENCIES):
            path = self.master / relative / "package.json"
            path.parent.mkdir(parents=True)
            path.write_text(json.dumps({"name": relative.split("/")[-1], "version": "1.0.0",
                                        "dependencies": {dep: "^1", "ordinary-dependency": "^2"},
                                        "peerDependencies": {"existing-peer": "^3"}, "pi": {"extensions": ["index.ts"]}}))
            files.append((path, dep, path.read_bytes()))
        patch = ROOT / "executable_pi-extension-deps-patch"
        subprocess.run(["python3", str(patch)], env=self.env, check=True)
        snapshots = []
        for path, dep, original in files:
            result = json.loads(path.read_text())
            self.assertNotIn(dep, result["dependencies"])
            peer = PEER_DEPENDENCIES[PACKAGE_PATHS.index(str(path.parent.relative_to(self.master)))]
            self.assertEqual(result["peerDependencies"], {"existing-peer": "^3", peer: "*"})
            self.assertEqual(result["dependencies"], {"ordinary-dependency": "^2"})
            self.assertEqual(result["pi"], {"extensions": ["index.ts"]})
            snapshots.append((path.read_bytes(), path.stat().st_mtime_ns))
            self.assertTrue(any(p.read_bytes() == original for p in (self.home / ".pi/backups").rglob("*.json")))
        subprocess.run(["python3", str(patch)], env=self.env, check=True)
        self.assertEqual(snapshots, [(p.read_bytes(), p.stat().st_mtime_ns) for p, _, _ in files])
        path, dep, original = files[0]
        path.write_bytes(original)
        subprocess.run(["python3", str(patch)], env=self.env, check=True)
        self.assertNotIn(dep, json.loads(path.read_text())["dependencies"])


if __name__ == "__main__":
    unittest.main()
