import unittest, tempfile, pathlib, subprocess, os, json
SCRIPT=pathlib.Path(__file__).resolve().parents[1]/"dot_claude/hooks/executable_cleanup-merged-worktrees.sh"
def git(*a,cwd):return subprocess.run(["git",*a],cwd=cwd,check=True,capture_output=True,text=True).stdout.strip()
class Cleanup(unittest.TestCase):
 def setUp(self):
  self.t=tempfile.TemporaryDirectory(prefix="wt-cleanup-");self.root=pathlib.Path(self.t.name).resolve()
  self.repo=self.root/"repo";self.repo.mkdir()
  git("init","-q","-b","main",cwd=self.repo);git("config","user.email","t@t",cwd=self.repo);git("config","user.name","t",cwd=self.repo)
  (self.repo/".gitignore").write_text("node_modules/\n.env\n.claude/\n.pi/\n.superpowers/\n.scaffold-logs/\ntarget/\ngen/\nartifacts/\nkeep.db\n");git("add",".",cwd=self.repo);git("commit","-qm","init",cwd=self.repo)
  self.lsof=self.root/"cwds";self.lsof.write_text("")
 def tearDown(self):self.t.cleanup()
 def wt(self,name,commit=True,merge=True,base=".claude/worktrees"):
  path=(self.repo/base/name).resolve();git("worktree","add","-q","-b",name,str(path),cwd=self.repo)
  if commit:(path/f"{name}.txt").write_text("x");git("add",f"{name}.txt",cwd=path);git("commit","-qm",name,cwd=path)
  if merge:git("merge","-q","--no-ff","-m","m",name,cwd=self.repo)
  return path
 def run_(self,*args,stdin=None):
  env={**os.environ,"HOME":str(self.root),"CLEANUP_WT_LSOF_CMD":"cat "+str(self.lsof)}
  return subprocess.run(["bash",str(SCRIPT),*args],env=env,input=stdin,capture_output=True,text=True,cwd=self.root)
 def branches(self):return git("branch","--format=%(refname:short)",cwd=self.repo).split()
 def test_removes_merged_clean_worktree_and_branch(self):
  p=self.wt("feat-a");r=self.run_(str(self.repo))
  self.assertEqual(r.returncode,0,r.stderr);self.assertFalse(p.exists());self.assertNotIn("feat-a",self.branches());self.assertIn("removed:",r.stdout)
 def test_dry_run_keeps_everything(self):
  p=self.wt("feat-a");r=self.run_("--dry-run",str(self.repo))
  self.assertTrue(p.exists());self.assertIn("feat-a",self.branches());self.assertIn("feat-a",r.stdout)
 def test_keeps_unmerged(self):
  p=self.wt("feat-a",merge=False);self.run_(str(self.repo));self.assertTrue(p.exists());self.assertIn("feat-a",self.branches())
 def test_keeps_fresh_worktree_without_commits(self):
  p=self.wt("fresh",commit=False,merge=False);(self.repo/"m.txt").write_text("m");git("add","m.txt",cwd=self.repo);git("commit","-qm","m",cwd=self.repo)
  self.run_(str(self.repo));self.assertTrue(p.exists())
 def test_keeps_dirty(self):
  p=self.wt("feat-a");(p/"new.txt").write_text("x");self.run_(str(self.repo));self.assertTrue(p.exists())
 def test_keeps_valuable_ignored_but_not_node_modules(self):
  p=self.wt("env");(p/".env").write_text("SECRET=1");q=self.wt("nm");(q/"node_modules").mkdir();(q/"node_modules/a.js").write_text("")
  self.run_(str(self.repo));self.assertTrue(p.exists());self.assertFalse(q.exists())
 def test_removes_agent_logs_build_and_test_outputs(self):
  p=self.wt("logs")
  for f in [".pi/loops/a.json",".superpowers/sdd/plan.md",".scaffold-logs/a.log","target/debug/app","src-tauri/gen/schema.json","e2e/artifacts/shot.png"]:
   (p/f).parent.mkdir(parents=True,exist_ok=True);(p/f).write_text("x")
  self.run_(str(self.repo));self.assertFalse(p.exists())
 def test_keeps_other_ignored_files_next_to_logs(self):
  p=self.wt("db");(p/".pi").mkdir();(p/".pi/a").write_text("x");(p/"keep.db").write_text("x")
  self.run_(str(self.repo));self.assertTrue(p.exists())
 def detached(self,name,extra_commit=False):
  path=(self.repo/".claude/worktrees"/name).resolve();git("worktree","add","-q","--detach",str(path),"main",cwd=self.repo)
  if extra_commit:(path/"t.txt").write_text("x");git("add","t.txt",cwd=path);git("commit","-qm","t",cwd=path)
  return path
 def test_removes_detached_worktree_inside_main(self):
  p=self.detached("verify");r=self.run_(str(self.repo));self.assertFalse(p.exists());self.assertIn("removed:",r.stdout)
 def test_keeps_detached_worktree_with_unmerged_commits(self):
  p=self.detached("verify",extra_commit=True);self.run_(str(self.repo));self.assertTrue(p.exists())
 def test_keeps_dirty_detached_worktree(self):
  p=self.detached("verify");(p/"new.txt").write_text("x");self.run_(str(self.repo));self.assertTrue(p.exists())
 def test_keeps_in_use(self):
  p=self.wt("feat-a");self.lsof.write_text("p1\nn"+str(p)+"/sub\n");self.run_(str(self.repo));self.assertTrue(p.exists())
 def test_keeps_unmanaged_location(self):
  p=self.wt("feat-a",base="../elsewhere");self.run_(str(self.repo));self.assertTrue(p.exists())
 def test_runs_from_inside_a_worktree(self):
  p=self.wt("feat-a");q=self.wt("feat-b",merge=False);self.run_(str(q));self.assertFalse(p.exists());self.assertTrue(q.exists())
 def test_from_command_ignores_non_merge(self):
  p=self.wt("feat-a");self.run_("--from-command","git status",str(self.repo));self.assertTrue(p.exists())
 def test_from_command_merge_with_dash_C(self):
  p=self.wt("feat-a");self.run_("--from-command",f"git -C {self.repo} merge --no-ff feat-a",str(self.root));self.assertFalse(p.exists())
 def test_from_command_merge_with_cd_prefix(self):
  p=self.wt("feat-a");self.run_("--from-command",f"cd {self.repo} && git merge --no-ff feat-a",str(self.root));self.assertFalse(p.exists())
 def test_claude_post_tool_use_json(self):
  self.wt("feat-a");r=self.run_("--claude-post-tool-use",stdin=json.dumps({"cwd":str(self.repo),"tool_input":{"command":"git merge --no-ff feat-a"}}))
  out=json.loads(r.stdout);self.assertEqual(out["hookSpecificOutput"]["hookEventName"],"PostToolUse");self.assertIn("feat-a",out["hookSpecificOutput"]["additionalContext"])
 def test_claude_post_tool_use_non_merge_is_silent(self):
  self.wt("feat-a");r=self.run_("--claude-post-tool-use",stdin=json.dumps({"cwd":str(self.repo),"tool_input":{"command":"git log"}}))
  self.assertEqual((r.returncode,r.stdout),(0,""))
 def test_outside_git_is_silent(self):
  r=self.run_(str(self.root));self.assertEqual((r.returncode,r.stdout),(0,""))
if __name__=="__main__":unittest.main()
