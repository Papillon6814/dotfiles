import unittest, tempfile, pathlib, subprocess, os, json, plistlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
SCRIPT=ROOT/"dot_local/bin/executable_muxy-herdr"
INSTALL=ROOT/"scripts/install-muxy-herdr-cleanup.sh"
ID1="18074007325687140181"  # 16進 fad3c5e70b63cf55
ID2="15834232852757886351"  # 16進 dbbe7ee2df74358f
ME=os.getpid()  # テストから起動した muxy-herdr の親 = いまの Beta の Muxy サーバー役
CUR=f"{ME}:T"   # その印（MUXY_HERDR_LSTART_CMD が起動時刻として T を返す）
OLD="999:T"     # 再起動前の Muxy サーバーの印
STABLE_SERVER=2
class MuxyHerdr(unittest.TestCase):
 def setUp(self):
  self.t=tempfile.TemporaryDirectory(prefix="muxy-herdr-");self.home=pathlib.Path(self.t.name).resolve()
  self.state=self.home/"state";self.ps=self.home/"ps.txt";self.setps()
  self.calls=self.home/"herdr-calls.txt";self.herdr=self.home/"herdr"
  self.herdr.write_text('#!/bin/bash\necho "$*" >>"%s"\n[ "$1 $2" = "session stop" ] && [ "$3" = gone ] && { echo "session gone is not running or cannot be reached"; exit 1; }\nexit 0\n'%self.calls);self.herdr.chmod(0o755)
  self.beta_ds=self.home/"beta.json";self.stable_ds=self.home/"stable.json"
  self.desktop(self.beta_ds,[]);self.desktop(self.stable_ds,[])
  self.proj=self.home/"ai-secretary";self.proj.mkdir()
  self.lstart=self.home/"lstart";self.lstart.write_text('#!/bin/sh\n[ "$LC_ALL" = C ] && echo T || echo "Mon_$LC_ALL"\n');self.lstart.chmod(0o755)
 def tearDown(self):self.t.cleanup()
 def setps(self,*lines,servers=True):
  # 書式: pid ppid command [環境変数...]
  head=[f"{ME} 1 /Applications/Muxy Beta.app/Contents/MacOS/muxy-server --socket /Users/x/Library/Application Support/Muxy Beta/server.sock",
        f"{STABLE_SERVER} 1 /Applications/Muxy.app/Contents/MacOS/muxy-server --socket /Users/x/Library/Application Support/Muxy 2/server.sock"] if servers else []
  self.ps.write_text("".join(l+"\n" for l in head+list(lines)))
 def alive(self,*ids):
  # 端末が動いている = その MUXY_SESSION_ID を持つ muxy-herdr（exec 前）か herdr クライアントがいる
  self.setps(*[f"{100+n} {ME} bash /Users/x/.local/bin/muxy-herdr --beta TERM=x MUXY_SESSION_ID={i}" for n,i in enumerate(ids)])
 def desktop(self,path,ids):
  path.write_text(json.dumps({"projects":[{"tabs":[{"panes":[{"content":{"type":"terminal","session":int(i)}} for i in ids]}]}]}))
 def write_map(self,text,variant="beta"):
  self.state.mkdir(parents=True,exist_ok=True);(self.state/(variant+".tsv")).write_text(text)
 def env(self,sid=None):
  e={**os.environ,"HOME":str(self.home),"MUXY_HERDR_STATE_DIR":str(self.state),"MUXY_HERDR_PS_CMD":"cat "+str(self.ps),
     "MUXY_HERDR_LSTART_CMD":str(self.lstart),"MUXY_HERDR_BIN":str(self.herdr),
     "MUXY_HERDR_BETA_DESKTOP_STATE":str(self.beta_ds),"MUXY_HERDR_STABLE_DESKTOP_STATE":str(self.stable_ds)}
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
  self.assertIn(f"{ID1}\tai-secretary\tbase\t{CUR}",self.map())
 def test_second_tab_gets_suffixed(self):
  self.assertEqual(self.name(ID2,"--beta"),"ai-secretary");self.alive(ID2)
  self.assertEqual(self.name(ID1,"--beta"),"ai-secretary-fad3c5e7")
 def test_same_id_reuses_mapping(self):
  self.name(ID2,"--beta");self.alive(ID2);a=self.name(ID1,"--beta");self.assertEqual(self.name(ID1,"--beta"),a);self.assertEqual(self.name(ID2,"--beta"),"ai-secretary")
 def test_base_taken_by_live_client_gets_suffix(self):
  self.setps(f"100 {ME} herdr --session ai-secretary TERM=xterm",f"200 1 /opt/homebrew/bin/herdr server")
  self.assertEqual(self.name(ID1,"--beta"),"ai-secretary-fad3c5e7")
 def test_plain_herdr_client_counts_as_default(self):
  fm=self.home/"firstmate";fm.mkdir()
  self.setps(f"100 {ME} /opt/homebrew/bin/herdr PATH=/usr/bin")
  self.assertEqual(self.name(ID1,"--beta",cwd=fm),"default-fad3c5e7")
 def test_firstmate_maps_to_default(self):
  fm=self.home/"firstmate";fm.mkdir()
  self.assertEqual(self.name(ID1,"--beta",cwd=fm),"default");self.assertEqual(self.name(ID1,cwd=fm),"stable-default")
 def test_no_session_id_falls_back_to_base(self):
  self.name(ID2,"--beta")
  self.assertEqual(self.name(None,"--beta"),"ai-secretary");self.assertEqual(self.name("abc","--beta"),"ai-secretary")
  self.assertNotIn("abc",self.map())
 def test_stale_base_owner_is_reclaimed(self):
  # Muxy サーバー再起動後: 古い番号の端末はもう無いので、新しいタブが基本名を取り戻す
  self.write_map(f"1\tai-secretary\tbase\t{OLD}\n5\tai-secretary-00000000\ttab\t{OLD}\n")
  self.assertEqual(self.name(ID1,"--beta"),"ai-secretary")
  self.assertNotIn(f"1\tai-secretary\tbase\t{OLD}",self.map().splitlines());self.assertIn(f"{ID1}\tai-secretary\tbase",self.map());self.assertIn("ai-secretary-00000000",self.map())
 def test_herdr_server_env_does_not_count_as_alive(self):
  # herdr サーバーとその中のペインは、起動したタブの MUXY_SESSION_ID を持ち続けるので、生きている根拠にしない
  self.write_map("1\tai-secretary\tbase\n")
  self.setps("10 1 /opt/homebrew/bin/herdr server MUXY_SESSION_ID=1","11 10 -fish MUXY_SESSION_ID=1","12 11 claude MUXY_SESSION_ID=1")
  self.assertEqual(self.name(ID1,"--beta"),"ai-secretary")
 def test_live_herdr_client_owner_keeps_base(self):
  self.write_map("1\tai-secretary\tbase\n")
  self.setps(f"10 {ME} /opt/homebrew/bin/herdr --session other MUXY_SESSION_ID=1")
  self.assertEqual(self.name(ID1,"--beta"),"ai-secretary-fad3c5e7")
 def test_concurrent_two_ids_get_distinct_names(self):
  self.alive(ID1,ID2)
  ps=[subprocess.Popen(["bash",str(SCRIPT),"--beta","--print-name"],env=self.env(i),cwd=self.proj,stdout=subprocess.PIPE,text=True) for i in (ID1,ID2)]
  names=[p.communicate()[0].strip() for p in ps]
  self.assertEqual(len(set(names)),2,names);self.assertIn("ai-secretary",names)
 def test_exec_passes_session_to_herdr(self):
  subprocess.run(["bash",str(SCRIPT),"--beta"],env=self.env(ID1),cwd=self.proj,check=True)
  fm=self.home/"firstmate";fm.mkdir()
  subprocess.run(["bash",str(SCRIPT),"--beta"],env=self.env(ID2),cwd=fm,check=True)
  self.assertEqual(self.calls_().splitlines(),["--session ai-secretary",""])

 # --- Muxy サーバー再起動後の引き継ぎ ---
 def test_adopts_orphan_after_server_restart(self):
  self.write_map(f"1\tai-secretary\tbase\t{OLD}\n5\tai-secretary-00000000\ttab\t{OLD}\n6\tai-secretary-11111111\ttab\t{OLD}\n")
  self.assertEqual(self.name(ID2,"--beta"),"ai-secretary");self.alive(ID2)
  self.assertEqual(self.name(ID1,"--beta"),"ai-secretary-00000000")
  self.assertIn(f"{ID1}\tai-secretary-00000000\ttab\t{CUR}",self.map());self.assertNotIn("5\t",self.map())
  self.alive(ID2,ID1);self.assertEqual(self.name("42","--beta"),"ai-secretary-11111111")
  self.alive(ID2,ID1,"42");self.assertEqual(self.name("12365999997502019003","--beta"),"ai-secretary-ab9cdb7a")
 def test_does_not_adopt_closed_tab_on_same_server(self):
  self.write_map(f"{ID2}\tai-secretary\tbase\t{CUR}\n5\tai-secretary-00000000\ttab\t{CUR}\n");self.alive(ID2)
  self.assertEqual(self.name(ID1,"--beta"),"ai-secretary-fad3c5e7")
 def test_does_not_adopt_when_owner_or_client_alive(self):
  self.write_map(f"{ID2}\tai-secretary\tbase\t{CUR}\n5\tai-secretary-00000000\ttab\t{OLD}\n6\tai-secretary-11111111\ttab\t{OLD}\n")
  self.setps(f"100 {ME} bash /x/muxy-herdr --beta MUXY_SESSION_ID={ID2}",f"101 {ME} bash /x/muxy-herdr --beta MUXY_SESSION_ID=5",f"102 1 herdr --session ai-secretary-11111111 TERM=x")
  self.assertEqual(self.name(ID1,"--beta"),"ai-secretary-fad3c5e7")
 def test_does_not_adopt_other_folder_or_variant(self):
  self.write_map(f"{ID2}\tai-secretary\tbase\t{CUR}\n5\tai-secretary-muumoo-00000000\ttab\t{OLD}\n");self.alive(ID2)
  self.assertEqual(self.name(ID1,"--beta"),"ai-secretary-fad3c5e7")
 def test_no_adoption_when_parent_is_not_muxy_server(self):
  self.write_map(f"{ID2}\tai-secretary\tbase\t{OLD}\n5\tai-secretary-00000000\ttab\t{OLD}\n")
  self.setps(f"100 {ME} bash /x/muxy-herdr --beta MUXY_SESSION_ID={ID2}",servers=False)
  self.assertEqual(self.name(ID1,"--beta"),"ai-secretary-fad3c5e7")

 # --- 片付け ---
 def two_tabs(self):
  self.desktop(self.beta_ds,[ID2,ID1]);self.name(ID2,"--beta");self.alive(ID2);self.name(ID1,"--beta");self.setps()
 def test_learns_live_clients(self):
  self.desktop(self.beta_ds,[ID1]);self.desktop(self.stable_ds,[ID2])
  self.setps(f"10 {ME} herdr --session Code TERM=x MUXY_SESSION_ID={ID1}",f"11 {STABLE_SERVER} /opt/homebrew/bin/herdr --session stable-Docs MUXY_SESSION_ID={ID2}",f"12 {ME} herdr --session Code-fad3c5e7 MUXY_SESSION_ID={ID1}")
  self.cleanup()
  self.assertIn(f"{ID1}\tCode\tbase\t{CUR}",self.map());self.assertIn(f"{ID2}\tstable-Docs\tbase\t{STABLE_SERVER}:T",self.map("stable"))
  self.assertEqual(self.map().count(ID1),1)
 def test_learn_fills_missing_mark(self):
  self.desktop(self.beta_ds,[ID1]);self.write_map(f"{ID1}\tCode\tbase\n")
  self.setps(f"10 {ME} herdr --session Code MUXY_SESSION_ID={ID1}");self.cleanup()
  self.assertEqual(self.map(),f"{ID1}\tCode\tbase\t{CUR}\n")
 def test_mark_is_locale_independent(self):
  # launchd（日本語）と Muxy の端末で印がずれないこと
  e=self.env(ID1);e["LC_ALL"]="ja_JP.UTF-8";e["LANG"]="ja_JP.UTF-8"
  r=subprocess.run(["bash",str(SCRIPT),"--beta","--print-name"],env=e,capture_output=True,text=True,cwd=self.proj)
  self.assertEqual(r.returncode,0,r.stderr);self.assertIn(f"{ID1}\tai-secretary\tbase\t{CUR}\n",self.map())
 def test_learned_suffixed_client_is_tab(self):
  self.desktop(self.beta_ds,[ID1])
  self.setps(f"12 {ME} herdr --session Code-fad3c5e7 MUXY_SESSION_ID={ID1}")
  self.cleanup();self.assertIn(f"{ID1}\tCode-fad3c5e7\ttab",self.map())
 def test_stops_suffixed_after_two_runs(self):
  self.two_tabs();self.desktop(self.beta_ds,[ID2])
  self.cleanup();self.assertNotIn("session stop",self.calls_());self.assertIn("ai-secretary-fad3c5e7",self.map())
  self.cleanup();self.assertIn("session stop ai-secretary-fad3c5e7",self.calls_())
  self.assertNotIn("fad3c5e7",self.map());self.assertIn("stopped: ai-secretary-fad3c5e7",self.log())
 def test_tab_back_before_second_run_is_kept(self):
  self.two_tabs();self.desktop(self.beta_ds,[ID2]);self.cleanup()
  self.desktop(self.beta_ds,[ID2,ID1]);self.cleanup();self.desktop(self.beta_ds,[ID2]);self.cleanup()
  self.assertNotIn("session stop",self.calls_())
 def test_releases_base_without_stop(self):
  self.two_tabs();self.desktop(self.beta_ds,[ID1]);self.cleanup();self.cleanup()
  self.assertNotIn("session stop",self.calls_());self.assertNotIn(ID2,self.map());self.assertIn("released: ai-secretary",self.log())
 def test_keeps_when_client_alive(self):
  self.two_tabs();self.desktop(self.beta_ds,[ID2])
  self.setps("10 1 herdr --session ai-secretary-fad3c5e7 TERM=x")
  self.cleanup();self.cleanup()
  self.assertNotIn("session stop",self.calls_());self.assertIn("fad3c5e7",self.map())
 def test_keeps_restart_orphans_for_adoption(self):
  # 再起動前のサーバーのタブは、閉じたのではないので止めずに残す（新しいタブが引き継ぐ）
  self.desktop(self.beta_ds,[ID1]);self.write_map(f"5\tai-secretary-00000000\ttab\t{OLD}\n1\tai-secretary\tbase\t{OLD}\n")
  self.cleanup();self.cleanup();self.cleanup()
  self.assertNotIn("session stop",self.calls_());self.assertIn("ai-secretary-00000000",self.map());self.assertIn("1\tai-secretary\tbase",self.map())
 def test_skips_variant_when_server_not_running(self):
  self.two_tabs();self.desktop(self.beta_ds,[ID2]);self.setps(servers=False)
  self.cleanup();self.cleanup()
  self.assertNotIn("session stop",self.calls_());self.assertIn("fad3c5e7",self.map())
 def test_already_stopped_session_is_dropped(self):
  self.write_map(f"{ID1}\tgone\ttab\t{CUR}\n")
  self.desktop(self.beta_ds,[ID2]);self.cleanup();self.cleanup()
  self.assertEqual(self.map(),"");self.assertIn("gone",self.log())
 def test_aborts_on_unreadable_or_empty_state(self):
  self.two_tabs()
  for content in ["{broken","{\"projects\":[]}"]:
   self.beta_ds.write_text(content);self.cleanup();self.cleanup()
  self.beta_ds.unlink();self.cleanup();self.cleanup()
  self.assertNotIn("session stop",self.calls_());self.assertEqual(self.map().count("\n"),2)
 def test_dry_run_changes_nothing(self):
  self.two_tabs();self.desktop(self.beta_ds,[ID2]);before=self.map()
  self.cleanup("--dry-run");self.cleanup("--dry-run")
  self.assertEqual(self.map(),before);self.assertNotIn("session stop",self.calls_());self.assertEqual(self.log(),"")
  self.assertFalse((self.state/"beta.pending").exists())
 def test_plist_renders_and_lints(self):
  r=subprocess.run(["bash",str(INSTALL),"--render"],capture_output=True,text=True,env={**os.environ,"HOME":str(self.home)})
  self.assertEqual(r.returncode,0,r.stderr);p=plistlib.loads(r.stdout.encode())
  self.assertEqual(p["Label"],"com.kendrickmalar.muxy-herdr-cleanup");self.assertEqual(p["StartInterval"],600)
  self.assertEqual(p["ProgramArguments"],["/bin/bash",str(ROOT/"dot_local/bin/executable_muxy-herdr"),"cleanup"])
  self.assertIn("/opt/homebrew/bin",p["EnvironmentVariables"]["PATH"]);self.assertNotIn("__HOME__",r.stdout);self.assertNotIn("__REPO__",r.stdout)

if __name__=="__main__":unittest.main()
