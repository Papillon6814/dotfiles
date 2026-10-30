import unittest, tempfile, pathlib, subprocess, os, plistlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
SCRIPT=ROOT/"scripts/alerter-reaper.sh"
INSTALL=ROOT/"scripts/install-alerter-reaper.sh"
HERDR="/opt/homebrew/bin/alerter --title claude finished --message Open the pane to review the result. --group herdr-w1-p3 --app-icon /x/herdr-focus-notify/icons/claude-color.png --actions Focus --close-label Dismiss --timeout 3600"
class AlerterReaper(unittest.TestCase):
 def setUp(self):
  self.t=tempfile.TemporaryDirectory(prefix="alerter-reaper-");self.home=pathlib.Path(self.t.name).resolve()
  self.ps=self.home/"ps";self.killed=self.home/"killed";self.kill=self.home/"kill"
  self.kill.write_text('#!/bin/sh\nshift\necho "$@" >>'+str(self.killed)+'\n');self.kill.chmod(0o755)
 def tearDown(self):self.t.cleanup()
 def procs(self,*rows):self.ps.write_text("".join(f"{pid} {etime} {cmd}\n" for pid,etime,cmd in rows))
 def run_(self,*args,**env):
  e={**os.environ,"HOME":str(self.home),"ALERTER_REAPER_PS_CMD":"cat "+str(self.ps),
     "ALERTER_REAPER_KILL_CMD":str(self.kill),**env}
  return subprocess.run(["bash",str(SCRIPT),*args],env=e,capture_output=True,text=True,cwd=self.home)
 def killed_pids(self):return self.killed.read_text().split() if self.killed.exists() else []
 def log(self):
  f=self.home/".local/state/alerter-reaper.log";return f.read_text() if f.exists() else ""
 def test_kills_herdr_notifications_older_than_five_minutes(self):
  self.procs((101,"05:00",HERDR),(102,"01:02:03",HERDR),(103,"2-00:00:01",HERDR))
  r=self.run_();self.assertEqual(r.returncode,0,r.stderr)
  self.assertEqual(self.killed_pids(),["101","102","103"]);self.assertIn("closed: 101",self.log());self.assertIn("合計 3 件",self.log())
 def test_keeps_recent_notifications(self):
  self.procs((101,"04:59",HERDR),(102,"00:01",HERDR));self.run_()
  self.assertEqual(self.killed_pids(),[]);self.assertEqual(self.log(),"")
 def test_leaves_other_alerters_and_processes_alone(self):
  self.procs((101,"10:00","/opt/homebrew/bin/alerter --title other --group mine"),
             (102,"10:00","sh /x/herdr-focus-notify/focus-1.sh"),(103,"10:00","grep alerter --group herdr-w1-p3"))
  self.run_();self.assertEqual(self.killed_pids(),[])
 def test_minutes_can_be_changed(self):
  self.procs((101,"02:00",HERDR));self.run_(ALERTER_REAPER_MINUTES="1");self.assertEqual(self.killed_pids(),["101"])
 def test_dry_run_kills_nothing(self):
  self.procs((101,"10:00",HERDR));r=self.run_("--dry-run")
  self.assertEqual(self.killed_pids(),[]);self.assertIn("would close: 101",r.stdout);self.assertEqual(self.log(),"")
 def test_render_plist(self):
  r=subprocess.run(["bash",str(INSTALL),"--render"],env={**os.environ,"HOME":str(self.home)},capture_output=True,text=True)
  self.assertEqual(r.returncode,0,r.stderr);self.assertNotIn("__",r.stdout.split("-->",1)[1])
  out=self.home/"out.plist";out.write_text(r.stdout)
  self.assertEqual(subprocess.run(["plutil","-lint",str(out)],capture_output=True).returncode,0)
  p=plistlib.loads(r.stdout.encode())
  self.assertEqual(p["ProgramArguments"],["/bin/bash",str(ROOT)+"/scripts/alerter-reaper.sh"])
  self.assertEqual(p["StartInterval"],120);self.assertTrue(p["RunAtLoad"])
  self.assertEqual(p["StandardOutPath"],str(self.home)+"/.local/state/alerter-reaper.launchd.log")
if __name__=="__main__":unittest.main()
