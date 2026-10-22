"""Account routing must select the matching secret without touching real Chrome."""
import importlib.machinery
import importlib.util
import json
import os
from pathlib import Path
import stat
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "dot_local/bin/executable_pi-browser-mcp"


class BrowserMcp(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="pi-browser-test-")
        self.addCleanup(self.tmp.cleanup)
        self.home = Path(self.tmp.name)
        self.base = self.home / ".config/pi-browser"
        self.tokens = self.base / "tokens"
        self.tokens.mkdir(parents=True, mode=0o700)
        self.base.chmod(0o700)
        self.capture = self.home / "capture.json"
        self.bin = self.home / "bin"
        self.bin.mkdir()
        fake = self.bin / "npx"
        fake.write_text(
            f"#!{sys.executable}\n"
            "import os, sys, json\n"
            "from pathlib import Path\n"
            "p=Path(os.environ['CAPTURE'])\n"
            "assert not p.exists(), 'multiple launches'\n"
            "p.write_text(json.dumps({'argv':sys.argv[1:], 'env':{k:v for k,v in os.environ.items() if k.startswith('PLAYWRIGHT_MCP_')}}))\n"
            "print('MCP-STDOUT')\n"
            "print('MCP-STDERR',file=sys.stderr)\n"
        )
        fake.chmod(0o755)
        self.env = {
            "HOME": str(self.home), "PATH": f"{self.bin}:/usr/bin:/bin",
            "CAPTURE": str(self.capture), "PI_BROWSER_ACCOUNT": "muu",
            "PYTHONDONTWRITEBYTECODE": "1",
        }
        for account in ("muu", "kuno", "rbx"):
            self.secret(account).write_text(f"fake-{account}-secret")
            self.secret(account).chmod(0o600)

    def secret(self, account="muu"):
        return self.tokens / account

    def run_helper(self, *args):
        self.assertTrue(SCRIPT.exists(), "browser MCP helper is not implemented")
        return subprocess.run([sys.executable, str(SCRIPT), *args], env=self.env,
                              capture_output=True, text=True, timeout=5)

    def assert_rejected(self, result):
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(result.stdout, "")
        self.assertFalse(self.capture.exists(), "must reject before spawning npx")
        for account in ("muu", "kuno", "rbx"):
            self.assertNotIn(f"fake-{account}-secret", result.stdout + result.stderr)

    def test_account_mapping(self):
        for account, profile in (("muu", "Profile 11"), ("kuno", "Default"), ("rbx", "Profile 6")):
            with self.subTest(account=account):
                self.env["PI_BROWSER_ACCOUNT"] = account
                result = self.run_helper()
                self.assertEqual(result.returncode, 0, result.stderr)
                got = json.loads(self.capture.read_text())
                self.assertEqual(got["argv"], ["-y", "@playwright/mcp@0.0.83", "--extension", "--profile-dir-name", profile])
                self.assertEqual(got["env"]["PLAYWRIGHT_MCP_EXTENSION_TOKEN"], f"fake-{account}-secret")
                self.assertNotIn(f"fake-{account}-secret", result.stdout + result.stderr)
                self.capture.unlink()

    def test_unknown_account_no_spawn(self):
        for value in (None, "", "other", "../kuno", "muu\n"):
            with self.subTest(value=value):
                self.env.pop("PI_BROWSER_ACCOUNT", None)
                if value is not None:
                    self.env["PI_BROWSER_ACCOUNT"] = value
                self.assert_rejected(self.run_helper())

    def test_extra_arguments_rejected(self):
        self.assert_rejected(self.run_helper("--profile-dir-name", "Default"))

    def test_conflicting_playwright_env(self):
        self.env.update({"PLAYWRIGHT_MCP_EXTENSION_TOKEN": "wrong-secret",
                         "PLAYWRIGHT_MCP_PROFILE_DIR_NAME": "Default",
                         "PLAYWRIGHT_MCP_CDP_ENDPOINT": "http://untrusted.invalid",
                         "PLAYWRIGHT_MCP_CONFIG": "/untrusted/config"})
        result = self.run_helper()
        self.assertEqual(result.returncode, 0, result.stderr)
        got = json.loads(self.capture.read_text())
        self.assertEqual(got["env"], {"PLAYWRIGHT_MCP_EXTENSION_TOKEN": "fake-muu-secret"})
        self.assertEqual(got["argv"][-1], "Profile 11")

    def test_stdio_passthrough(self):
        result = self.run_helper()
        self.assertEqual((result.returncode, result.stdout, result.stderr), (0, "MCP-STDOUT\n", "MCP-STDERR\n"))

    def test_invalid_secret_contents_no_spawn(self):
        for content in (b"", b"\n", b"fake-muu-secret\nextra", b"fake-muu-secret\x00", b"x" * 4097, b"\xff"):
            with self.subTest(content_kind=len(content)):
                self.secret().write_bytes(content)
                self.assert_rejected(self.run_helper())

    def test_single_trailing_newline_is_accepted(self):
        self.secret().write_text("fake-muu-secret\n")
        result = self.run_helper()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(self.capture.read_text())["env"]["PLAYWRIGHT_MCP_EXTENSION_TOKEN"], "fake-muu-secret")

    def test_invalid_secret_file_no_spawn(self):
        self.secret().unlink()
        self.assert_rejected(self.run_helper())
        self.secret().symlink_to(self.secret("kuno"))
        self.assert_rejected(self.run_helper())
        self.secret().unlink()
        self.secret().mkdir()
        self.assert_rejected(self.run_helper())
        self.secret().rmdir()
        os.mkfifo(self.secret(), 0o600)
        self.assert_rejected(self.run_helper())

    def test_permissions_rejected(self):
        for path, good_mode in ((self.base, 0o700), (self.tokens, 0o700), (self.secret(), 0o600)):
            with self.subTest(path=path.name):
                path.chmod(0o755 if path.is_dir() else 0o644)
                self.assert_rejected(self.run_helper())
                path.chmod(good_mode)

    def test_parent_symlink_rejected(self):
        self.tokens.rename(self.base / "actual-tokens")
        self.tokens.symlink_to(self.base / "actual-tokens", target_is_directory=True)
        self.assert_rejected(self.run_helper())

    def test_outer_parent_symlink_rejected(self):
        self.base.rename(self.home / "actual-base")
        self.base.symlink_to(self.home / "actual-base", target_is_directory=True)
        self.assert_rejected(self.run_helper())

    def test_foreign_owner_rejected(self):
        self.assertTrue(SCRIPT.exists(), "browser MCP helper is not implemented")
        loader = importlib.machinery.SourceFileLoader("pi_browser_mcp", str(SCRIPT))
        spec = importlib.util.spec_from_loader(loader.name, loader)
        module = importlib.util.module_from_spec(spec)
        loader.exec_module(module)
        # Different process uid models a file owned by someone other than the runner.
        with patch.dict(os.environ, self.env, clear=True), patch.object(module.os, "getuid", return_value=os.getuid() + 1):
            with self.assertRaises(ValueError):
                module.read_token(self.home, "muu")

    def test_shared_mcp_entry(self):
        import shutil
        chezmoi = shutil.which("chezmoi")
        self.assertIsNotNone(chezmoi, "chezmoi is needed to render the real MCP template")
        fake_op = self.bin / "op"
        fake_op.write_text("#!/bin/sh\nprintf '%s' fixture-secret\n")
        fake_op.chmod(0o755)
        config = self.home / "chezmoi.toml"
        config.write_text("")
        template = (ROOT / "dot_pi/private_agent/private_mcp.json.tmpl").read_text()
        result = subprocess.run([chezmoi, "--config", str(config), "--source", str(self.home),
                                 "--destination", str(self.home), "execute-template"],
                                input=template, env=self.env, text=True, capture_output=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)
        servers = json.loads(result.stdout)["mcpServers"]
        self.assertEqual(servers["playwright-browser"], {
            "command": str(self.home / ".local/bin/pi-browser-mcp"),
            "exposure": "codemode", "timeout": 120,
            "description": "Control only the Chrome profile assigned to the Pi account; use only within the user's authorized browser task."
        })
        self.assertEqual(servers["slack"]["env"]["SLACK_BOT_TOKEN"], "fixture-secret")
        self.assertEqual(servers["honeycomb"]["url"], "https://mcp.honeycomb.io/mcp")
        self.assertEqual(servers["google_calendar"]["env"]["GOOGLE_OAUTH_CREDENTIALS"],
                         str(self.home / ".config/google-calendar-mcp/gcp-oauth.keys.json"))
        self.assertNotIn("fake-muu-secret", result.stdout)

if __name__ == "__main__":
    unittest.main()
