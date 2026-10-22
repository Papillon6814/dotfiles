import unittest, tempfile, pathlib, os, subprocess, json
SCRIPT=pathlib.Path(__file__).resolve().parents[1]/"dot_local/bin/executable_pi-account"
class AccountLauncher(unittest.TestCase):
 def test_three_accounts_keep_auth_dir_and_argv_with_explicit_bypass(self):
  for account in ("kuno","muu","rbx"):
   for bypass in (False,True):
    with self.subTest(account=account,bypass=bypass), tempfile.TemporaryDirectory(prefix="account-launch-") as directory:
     root=pathlib.Path(directory);bin=root/"bin";bin.mkdir();agent=root/".pi/agent";agent.mkdir(parents=True);(agent/"settings.json").write_text("{}")
     log=root/"called"
     for name in ("pi","pi-profile","pi-extension-deps-patch","pi-hermes-realpath-patch"):
      file=bin/name
      if name.startswith("pi-") and name.endswith("-patch"):file.write_text("#!/bin/sh\nexit 0\n")
      else:file.write_text("#!/bin/sh\nprintf '%s\\n' "+name+" \"$@\" > "+str(log)+"\nprintf '%s' \"$PI_CODING_AGENT_DIR\" > "+str(root/"agent-used")+"\nprintf '%s' \"$PI_BROWSER_ACCOUNT\" > "+str(root/"browser-account")+"\n")
      file.chmod(0o755)
     real=root/"real-pi";real.write_text("#!/bin/sh\nprintf '%s\\n' pi \"$@\" > "+str(log)+"\nprintf '%s' \"$PI_CODING_AGENT_DIR\" > "+str(root/"agent-used")+"\nprintf '%s' \"$PI_BROWSER_ACCOUNT\" > "+str(root/"browser-account")+"\n");real.chmod(0o755)
     env={"HOME":str(root),"PATH":str(bin)+":/usr/bin:/bin","PI_REAL_PI":str(real),"PI_BROWSER_ACCOUNT":"inherited-wrong"}
     if bypass:env["PI_PROFILE_LAUNCHER"]="0"
     result=subprocess.run(["bash",str(SCRIPT),account,"--model","value with space","--","日本語"],env=env,capture_output=True,text=True)
     self.assertEqual(result.returncode,0,result.stderr)
     self.assertEqual((root/"browser-account").read_text(),account)
     calls=log.read_text().splitlines()
     self.assertEqual(calls[0],"pi" if bypass else "pi-profile")
     self.assertEqual(calls[1:],["--model","value with space","--","日本語"] if bypass else ["launch","--","--model","value with space","--","日本語"])
     used=(root/"agent-used").read_text()
     self.assertEqual(used,"" if account=="kuno" else str(root/(".pi/agent-"+account)))
 def test_profile_id_selects_profile_and_exports_real_pi(self):
  with tempfile.TemporaryDirectory(prefix="account-profile-") as directory:
   root=pathlib.Path(directory);bin=root/"bin";bin.mkdir();(root/".pi/agent").mkdir(parents=True);log=root/"called"
   for name in ("pi-profile","pi-extension-deps-patch","pi-hermes-realpath-patch"):
    f=bin/name
    f.write_text("#!/bin/sh\nexit 0\n" if name.endswith("-patch") else "#!/bin/sh\nprintf '%s\\n' \"$@\" > "+str(log)+"\nprintf '%s' \"$PI_PROFILE_PI_BIN\" > "+str(root/"bin-used")+"\nprintf '%s' \"${PI_PROFILE_ID-unset}\" > "+str(root/"id-left")+"\n");f.chmod(0o755)
   env={"HOME":str(root),"PATH":str(bin)+":/usr/bin:/bin","PI_PROFILE_ID":"developer","PI_REAL_PI":"/real/pi"}
   result=subprocess.run(["bash",str(SCRIPT),"kuno","--model","a b"],env=env,capture_output=True,text=True)
   self.assertEqual(result.returncode,0,result.stderr)
   self.assertEqual(log.read_text().splitlines(),["launch","--profile","developer","--","--model","a b"])
   self.assertEqual((root/"bin-used").read_text(),"/real/pi")
   # 子の pi の環境に PI_PROFILE_ID を残さない（後で打つ pi-muu --session X が --profile を強制されないように）
   self.assertEqual((root/"id-left").read_text(),"unset")
 def test_profile_local_state_is_not_linked_or_warned(self):
  for account in ("muu","rbx"):
   with self.subTest(account=account), tempfile.TemporaryDirectory(prefix="account-state-") as directory:
    root=pathlib.Path(directory);bin=root/"bin";bin.mkdir();agent=root/".pi/agent";profile=root/(".pi/agent-"+account)
    local=("sessions","pi-subagents","missions","mcp-home","models-store.json","mcp-auth.json","cache")
    for base in (agent,profile):
     base.mkdir(parents=True)
     for name in local:(base/name).write_text("{}") if name.endswith(".json") else (base/name).mkdir()
    (agent/"settings.json").write_text("{}")
    for name in ("pi","pi-profile","pi-extension-deps-patch","pi-hermes-realpath-patch"):
     file=bin/name;file.write_text("#!/bin/sh\nexit 0\n");file.chmod(0o755)
    result=subprocess.run(["bash",str(SCRIPT),account],env={"HOME":str(root),"PATH":str(bin)+":/usr/bin:/bin"},capture_output=True,text=True)
    self.assertEqual(result.returncode,0,result.stderr)
    self.assertEqual(result.stderr,"")
    self.assertTrue((profile/"settings.json").is_symlink())
    for name in local:self.assertFalse((profile/name).is_symlink(),name)
   with self.subTest(account=account,fresh=True), tempfile.TemporaryDirectory(prefix="account-fresh-") as directory:
    root=pathlib.Path(directory);bin=root/"bin";bin.mkdir();agent=root/".pi/agent";(agent/"sessions").mkdir(parents=True);(agent/"settings.json").write_text("{}")
    for name in ("pi","pi-profile","pi-extension-deps-patch","pi-hermes-realpath-patch"):
     file=bin/name;file.write_text("#!/bin/sh\nexit 0\n");file.chmod(0o755)
    subprocess.run(["bash",str(SCRIPT),account],env={"HOME":str(root),"PATH":str(bin)+":/usr/bin:/bin"},check=True)
    self.assertFalse((root/(".pi/agent-"+account)/"sessions").exists())
if __name__=="__main__":unittest.main()
