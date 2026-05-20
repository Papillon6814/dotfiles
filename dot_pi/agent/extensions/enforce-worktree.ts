/**
 * Auto Worktree Extension
 *
 * When the agent is in the main worktree of a git repository, automatically
 * resolves file paths and working directories to a linked worktree.
 *
 * Instead of blocking edit/write like the old enforce-worktree extension,
 * this extension transparently redirects operations so the agent can work
 * naturally without manually managing worktree paths.
 *
 * Behavior:
 * - edit/write/read: rewrites `path` from main worktree root to linked worktree root
 * - grep/find/ls: rewrites `path` parameter; defaults to worktree root if omitted
 * - bash: prepends `cd <worktree> &&`
 * - If no linked worktree exists, blocks edit/write and prompts to create one
 * - Auto-selects the most recently modified linked worktree
 * - `/worktree` command to show status and switch worktrees
 */

import { execFileSync } from "node:child_process";
import { statSync } from "node:fs";
import { resolve, relative } from "node:path";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

// --- Git helpers ---

function tryGit(args: string[], cwd: string): string | null {
	try {
		return execFileSync("git", args, {
			cwd,
			encoding: "utf-8",
			stdio: ["ignore", "pipe", "ignore"],
		}).trim();
	} catch {
		return null;
	}
}

function isInMainWorktree(cwd: string): boolean {
	const gitDir = tryGit(["rev-parse", "--path-format=absolute", "--git-dir"], cwd);
	if (!gitDir) return false;
	const commonDir = tryGit(["rev-parse", "--path-format=absolute", "--git-common-dir"], cwd);
	if (!commonDir) return false;
	return gitDir === commonDir;
}

function getMainWorktreeRoot(cwd: string): string | null {
	return tryGit(["rev-parse", "--show-toplevel"], cwd);
}

interface WorktreeInfo {
	path: string;
	branch: string;
}

function getLinkedWorktrees(cwd: string): WorktreeInfo[] {
	const output = tryGit(["worktree", "list", "--porcelain"], cwd);
	if (!output) return [];

	const mainRoot = getMainWorktreeRoot(cwd);
	const worktrees: WorktreeInfo[] = [];
	let currentPath = "";
	let currentBranch = "";

	for (const line of output.split("\n")) {
		if (line.startsWith("worktree ")) {
			currentPath = line.slice("worktree ".length);
		} else if (line.startsWith("branch ")) {
			currentBranch = line.slice("branch ".length);
		} else if (line === "" && currentPath) {
			if (currentPath !== mainRoot) {
				worktrees.push({ path: currentPath, branch: currentBranch });
			}
			currentPath = "";
			currentBranch = "";
		}
	}
	// Handle last entry (no trailing newline)
	if (currentPath && currentPath !== mainRoot) {
		worktrees.push({ path: currentPath, branch: currentBranch });
	}

	return worktrees;
}

function selectBestWorktree(worktrees: WorktreeInfo[]): WorktreeInfo | null {
	if (worktrees.length === 0) return null;
	if (worktrees.length === 1) return worktrees[0];

	// Select the most recently modified worktree (by mtime of the worktree dir)
	return worktrees.reduce((best, wt) => {
		try {
			const bestMtime = statSync(best.path).mtimeMs;
			const wtMtime = statSync(wt.path).mtimeMs;
			return wtMtime > bestMtime ? wt : best;
		} catch {
			return best;
		}
	});
}

// --- Path rewriting ---

function rewritePath(originalPath: string, mainRoot: string, worktreeRoot: string): string {
	const absolutePath = resolve(originalPath);

	// Already under the worktree root — no rewrite needed
	const relToWorktree = relative(worktreeRoot, absolutePath);
	if (!relToWorktree.startsWith("..") && relToWorktree !== "") return originalPath;

	// Compute relative path from main root
	const rel = relative(mainRoot, absolutePath);

	// Not under the main worktree — don't rewrite (e.g. ~/.pi/agent/...)
	if (rel.startsWith("..")) return originalPath;

	return resolve(worktreeRoot, rel);
}

// --- Messages ---

const NO_WORKTREE_REASON =
	"コード編集には linked worktree が必要ですが、存在しません。\n" +
	"手順:\n" +
	"  `git worktree add <path> -b <branch>` で worktree を作成してください。\n" +
	"  作成後、自動的にリダイレクトが有効になります。";

// --- Extension ---

export default function (pi: ExtensionAPI) {
	// Cache the active worktree for the session
	let cachedWorktree: WorktreeInfo | null = null;

	function getActiveWorktree(cwd: string): WorktreeInfo | null {
		// Verify cached worktree still exists
		if (cachedWorktree) {
			try {
				statSync(cachedWorktree.path);
				return cachedWorktree;
			} catch {
				cachedWorktree = null;
			}
		}

		const worktrees = getLinkedWorktrees(cwd);
		cachedWorktree = selectBestWorktree(worktrees);
		return cachedWorktree;
	}

	function invalidateCache(): void {
		cachedWorktree = null;
	}

	pi.on("session_start", async () => {
		cachedWorktree = null;
	});

	// Invalidate cache when a worktree is created via bash
	pi.on("tool_result", async (event) => {
		if (event.toolName !== "bash") return;
		const input = event.input as { command?: string };
		if (input.command?.includes("git worktree add")) {
			invalidateCache();
		}
	});

	// --- Tool call interception ---

	pi.on("tool_call", async (event, ctx) => {
		if (!isInMainWorktree(ctx.cwd)) return;

		const worktree = getActiveWorktree(ctx.cwd);

		// No linked worktree: block mutation tools only
		if (!worktree) {
			if (event.toolName === "edit" || event.toolName === "write") {
				return { block: true, reason: NO_WORKTREE_REASON };
			}
			return;
		}

		const mainRoot = getMainWorktreeRoot(ctx.cwd)!;

		// --- Path-based tools: rewrite path ---
		if (event.toolName === "edit" || event.toolName === "write" || event.toolName === "read") {
			const input = event.input as { path: string };
			input.path = rewritePath(input.path, mainRoot, worktree.path);
		}

		if (event.toolName === "grep" || event.toolName === "find" || event.toolName === "ls") {
			const input = event.input as { path?: string };
			if (input.path) {
				input.path = rewritePath(input.path, mainRoot, worktree.path);
			} else {
				// No path specified = defaults to cwd (main worktree)
				// Redirect to worktree root explicitly
				input.path = worktree.path;
			}
		}

		// --- Bash: prepend cd ---
		if (event.toolName === "bash") {
			const input = event.input as { command: string };
			input.command = `cd ${worktree.path} && ${input.command}`;
		}
	});

	// --- System prompt hint ---

	pi.on("before_agent_start", async (event, ctx) => {
		if (!isInMainWorktree(ctx.cwd)) return;

		const worktree = getActiveWorktree(ctx.cwd);

		if (worktree) {
			return {
				systemPrompt:
					event.systemPrompt +
					`
## Auto Worktree Resolution

You are in the **main worktree**, but file paths and commands are **automatically
resolved** to the linked worktree at:
  \`${worktree.path}\` (branch: ${worktree.branch})

You do **NOT** need to manually \`cd\` or use worktree-specific paths.
Just write paths as if you were in the main worktree — the extension handles
the redirection transparently.
`,
			};
		} else {
			return {
				systemPrompt:
					event.systemPrompt +
					`
## Worktree Required

You are in the **main worktree** and no linked worktree exists.
**edit** and **write** are blocked until you create one:

  \`git worktree add <path> -b <branch>\`

After creation, paths are automatically redirected — no manual \`cd\` needed.
`,
			};
		}
	});

	// --- /worktree command ---

	pi.registerCommand("worktree", {
		description: "Show worktree status or switch active worktree",
		async handler(args, ctx) {
			const worktrees = getLinkedWorktrees(ctx.cwd);

			if (worktrees.length === 0) {
				ctx.ui.notify(
					"No linked worktrees found. Create one with: git worktree add <path> -b <branch>",
					"warning",
				);
				return;
			}

			// If argument is "switch", show selector
			if (args?.trim() === "switch") {
				const active = getActiveWorktree(ctx.cwd);
				const options = worktrees.map((wt) => ({
					value: wt.path,
					label: `${wt.branch} (${wt.path})${wt.path === active?.path ? " ← active" : ""}`,
				}));
				const selected = await ctx.ui.select(
					"Select worktree:",
					options.map((o) => o.label),
				);
				if (selected) {
					const idx = options.findIndex((o) => o.label === selected);
					if (idx >= 0) {
						cachedWorktree = worktrees[idx];
						ctx.ui.notify(
							`Switched to: ${cachedWorktree!.branch} (${cachedWorktree!.path})`,
							"info",
						);
					}
				}
				return;
			}

			// Default: show status
			const active = getActiveWorktree(ctx.cwd);
			const lines = worktrees.map(
				(wt) =>
					`  ${wt.path === active?.path ? "→ " : "  "}${wt.branch} (${wt.path})`,
			);
			ctx.ui.notify(
				`Linked worktrees:\n${lines.join("\n")}\n\nActive: ${active ? `${active.branch} (${active.path})` : "none"}\n\nUse /worktree switch to change`,
				"info",
			);
		},
	});
}
