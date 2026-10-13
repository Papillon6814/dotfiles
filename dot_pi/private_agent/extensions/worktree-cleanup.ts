/**
 * Worktree Cleanup Extension
 *
 * Removes merged, clean and unused linked worktrees (and their branches)
 * via ~/.claude/hooks/cleanup-merged-worktrees.sh, shared with Claude Code.
 *
 * Behavior:
 * - After a successful bash call that runs `git merge`, cleans up that
 *   repository and appends what was removed to the tool result.
 * - On quit, sweeps the repository of the session's cwd.
 */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const SCRIPT = join(homedir(), ".claude/hooks/cleanup-merged-worktrees.sh");

function runCleanup(args: string[], cwd: string): string {
	if (!existsSync(SCRIPT)) return "";
	try {
		return execFileSync("bash", [SCRIPT, ...args], {
			cwd,
			encoding: "utf-8",
			timeout: 30_000,
			stdio: ["ignore", "pipe", "ignore"],
		}).trim();
	} catch {
		return "";
	}
}

export default function (pi: ExtensionAPI) {
	pi.on("tool_result", async (event, ctx) => {
		if (event.toolName !== "bash" || event.isError) return;
		const command = String(event.input.command ?? "");
		if (!/\bgit\b[^;&|]*\bmerge\b/.test(command)) return;
		const out = runCleanup(["--from-command", command, ctx.cwd], ctx.cwd);
		if (!out) return;
		return {
			content: [...event.content, { type: "text" as const, text: `\n[worktree-cleanup]\n${out}` }],
		};
	});

	pi.on("session_shutdown", async (event, ctx) => {
		if (event.reason !== "quit") return;
		runCleanup([ctx.cwd], ctx.cwd);
	});
}
