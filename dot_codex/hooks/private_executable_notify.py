#!/usr/bin/env python3
import json,os,sys,subprocess,shutil,time

LOG=os.path.expanduser("~/.codex/hooks/notify.log")

def message(event):
    return {"PermissionRequest": "Approval needed", "SubagentStop": "Background task completed", "Stop": "Task has finished"}.get(event)

def under_happy():
    # happy codex は承認依頼のプッシュを送らない (v1.2.4) ので、祖先に happy がいるときだけ補う
    pid=os.getppid()
    for _ in range(8):
        try:
            out=subprocess.run(["ps","-o","ppid=,args=","-p",str(pid)],capture_output=True,text=True,timeout=2).stdout.strip()
        except (OSError, subprocess.TimeoutExpired):
            return False
        if not out:
            return False
        ppid,_,args=out.partition(" ")
        if "bin/happy" in args or "node_modules/happy/" in args:
            return True
        if not ppid.strip().isdigit() or int(ppid)<=1:
            return False
        pid=int(ppid)
    return False

def duplicate(key,window=15):
    # 同じ承認依頼でフックが数回同時に発火するので、最初の 1 回だけ通す
    path=os.path.expanduser("~/.codex/hooks/.notify-last")
    try:
        fd=os.open(path+".lock",os.O_CREAT|os.O_EXCL|os.O_WRONLY)
    except FileExistsError:
        try:
            stale=time.time()-os.path.getmtime(path+".lock")>5
        except OSError:
            stale=False
        if not stale:
            return True
        try: os.unlink(path+".lock")
        except OSError: pass
        return True
    try:
        try:
            last_t,_,last_key=open(path).read().partition("\t")
            if last_key==key and time.time()-float(last_t)<window:
                return True
        except (OSError, ValueError):
            pass
        with open(path,"w") as f:
            f.write(f"{time.time()}\t{key}")
        return False
    finally:
        os.close(fd)
        try: os.unlink(path+".lock")
        except OSError: pass

def phone(data):
    tool_input=data.get("tool_input") or {}
    detail=tool_input.get("command") or data.get("tool_name") or ""
    if isinstance(detail,list):
        detail=" ".join(map(str,detail))
    # Happy 自身の MCP ツール (change_title 等) は Happy が自動承認するので通知しない
    if str(data.get("tool_name") or "").startswith("mcp__happy__"):
        return
    if duplicate(f"{data.get('cwd')}|{detail}"):
        return
    project=os.path.basename(data.get("cwd") or "")
    exe=shutil.which("happy") or "/opt/homebrew/bin/happy"
    try:
        # Popen: フックの timeout に掛からないよう送信完了を待たない
        subprocess.Popen([exe,"notify","-t",f"Codex 承認待ち: {project}","-p",str(detail)[:200] or "Approval needed"],
                         stdin=subprocess.DEVNULL,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,start_new_session=True)
    except OSError:
        pass

def main():
    data=json.load(sys.stdin)
    event=data.get("hook_event_name")
    text=message(event)
    exe=shutil.which("terminal-notifier") or "/opt/homebrew/bin/terminal-notifier"
    if text:
        try:
            subprocess.run([exe,"-title","Codex","-message",text,"-sound","Hero"],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,timeout=5)
        except (OSError, subprocess.TimeoutExpired):
            pass
    if event=="PermissionRequest":
        happy=under_happy()
        try:
            with open(LOG,"a") as f:
                f.write(f"{time.strftime('%F %T')} PermissionRequest happy={happy} tool={data.get('tool_name')}\n")
        except OSError:
            pass
        if happy:
            phone(data)
if __name__ == "__main__": main()
