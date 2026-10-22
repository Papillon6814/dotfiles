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
            "print(json.dumps({'jsonrpc':'2.0','id':1,'result':{'ok':True}}))\n"
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

    def run_helper(self, *args, input_text=""):
        self.assertTrue(SCRIPT.exists(), "browser MCP helper is not implemented")
        return subprocess.run([sys.executable, str(SCRIPT), *args], env=self.env,
                              capture_output=True, text=True, input=input_text, timeout=12)

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
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout), {"jsonrpc": "2.0", "id": 1, "result": {"ok": True}})
        self.assertEqual(result.stderr, "MCP-STDERR\n")

    def test_invalid_secret_contents_no_spawn(self):
        for content in (b"", b"\n", b"fake-muu-secret\nextra", b"fake-muu-secret\x00", b"x" * 4097, b"\xff", b"fake-muu-secret\xc2\x80", b"fake-muu-secret\xc2\x9f"):
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
    def set_server(self, source):
        import textwrap
        (self.bin / "npx").write_text(f"#!{sys.executable}\n" + textwrap.dedent(source))

    def test_first_connect_result_redacted(self):
        self.set_server("""
            import os,json,sys
            t=os.environ["PLAYWRIGHT_MCP_EXTENSION_TOKEN"]
            print(json.dumps({"jsonrpc":"2.0","id":7,"result":{"content":[{"type":"text","text":"Page URL: chrome-extension://fixture/connect.html?token="+t+"&protocolVersion=2"}]}}))
            print("token was "+t,file=sys.stderr)
        """)
        result = self.run_helper()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertNotIn("fake-muu-secret", result.stdout + result.stderr)
        got = json.loads(result.stdout)
        self.assertEqual(got["id"], 7)
        self.assertIn("?token=[REDACTED]&protocolVersion=2", got["result"]["content"][0]["text"])
        self.assertIn("[REDACTED]", result.stderr)

    def test_encoded_and_escaped_token(self):
        from urllib.parse import quote
        token = "Fixture:+/_%secret"
        self.secret().write_text(token)
        self.set_server(r"""
            import os,json
            from urllib.parse import quote
            t=os.environ["PLAYWRIGHT_MCP_EXTENSION_TOKEN"]
            values=[t,quote(t,safe=""),quote(quote(t,safe=""),safe=""),"https://example.com/?token=obsolete-value&keep=ok"]
            print(json.dumps({"jsonrpc":"2.0","id":11,"result":{"items":values,"unchanged":{"ok":True}}}))
            escaped="".join("\\u%04x"%ord(c) for c in t)
            print('{"jsonrpc":"2.0","id":12,"result":"'+escaped+'"}')
        """)
        result = self.run_helper()
        self.assertEqual(result.returncode, 0, result.stderr)
        for value in [token, quote(token, safe=""), quote(quote(token, safe=""), safe=""), "obsolete-value"]:
            self.assertNotIn(value, result.stdout + result.stderr)
        rows = [json.loads(row) for row in result.stdout.splitlines()]
        self.assertEqual(rows[0]["result"]["items"], ["[REDACTED]"] * 3 + ["https://example.com/?token=[REDACTED]&keep=ok"])
        self.assertEqual(rows[0]["result"]["unchanged"], {"ok": True})
        self.assertEqual(rows[1], {"jsonrpc": "2.0", "id": 12, "result": "[REDACTED]"})

    def test_split_output_and_stderr(self):
        self.set_server("""
            import os,json,sys,time
            t=os.environ["PLAYWRIGHT_MCP_EXTENSION_TOKEN"]
            for n in range(1,len(t)):
                line=json.dumps({"jsonrpc":"2.0","id":n,"result":t})+"\\n"
                i=line.index(t)+n
                sys.stdout.write(line[:i]);sys.stdout.flush()
                sys.stderr.write(t[:n]);sys.stderr.flush()
                time.sleep(0.001)
                sys.stdout.write(line[i:]);sys.stdout.flush()
                sys.stderr.write(t[n:]+"\\n");sys.stderr.flush()
            for n in range(200):
                print(json.dumps({"jsonrpc":"2.0","id":100+n,"result":"x"*1024}))
                print("y"*1024,file=sys.stderr)
            sys.stderr.write(t)
        """)
        result = self.run_helper()
        self.assertEqual(result.returncode, 0, result.stderr[-200:])
        self.assertNotIn("fake-muu-secret", result.stdout + result.stderr)
        rows = [json.loads(row) for row in result.stdout.splitlines()]
        self.assertEqual(len(rows), len("fake-muu-secret") - 1 + 200)
        self.assertEqual(rows[0]["result"], "[REDACTED]")
        self.assertTrue(result.stderr.endswith("[REDACTED]"))

    def test_protocol_preserved(self):
        self.set_server("""
            import sys,json
            for line in sys.stdin:
                request=json.loads(line)
                print(json.dumps({"jsonrpc":"2.0","method":"notifications/progress","params":{"step":1}}))
                print(json.dumps({"jsonrpc":"2.0","id":request["id"],"result":request["params"]}))
                sys.stdout.flush()
        """)
        requests = [{"jsonrpc": "2.0", "id": 23, "params": {"value": [True, None, 1.5]}},
                    {"jsonrpc": "2.0", "id": "second", "params": {"text": "日本語"}}]
        result = self.run_helper(input_text="".join(json.dumps(r) + "\n" for r in requests))
        self.assertEqual(result.returncode, 0, result.stderr)
        rows = [json.loads(row) for row in result.stdout.splitlines()]
        self.assertEqual(rows[0], {"jsonrpc": "2.0", "method": "notifications/progress", "params": {"step": 1}})
        self.assertEqual([rows[1]["id"], rows[3]["id"]], [23, "second"])
        self.assertEqual([rows[1]["result"], rows[3]["result"]], [r["params"] for r in requests])

    def test_invalid_output_fails_closed(self):
        cases = [
            ("stdout", b'not-json fake-muu-secret\n'),
            ("stdout", b'\xff fake-muu-secret\n'),
            ("stdout", b'{"jsonrpc":"2.0","id":1,"result":"fake-muu-secret"}'),
            ("stdout", b'{"jsonrpc":"2.0","id":"fake-muu-secret","result":null}\n'),
            ("stdout", b'{"jsonrpc":"2.0","id":1,"result":{"fake-muu-secret":1,"[REDACTED]":2}}\n'),
            ("stdout", b'{"jsonrpc":"2.0","id":1,"result":"' + b"x" * (16 * 1024 * 1024) + b'fake-muu-secret"}\n'),
            ("stderr", b"fake-muu-secret" + b"x" * (64 * 1024) + b"\n"),
        ]
        for stream, data in cases:
            with self.subTest(stream=stream, size=len(data)):
                payload = self.home / "payload"
                payload.write_bytes(data)
                self.set_server(f"""
                    import sys
                    from pathlib import Path
                    sys.{stream}.buffer.write(Path({str(payload)!r}).read_bytes())
                    sys.{stream}.buffer.flush()
                """)
                result = subprocess.run([sys.executable, str(SCRIPT)], env=self.env,
                                        capture_output=True, input=b"", timeout=12)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(result.stdout, b"")
                self.assertNotIn(b"fake-muu-secret", result.stderr)

    def test_shutdown_eof_and_signals(self):
        import signal
        import time
        self.set_server("""
            import os,sys,signal,time
            from pathlib import Path
            Path(os.environ["CAPTURE"]).write_text(str(os.getpid()))
            signal.signal(signal.SIGTERM,signal.SIG_IGN)
            while True: time.sleep(0.05)
        """)
        for end in ("eof", "term", "int"):
            with self.subTest(end=end):
                self.capture.unlink(missing_ok=True)
                p = subprocess.Popen([sys.executable, str(SCRIPT)], env=self.env,
                                     stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                try:
                    deadline = time.monotonic() + 3
                    while not self.capture.exists() and time.monotonic() < deadline:
                        time.sleep(0.01)
                    self.assertTrue(self.capture.exists(), "fake server did not start")
                    child = int(self.capture.read_text())
                    if end == "eof":
                        p.stdin.close()
                        p.stdin = None
                    else:
                        p.send_signal(signal.SIGTERM if end == "term" else signal.SIGINT)
                    out, err = p.communicate(timeout=9)
                    self.assertNotIn(b"fake-muu-secret", out + err)
                    with self.assertRaises(ProcessLookupError):
                        os.kill(child, 0)
                finally:
                    if p.poll() is None:
                        p.kill()
                        p.communicate()
                    if self.capture.exists():
                        try: os.kill(int(self.capture.read_text()), signal.SIGKILL)
                        except ProcessLookupError: pass

    def test_mixed_json_escape_in_stderr(self):
        self.set_server(r"""
            import sys,json
            sys.stderr.write('f'+'\\u0061'+'ke-muu-secret')
            print(json.dumps({'jsonrpc':'2.0','id':1,'result':'ok'}))
        """)
        result = self.run_helper()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stderr, "[REDACTED]")

    def test_frame_size_boundary(self):
        # Calculate only padding in the fixture, independently of the production limit.
        frame = b'{"jsonrpc":"2.0","id":1,"result":"' + b'x' * (16 * 1024 * 1024 - len(b'{"jsonrpc":"2.0","id":1,"result":""}')) + b'"}'
        self.assertEqual(len(frame), 16777216)
        payload = self.home / "boundary"
        payload.write_bytes(frame + b"\n")
        self.set_server(f"""
            import sys
            from pathlib import Path
            sys.stdout.buffer.write(Path({str(payload)!r}).read_bytes())
        """)
        result = self.run_helper()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)["id"], 1)
        self.assertEqual(len(result.stdout.encode()) - 1, 16777216)

    def test_native_pi_transport_redaction_and_shutdown(self):
        import shutil
        import time
        package = Path("/opt/homebrew/lib/node_modules/@earendil-works/pi-coding-agent")
        if not shutil.which("node") or not (package / "dist/extensions/mcp/runtime.js").exists():
            self.skipTest("native Pi installation unavailable")
        self.set_server("""
            import sys,os,json,subprocess,time,signal
            from pathlib import Path
            grand=subprocess.Popen([sys.executable,'-c','import time;time.sleep(60)'])
            Path(os.environ['CAPTURE']).write_text(json.dumps([os.getpid(),grand.pid,os.getpgrp()]))
            signal.signal(signal.SIGTERM,signal.SIG_IGN)
            for line in sys.stdin:
                d=json.loads(line)
                if 'id' not in d: continue
                if d['method']=='initialize':
                    result={'protocolVersion':'2025-06-18','capabilities':{'tools':{}},'serverInfo':{'name':'fixture','version':'1'}}
                elif d['method']=='tools/list': result={'tools':[]}
                else: result={'content':[{'type':'text','text':'https://example.com/?token='+os.environ['PLAYWRIGHT_MCP_EXTENSION_TOKEN']}]}
                print(json.dumps({'jsonrpc':'2.0','id':d['id'],'result':result}),flush=True)
            while True: time.sleep(0.05)
        """)
        js = """
            import {createDefaultTransport} from 'RUNTIME';
            import {McpClient} from 'CLIENT';
            const c=new McpClient({name:'fixture-client',version:'1',requestTimeoutMs:5000});
            const t=createDefaultTransport({name:'fixture',config:{command:process.env.PYTHON,args:[process.env.HELPER]}},process.cwd());
            try {
                await c.connect(t);
                const r=await c.callTool('probe',{});
                if(r.content[0].text!=='https://example.com/?token=[REDACTED]') throw Error('redaction failed');
                console.log('native redaction PASS');
            } finally { await c.close(); }
        """.replace("RUNTIME", str(package / "dist/extensions/mcp/runtime.js")).replace("CLIENT", str(package / "node_modules/@earendil-works/pi-mcp/dist/client.js"))
        env = dict(os.environ, **self.env, HELPER=str(SCRIPT), PYTHON=sys.executable)
        result = subprocess.run([shutil.which("node"), "--input-type=module"], input=js, env=env,
                                capture_output=True, text=True, timeout=15)
        self.assertEqual(result.returncode, 0, result.stderr[-500:])
        self.assertEqual(result.stdout, "native redaction PASS\n")
        self.assertNotIn("fake-muu-secret", result.stdout + result.stderr)
        child, grand, group = json.loads(self.capture.read_text())
        self.assertNotEqual(group, os.getpgrp())
        deadline = time.monotonic() + 3
        remaining = []
        while time.monotonic() < deadline:
            remaining = []
            for pid in [child, grand]:
                try: os.kill(pid, 0); remaining.append(pid)
                except ProcessLookupError: pass
            if not remaining: break
            time.sleep(0.02)
        self.assertEqual(remaining, [], "native transport left fixture processes")

if __name__ == "__main__":
    unittest.main()
