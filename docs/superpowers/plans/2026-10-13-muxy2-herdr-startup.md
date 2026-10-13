# Muxy 2 Herdr Startup Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans. Direct implementation approved by the user.

**Goal:** New Muxy terminals attach to folder-specific Herdr sessions without stopping existing terminals.
**Architecture:** Muxy 2 default_shell invokes ~/.local/bin/muxy-herdr. The launcher executes ~/.local/bin/herdr with the working folder name; firstmate uses the default session. Herdr's inner shell remains /opt/homebrew/bin/fish.
**Tech Stack:** POSIX shell, Python unittest, chezmoi, Muxy 2 CLI.
**Spec:** Approved in conversation; no separate spec file.

## Global Constraints
- Work in the dotfiles fix/muxy2-herdr-startup worktree.
- No server restart, existing-session termination, unrelated configuration application or push.
- Preserve history_budget_bytes=16777216 and shell_integration=true.

## Review Focus
- Shell recursion if Herdr inherits the launcher as SHELL.
- Login arguments must not be forwarded to Herdr.
- Working directories and spaces must not split session arguments.
- Wrapper executable permissions and chezmoi home-path rendering.
- Newly spawned Muxy terminal must actually run the launcher; existing sessions must remain alive.

## Task 1: Launcher and Muxy 2 configuration
- [x] Run baseline: PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s tests -v (29 tests).
- [x] Add tests/test_muxy_herdr_launcher.py; verify RED for missing launcher (5 failures).
- [x] Add dot_local/bin/executable_muxy-herdr; verify GREEN.
- [x] Add private_Library/private_Application Support/private_Muxy 2/private_server.toml.tmpl with home-relative launcher path.
- [x] Update README.md with Muxy 2 usage and rollback: muxy settings set default-shell default.
- [x] Run full unittest suite, shell syntax check, chezmoi target preview and git diff --check.
- [ ] Fresh-context read-only whole-change review; address substantive findings.
- [ ] Apply only launcher and server.toml from this worktree; update running default-shell through muxy settings set.
- [ ] Create one new terminal for claude-workflows, verify Herdr process/screen without controlling Herdr from outside. Leave the verified terminal available to the user.
- [ ] Record verification and report worktree persistence / unmerged status honestly.
