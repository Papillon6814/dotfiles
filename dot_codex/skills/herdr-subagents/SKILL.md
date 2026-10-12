---
name: herdr-subagents
description: Run delegated Codex agents as visible Herdr tabs, coordinate their work, and return their findings to the parent. Use while delegating from a Herdr-managed Codex session.
---

# Herdr subagents for Codex

When delegating from a Herdr-managed session, use one independent Codex CLI session in a separate Herdr tab for each child instead of a hidden native child thread. These are visible root sessions, not native Codex child threads. The parent must pass each child the task, relevant context, and role instructions, then read its result back from Herdr.

## Start children

1. Read the `herdr` skill and follow its session, focus, ID, approval, and safety rules. Continue only when `HERDR_ENV=1`; use the current `HERDR_WORKSPACE_ID` and working directory.
2. Check the installed `herdr` and `codex` help for current syntax. The Codex CLI currently has no root-session `--agent` selector, so a configured agent's behavior must be passed in its prompt.
3. For each child, create one tab in the current workspace and at the task's intended working directory. Use a clear role/task label and `--no-focus`. Keep the user's focus in the parent tab.
4. Check live agent names, then start a Codex agent in each returned root pane with a unique lowercase name. Pass the role's configured model when present. Use `--sandbox read-only` for reviews and research; for an authorized editing task, use only the sandbox level required by that task. For Git code changes, follow the active Git workflow and give each writable child its own required worktree. Never bypass approvals or sandboxing.
5. When a child corresponds to a configured agent in `~/.codex/agents/*.toml`, read that file and include its `developer_instructions` in the child's first prompt. Include the complete task and any conversation-only context the child needs; a new root session does not inherit the parent's conversation or tool results.
6. Start independent children before waiting so their work can proceed concurrently. Submit each task through `herdr agent prompt`, then use `herdr agent wait` and `herdr agent read` to collect its actual response. A submitted prompt alone is not evidence that the child completed the task.
7. If the assignment calls for discussion or cross-review, give each child the other's first-round findings and ask for one focused reconsideration. Read both second-round responses and synthesize agreement, disagreement, and evidence in the parent.

## Return results and leave the work visible

- Return a concise synthesis to the parent, with each child's key findings and relevant source paths. The Herdr transcript is the result channel; read it explicitly before reporting completion.
- Leave created tabs open so the user can inspect progress and continue talking to each Codex session. If the user interacts with a child after you read it, read the pane again before incorporating that follow-up.
- Herdr does not transfer the native child-thread history or automatically notify the parent of later user messages. Treat each child as an independent session.

## When the workflow cannot start

- If `HERDR_ENV` is not `1`, do not call Herdr control commands. For ordinary delegation, use native Codex subagents. If the user specifically requires visible Herdr tabs, explain that this Codex session must be opened from Herdr first.
- If Herdr reports a child blocked on a question or approval, inspect its prompt and output, then ask the user before answering. Do not bypass the prompt or blindly resend a task after a timeout.
- If a tab or agent cannot be created, inspect current state before retrying. Report the limitation and use native subagents only when that still meets the user's request.
