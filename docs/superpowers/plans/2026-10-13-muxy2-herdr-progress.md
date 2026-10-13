# SDD ledger — plan: docs/superpowers/plans/2026-10-13-muxy2-herdr-startup.md

Spec: approved in conversation; no separate document.
Pre-flight: launcher path consumed by server.toml template; consistent.
Baseline: unittest discover tests — 29 passed.
RED: launcher tests — 5 failures, launcher missing.
Ruling: explicitly export SHELL=/opt/homebrew/bin/fish — Herdr uses SHELL for inner panes; avoids launching the wrapper recursively. Cost if wrong: changing this one line restores another desired inner shell.
Ruling: use absolute worktree paths for every edit and git -C for Git — session started in another repository; no edits to claude-workflows.

GREEN: launcher tests — 5 passed; full unittest suite — 34 passed. sh -n and git diff --check passed.
Preview: chezmoi changes only ~/.local/bin/muxy-herdr (0755) and Muxy 2/server.toml (0600); existing settings preserved.

Review: fresh reviewer run 777b03e5-5074-4466-b8d5-1913cf4fe82c, no Critical or Important findings. Report /tmp/muxy2-herdr-startup-review.md.
Final: minor (deferred): unit tests invoke /bin/sh and do not independently detect missing executable bits. Git mode 100755, installed launcher 0755 and real Muxy launch verified instead.
Applied only launcher and server.toml; backup /tmp/muxy2-herdr-backup.xYPVkO/server.toml. Running default_shell set via muxy settings set, no restart.
E2E: new Muxy session 6274160559427404517 is Live; screen shows Herdr spaces/agents UI and claude-workflows develop fish prompt.
Process trace: muxy-server PID 8545 -> herdr --session claude-workflows PID 49574 -> herdr server PID 49603 -> fish PID 49612.
Preservation: original sessions 8145679877248464516, 18191871728603012670, 710519972837355008 remain Live and attached. Existing muxy-server and pi PIDs unchanged.
Targeted chezmoi diff is empty; unrelated dotfiles edits not applied. New test session remains detached and available under Existing Terminals.
Task 1: functional implementation and live validation complete; local main integration awaits owner decision. No push performed.
