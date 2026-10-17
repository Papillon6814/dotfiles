import unittest, tempfile, pathlib, os, subprocess
SCRIPT=pathlib.Path(__file__).resolve().parents[1]/"dot_local/bin/executable_pi"
def run(args,extra=None):
 d=tempfile.TemporaryDirectory(prefix="pi-shim-");root=pathlib.Path(d.name);bin=root/"bin";bin.mkdir();log=root/"called"
 real=root/"real-pi"
 for file,name in ((bin/"pi-profile","pi-profile"),(bin/"pi-account","pi-account"),(real,"real")):
  file.write_text("#!/bin/sh\nprintf '%s\\n' "+name+" \"$@\" > "+str(log)+"\nprintf '%s' \"$PI_PROFILE_PI_BIN\" > "+str(root/"bin-used")+"\n");file.chmod(0o755)
 env={"HOME":str(root),"PATH":str(bin)+":/usr/bin:/bin","PI_REAL_PI":str(real)}
 env.update(extra or {})
 r=subprocess.run(["bash",str(SCRIPT),*args],env=env,capture_output=True,text=True)
 return d,root,r,log.read_text().splitlines() if log.exists() else []
class PiShim(unittest.TestCase):
 def test_new_session_goes_through_launcher(self):
  d,root,r,calls=run(["--model","a b","--","日本語"])
  with d:
   self.assertEqual(r.returncode,0,r.stderr)
   self.assertEqual(calls,["pi-profile","launch","--","--model","a b","--","日本語"])
   self.assertEqual((root/"bin-used").read_text(),str(root/"real-pi"))
 def test_muu_session_routes_to_account(self):
  for acc in ("muu","rbx"):
   with self.subTest(acc=acc):
    d=tempfile.TemporaryDirectory(prefix="pi-shim-");root=pathlib.Path(d.name);bin=root/"bin";bin.mkdir();log=root/"called"
    for n in ("pi-profile","pi-account"):
     f=bin/n;f.write_text("#!/bin/sh\nprintf '%s\\n' "+n+" \"$@\" > "+str(log)+"\n");f.chmod(0o755)
    sess=str(root)+"/.pi/agent-"+acc+"/sessions/x.jsonl"
    r=subprocess.run(["bash",str(SCRIPT),"--session",sess],env={"HOME":str(root),"PATH":str(bin)+":/usr/bin:/bin","PI_REAL_PI":"/nonexistent"},capture_output=True,text=True)
    self.assertEqual(r.returncode,0,r.stderr)
    self.assertEqual(log.read_text().splitlines(),["pi-account",acc,"--session",sess])
    d.cleanup()
 def test_kuno_session_goes_through_launcher(self):
  d=tempfile.TemporaryDirectory(prefix="pi-shim-");root=pathlib.Path(d.name);bin=root/"bin";bin.mkdir();log=root/"called"
  for n in ("pi-profile","pi-account"):
   f=bin/n;f.write_text("#!/bin/sh\nprintf '%s\\n' "+n+" \"$@\" > "+str(log)+"\n");f.chmod(0o755)
  sess=str(root)+"/.pi/agent/sessions/x.jsonl"
  with d:
   r=subprocess.run(["bash",str(SCRIPT),"--session",sess],env={"HOME":str(root),"PATH":str(bin)+":/usr/bin:/bin","PI_REAL_PI":"/nonexistent"},capture_output=True,text=True)
   self.assertEqual(r.returncode,0,r.stderr)
   self.assertEqual(log.read_text().splitlines(),["pi-profile","launch","--","--session",sess])
 def test_bypass_conditions_exec_real_pi(self):
  for extra in ({"PI_PROFILE_LAUNCHER":"0"},{"PI_SUBAGENT_CHILD":"1"},{"PI_PROFILE_LAUNCH_CONTEXT":"/tmp/ctx"}):
   with self.subTest(extra=extra):
    d,root,r,calls=run(["--session","x y","--","日本語"],extra)
    with d:
     self.assertEqual(r.returncode,0,r.stderr)
     self.assertEqual(calls,["real","--session","x y","--","日本語"])
if __name__=="__main__":unittest.main()
