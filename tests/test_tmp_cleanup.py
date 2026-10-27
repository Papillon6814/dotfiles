import unittest, tempfile, pathlib, subprocess, os, time, plistlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
SCRIPT=ROOT/"scripts/tmp-cleanup.sh"
INSTALL=ROOT/"scripts/install-tmp-cleanup.sh"
OLD=time.time()-5*86400
def age(path,t=OLD):
 for p in [path,*path.rglob("*")]:os.utime(p,(t,t),follow_symlinks=False)
class TmpCleanup(unittest.TestCase):
 def setUp(self):
  self.t=tempfile.TemporaryDirectory(prefix="tmp-cleanup-");self.home=pathlib.Path(self.t.name).resolve()
  self.tmp=self.home/"tmp";self.tmp.mkdir();self.lsof=self.home/"open";self.lsof.write_text("p1\nn/dev/null\n")
 def tearDown(self):self.t.cleanup()
 def make(self,name,old=True):
  d=self.tmp/name;(d/"sub").mkdir(parents=True);(d/"sub/f.txt").write_text("x")
  if old:age(d)
  return d
 def run_(self,*args):
  env={**os.environ,"HOME":str(self.home),"TMP_CLEANUP_ROOT":str(self.tmp),"TMP_CLEANUP_LSOF_CMD":"cat "+str(self.lsof)}
  return subprocess.run(["bash",str(SCRIPT),*args],env=env,capture_output=True,text=True,cwd=self.home)
 def log(self):
  f=self.home/".local/state/tmp-cleanup.log";return f.read_text() if f.exists() else ""
 def test_removes_old_workspaces_and_logs(self):
  a=self.make("ael-safe-fresh-AbC123");s=self.make("scaffold-pr-task3-source.x1")
  r=self.run_();self.assertEqual(r.returncode,0,r.stderr)
  self.assertFalse(a.exists());self.assertFalse(s.exists());self.assertIn("removed: ",self.log());self.assertIn("合計 2 件",self.log())
 def test_keeps_when_anything_inside_is_recent(self):
  a=self.make("ael-v2-fresh-AbC123");(a/"sub/new.txt").write_text("y");os.utime(a/"sub/new.txt",None)
  self.run_();self.assertTrue(a.exists())
 def test_keeps_recent_workspace(self):
  a=self.make("ael-v2-fresh-AbC123",old=False);self.run_();self.assertTrue(a.exists())
 def test_keeps_workspace_open_by_a_process(self):
  a=self.make("ael-v2-fresh-AbC123");self.lsof.write_text("p1\nn"+str(a)+"/sub/f.txt\n")
  self.run_();self.assertTrue(a.exists());self.assertIn("プロセスが開いている",self.log())
 def test_open_sibling_with_longer_name_does_not_protect(self):
  a=self.make("ael-x-AbC123");self.lsof.write_text("p1\nn"+str(a)+"9/f\n")
  self.run_();self.assertFalse(a.exists())
 def test_leaves_other_names_alone(self):
  o=self.make("pi-github-repos");c=self.make("claude-501");h=self.make("scaffold-hook-1");self.run_()
  self.assertTrue(o.exists());self.assertTrue(c.exists());self.assertTrue(h.exists())
 def test_dry_run_removes_nothing(self):
  a=self.make("ael-safe-fresh-AbC123");r=self.run_("--dry-run")
  self.assertTrue(a.exists());self.assertIn("would remove: "+str(a),r.stdout);self.assertEqual(self.log(),"")
 def test_empty_lsof_aborts(self):
  a=self.make("ael-safe-fresh-AbC123");self.lsof.write_text("");self.run_();self.assertTrue(a.exists())
 def test_symlink_is_unlinked_without_touching_target(self):
  target=self.home/"keep";target.mkdir();(target/"f").write_text("x");l=self.tmp/"ael-link-AbC123";l.symlink_to(target);age(l)
  self.run_();self.assertFalse(l.is_symlink());self.assertTrue((target/"f").exists())
 def test_glob_does_not_expand_in_the_working_directory(self):
  (self.home/"ael-in-home").mkdir();age(self.home/"ael-in-home");a=self.make("ael-safe-fresh-AbC123")
  self.run_();self.assertTrue((self.home/"ael-in-home").exists());self.assertFalse(a.exists())
 def test_render_plist(self):
  r=subprocess.run(["bash",str(INSTALL),"--render"],env={**os.environ,"HOME":str(self.home)},capture_output=True,text=True)
  self.assertEqual(r.returncode,0,r.stderr);self.assertNotIn("__",r.stdout.split("-->",1)[1])
  out=self.home/"out.plist";out.write_text(r.stdout)
  self.assertEqual(subprocess.run(["plutil","-lint",str(out)],capture_output=True).returncode,0)
  p=plistlib.loads(r.stdout.encode())
  self.assertEqual(p["ProgramArguments"],["/bin/bash",str(ROOT)+"/scripts/tmp-cleanup.sh"])
  self.assertEqual(p["StartInterval"],21600);self.assertTrue(p["RunAtLoad"])
  self.assertEqual(p["StandardOutPath"],str(self.home)+"/.local/state/tmp-cleanup.launchd.log")
if __name__=="__main__":unittest.main()
