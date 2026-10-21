import unittest, tempfile, pathlib, subprocess, os, plistlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
SCRIPT=ROOT/"scripts/install-scaffold-watchdog.sh"
class WatchdogPlist(unittest.TestCase):
 def test_render_fills_paths_and_lints(self):
  with tempfile.TemporaryDirectory(prefix="wd-plist-") as d:
   root=pathlib.Path(d);sc=root/"pi-scaffold";su=root/"pi-subagents"
   (sc/"bin").mkdir(parents=True);(sc/"bin/scaffold-watchdog").write_text("");(su/"scripts").mkdir(parents=True);(su/"scripts/reconcile-stale-runs.ts").write_text("")
   r=subprocess.run(["bash",str(SCRIPT),"--render",str(sc),str(su)],env={**os.environ,"HOME":str(root)},capture_output=True,text=True)
   self.assertEqual(r.returncode,0,r.stderr);self.assertNotIn("__",r.stdout.replace("<!--","").split("-->",1)[1])
   out=root/"out.plist";out.write_text(r.stdout)
   self.assertEqual(subprocess.run(["plutil","-lint",str(out)],capture_output=True).returncode,0)
   p=plistlib.loads(r.stdout.encode())
   self.assertEqual(p["ProgramArguments"],["/opt/homebrew/bin/node",str(sc)+"/bin/scaffold-watchdog","--once"])
   self.assertEqual(p["StartInterval"],60);self.assertTrue(p["RunAtLoad"])
   self.assertEqual(p["StandardOutPath"],str(root)+"/.local/state/scaffold-watchdog.launchd.log")
   env=p["EnvironmentVariables"]
   self.assertEqual(env["PATH"],str(root)+"/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin")
   self.assertEqual(env["SCAFFOLD_WATCHDOG_SUBAGENTS_RECONCILE"],str(su)+"/scripts/reconcile-stale-runs.ts")
   self.assertEqual(env["PI_SUBAGENTS_STALE_ALIVE_PID_MS"],"7200000")
   self.assertEqual(env["SCAFFOLD_WATCHDOG_CLAUDE_COMMAND"],str(root)+"/Documents/GitHub/claude-scaffold/bin/claude-dev")
 def test_render_refuses_missing_entry(self):
  with tempfile.TemporaryDirectory(prefix="wd-plist-") as d:
   r=subprocess.run(["bash",str(SCRIPT),"--render",d,d],env={**os.environ,"HOME":d},capture_output=True,text=True)
   self.assertNotEqual(r.returncode,0)
 def _install(self,root,*args):
  # launchctl は偽物に差し替え、呼ばれた引数を記録する
  fake=root/"fakebin";fake.mkdir(exist_ok=True);log=root/"launchctl.log"
  (fake/"launchctl").write_text("#!/bin/bash\necho \"$*\" >> "+str(log)+"\n");(fake/"launchctl").chmod(0o755)
  r=subprocess.run(["bash",str(SCRIPT),*args],env={**os.environ,"HOME":str(root),"PATH":str(fake)+":"+os.environ["PATH"]},capture_output=True,text=True)
  return r,(log.read_text().splitlines() if log.exists() else [])
 def test_install_with_missing_entry_keeps_running_job_and_plist(self):
  with tempfile.TemporaryDirectory(prefix="wd-plist-") as d:
   root=pathlib.Path(d);dest=root/"Library/LaunchAgents/com.kendrickmalar.scaffold-watchdog.plist"
   dest.parent.mkdir(parents=True);dest.write_text("OLD")
   r,calls=self._install(root,str(root/"no-scaffold"),str(root/"no-subagents"))
   self.assertNotEqual(r.returncode,0)
   self.assertEqual(dest.read_text(),"OLD")
   self.assertEqual(calls,[])
 def test_install_replaces_plist_and_restarts_job(self):
  with tempfile.TemporaryDirectory(prefix="wd-plist-") as d:
   root=pathlib.Path(d);sc=root/"pi-scaffold";su=root/"pi-subagents"
   (sc/"bin").mkdir(parents=True);(sc/"bin/scaffold-watchdog").write_text("");(su/"scripts").mkdir(parents=True);(su/"scripts/reconcile-stale-runs.ts").write_text("")
   dest=root/"Library/LaunchAgents/com.kendrickmalar.scaffold-watchdog.plist"
   dest.parent.mkdir(parents=True);dest.write_text("OLD")
   r,calls=self._install(root,str(sc),str(su))
   self.assertEqual(r.returncode,0,r.stderr)
   self.assertEqual(plistlib.loads(dest.read_bytes())["ProgramArguments"][1],str(sc)+"/bin/scaffold-watchdog")
   self.assertEqual([c.split()[0] for c in calls],["bootout","bootstrap"])
   self.assertEqual(list(dest.parent.iterdir()),[dest])
if __name__=="__main__":unittest.main()
