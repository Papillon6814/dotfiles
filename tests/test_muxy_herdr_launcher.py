import json
import pathlib
import subprocess
import sys
import tempfile
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "dot_local/bin/executable_muxy-herdr"


class MuxyHerdrLauncher(unittest.TestCase):
    def run_launcher(self, folder, arguments=(), exit_code=0):
        self.assertTrue(SCRIPT.is_file(), "Muxy Herdr launcher is missing")
        with tempfile.TemporaryDirectory(prefix="muxy launcher ") as directory:
            home = pathlib.Path(directory)
            binary = home / ".local/bin/herdr"
            binary.parent.mkdir(parents=True)
            binary.write_text(
                f"#!{sys.executable}\n"
                "import json, os, sys\n"
                "print(json.dumps({'arguments': sys.argv[1:], 'cwd': os.getcwd(), "
                "'path': os.environ['PATH'], 'shell': os.environ.get('SHELL'), "
                "'pid': os.getpid()}))\n"
                f"sys.exit({exit_code})\n"
            )
            binary.chmod(0o755)
            cwd = home / folder
            cwd.mkdir()
            # Redirect only the fixed executable path into this isolated fixture.
            source = SCRIPT.read_text()
            self.assertEqual(source.count('exec "/opt/homebrew/bin/herdr"'), 2)
            launcher = home / "launcher.sh"
            launcher.write_text(source.replace('/opt/homebrew/bin/herdr', str(binary)))
            env = {"HOME": str(home), "PATH": "/usr/bin:/bin", "SHELL": str(SCRIPT)}
            process = subprocess.Popen(
                ["/bin/sh", str(launcher), *arguments], cwd=cwd, env=env,
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
            )
            stdout, stderr = process.communicate(timeout=5)
            self.assertEqual(stderr, "")
            output = json.loads(stdout)
            self.assertEqual(output["cwd"], str(cwd.resolve()))
            self.assertEqual(output["pid"], process.pid)
            self.assertEqual(output["shell"], "/opt/homebrew/bin/fish")
            self.assertEqual(output["path"].split(":"), [
                "/opt/homebrew/bin", str(home / ".local/bin"),
                str(home / ".cargo/bin"), "/usr/bin", "/bin",
            ])
            return output["arguments"], process.returncode

    def test_project_folder_selects_named_session(self):
        arguments, status = self.run_launcher("claude-workflows")
        self.assertEqual(arguments, ["--session", "stable-claude-workflows"])
        self.assertEqual(status, 0)

    def test_firstmate_uses_isolated_stable_default_session(self):
        arguments, status = self.run_launcher("firstmate")
        self.assertEqual(arguments, ["--session", "stable-default"])
        self.assertEqual(status, 0)

    def test_space_and_unicode_folder_is_one_session_argument(self):
        arguments, status = self.run_launcher("日本語 project")
        self.assertEqual(arguments, ["--session", "stable-日本語 project"])
        self.assertEqual(status, 0)

    def test_login_shell_argument_is_not_forwarded_to_herdr(self):
        arguments, status = self.run_launcher("project", arguments=("-l",))
        self.assertEqual(arguments, ["--session", "stable-project"])
        self.assertEqual(status, 0)

    def test_herdr_exit_status_is_preserved(self):
        arguments, status = self.run_launcher("project", exit_code=23)
        self.assertEqual(arguments, ["--session", "stable-project"])
        self.assertEqual(status, 23)

    def test_existing_stable_prefix_is_not_stripped_from_folder(self):
        arguments, status = self.run_launcher("stable-project")
        self.assertEqual(arguments, ["--session", "stable-stable-project"])
        self.assertEqual(status, 0)


if __name__ == "__main__":
    unittest.main()
