# SDD ledger — plan: docs/superpowers/plans/2026-10-13-muxy2-herdr-startup.md

Spec: approved in conversation; no separate document.
Pre-flight: launcher path consumed by server.toml template; consistent.
Baseline: unittest discover tests — 29 passed.
RED: launcher tests — 5 failures, launcher missing.
Ruling: explicitly export SHELL=/opt/homebrew/bin/fish — Herdr uses SHELL for inner panes; avoids launching the wrapper recursively. Cost if wrong: changing this one line restores another desired inner shell.
Ruling: use absolute worktree paths for every edit and git -C for Git — session started in another repository; no edits to claude-workflows.

GREEN: launcher tests — 5 passed; full unittest suite — 34 passed. sh -n and git diff --check passed.
Preview: chezmoi changes only ~/.local/bin/muxy-herdr (0755) and Muxy 2/server.toml (0600); existing settings preserved.
