import unittest, tempfile, pathlib, subprocess, os, json, plistlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
SCRIPT=ROOT/"dot_local/bin/executable_muxy-herdr"
INSTALL=ROOT/"scripts/install-muxy-herdr-cleanup.sh"
ID1="18074007325687140181"  # 16進 fad3c5e70b63cf55
ID2="15834232852757886351"  # 16進 dbbe7ee2df74358f
class MuxyHerdr(unittest.TestCase):
 def setUp(self):
  self.t=tempfile.TemporaryDirectory(prefix="muxy-herdr-");self.home=pathlib.Path(self.t.name).resolve()
  self.state=self.home/"state";self.ps=self.home/"ps.txt";self.ps.write_text("")
  self.calls=self.home/"herdr-calls.txt";self.herdr=self.home/"herdr"
  self.herdr.write_text('#!/bin/bash\necho "$*" >>"%s"\n[ "$1 $2" = "session stop" ] && [ "$3" = gone ] && { echo "session gone is not running or cannot be reached"; exit 1; }\nexit 0\n'%self.calls);self.herdr.chmod(0o755)
  self.beta_ds=self.home/"beta.json";self.stable_ds=self.home/"stable.json"
  self.desktop(self.beta_ds,[]);self.desktop(self.stable_ds,[])
  self.proj=self.home/"ai-secretary";self.proj.mkdir()
 def tearDown(self):self.t.cleanup()
 def desktop(self,path,ids):
  path.write_text(json.dumps({"projects":[{"tabs":[{"panes":[{"content":{"type":"terminal","session":int(i)}} for i in ids]}]}]}))
 def env(self,sid=None):
  e={**os.environ,"HOME":str(self.home),"MUXY_HERDR_STATE_DIR":str(self.state),"MUXY_HERDR_PS_CMD":"cat "+str(self.ps),
     "MUXY_HERDR_BIN":str(self.herdr),"MUXY_HERDR_BETA_DESKTOP_STATE":str(self.beta_ds),"MUXY_HERDR_STABLE_DESKTOP_STATE":str(self.stable_ds)}
  e.pop("MUXY_SESSION_ID",None)
  if sid is not None:e["MUXY_SESSION_ID"]=sid
  return e
 def name(self,sid,*args,cwd=None):
  r=subprocess.run(["bash",str(SCRIPT),*args,"--print-name"],env=self.env(sid),capture_output=True,text=True,cwd=cwd or self.proj)
  self.assertEqual(r.returncode,0,r.stderr);return r.stdout.strip()
 def cleanup(self,*args):
  r=subprocess.run(["bash",str(SCRIPT),"cleanup",*args],env=self.env(),capture_output=True,text=True,cwd=self.home)
  self.assertEqual(r.returncode,0,r.stderr);return r.stdout
 def map(self,variant="beta"):
  f=self.state/(variant+".tsv");return f.read_text() if f.exists() else ""
 def calls_(self):return self.calls.read_text() if self.calls.exists() else ""
 def log(self):
  f=self.home/".local/state/muxy-herdr-cleanup.log";return f.read_text() if f.exists() else ""

 # --- 名前決定 ---
 def test_first_tab_claims_base(self):
  self.assertEqual(self.name(ID1,"--beta"),"ai-secretary");self.assertEqual(self.name(ID1),"stable-ai-secretary")
 def test_second_tab_gets_suffixed(self):
  self.assertEqual(self.name(ID2,"--beta"),"ai-secretary")
  self.assertEqual(self.name(ID1,"--beta"),"ai-secretary-fad3c5e7")
 def test_same_id_reuses_mapping(self):
  self.name(ID2,"--beta");a=self.name(ID1,"--beta");self.assertEqual(self.name(ID1,"--beta"),a);self.assertEqual(self.name(ID2,"--beta"),"ai-secretary")
 def test_base_taken_by_live_client_gets_suffix(self):
  self.ps.write_text("100 herdr --session ai-secretary TERM=xterm\n200 /opt/homebrew/bin/herdr server\n")
  self.assertEqual(self.name(ID1,"--beta"),"ai-secretary-fad3c5e7")
 def test_plain_herdr_client_counts_as_default(self):
  fm=self.home/"firstmate";fm.mkdir()
  self.ps.write_text("100 /opt/homebrew/bin/herdr PATH=/usr/bin\n")
  self.assertEqual(self.name(ID1,"--beta",cwd=fm),"default-fad3c5e7")
 def test_firstmate_maps_to_default(self):
  fm=self.home/"firstmate";fm.mkdir()
  self.assertEqual(self.name(ID1,"--beta",cwd=fm),"default");self.assertEqual(self.name(ID1,cwd=fm),"stable-default")
 def test_no_session_id_falls_back_to_base(self):
  self.name(ID2,"--beta")
  self.assertEqual(self.name(None,"--beta"),"ai-secretary");self.assertEqual(self.name("abc","--beta"),"ai-secretary")
  self.assertNotIn("abc",self.map())
 def test_concurrent_two_ids_get_distinct_names(self):
  ps=[subprocess.Popen(["bash",str(SCRIPT),"--beta","--print-name"],env=self.env(i),cwd=self.proj,stdout=subprocess.PIPE,text=True) for i in (ID1,ID2)]
  names=[p.communicate()[0].strip() for p in ps]
  self.assertEqual(len(set(names)),2,names);self.assertIn("ai-secretary",names)
 def test_exec_passes_session_to_herdr(self):
  subprocess.run(["bash",str(SCRIPT),"--beta"],env=self.env(ID1),cwd=self.proj,check=True)
  fm=self.home/"firstmate";fm.mkdir()
  subprocess.run(["bash",str(SCRIPT),"--beta"],env=self.env(ID2),cwd=fm,check=True)
  self.assertEqual(self.calls_().splitlines(),["--session ai-secretary",""])

if __name__=="__main__":unittest.main()
