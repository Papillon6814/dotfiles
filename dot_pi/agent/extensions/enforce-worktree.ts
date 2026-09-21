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
 * - Lazy activation: worktree resolution stays OFF until the agent calls
 *   `edit` or `write`. Until then, the agent operates in the main worktree.
 * - On first edit/write: auto-selects the most recently modified linked
 *   worktree, sets it as active, sets the session name to its branch, and
 *   from then on rewrites paths for edit/write/read/grep/find/ls and
 *   prepends `cd <worktree> &&` for bash.
 * - If no linked worktree exists when edit/write is called, blocks the call
 *   and prompts to create one.
 * - `/worktree switch` manually activates a specific worktree.
 */

import { execFileSync } from "node:child_process";
import { statSync } from "node:fs";
import { resolve, relative } from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { AssistantMessage } from "@earendil-works/pi-ai";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

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

// --- Footer helpers ---

function shortenPath(fullPath: string): string {
	const home = process.env.HOME || process.env.USERPROFILE || "";
	let short = fullPath;
	if (home && short.startsWith(home)) {
		short = "~" + short.slice(home.length);
	}
	const parts = short.split("/");
	if (parts.length > 4) {
		short = "…/" + parts.slice(parts.length - 3).join("/");
	}
	return short;
}

function formatTokens(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
	return String(n);
}

function computeSessionStats(ctx: ExtensionContext): { input: number; output: number; cost: number } {
	let input = 0;
	let output = 0;
	let cost = 0;
	for (const entry of ctx.sessionManager.getBranch()) {
		if (entry.type === "message" && entry.message.role === "assistant") {
			const m = entry.message as AssistantMessage;
			input += m.usage?.input ?? 0;
			output += m.usage?.output ?? 0;
			cost += m.usage?.cost?.total ?? 0;
		}
	}
	return { input, output, cost };
}

function buildBar(ratio: number, barWidth: number): string {
	const clamped = Math.max(0, Math.min(1, ratio));
	const filledCells = clamped * barWidth;
	const full = Math.floor(filledCells);
	const partialIdx = Math.floor((filledCells - full) * 8);
	const partials = [" ", "▏", "▎", "▍", "▌", "▋", "▊", "▉"];
	const empty = barWidth - full - (partialIdx > 0 ? 1 : 0);
	return "█".repeat(full) + (partialIdx > 0 ? partials[partialIdx] : "") + " ".repeat(Math.max(0, empty));
}

// --- Extension ---

export default function (pi: ExtensionAPI) {
	// Active worktree for the session. null = not yet activated (operate in main).
	let activeWorktree: WorktreeInfo | null = null;

	/** Returns the currently active worktree, or null if not yet activated. */
	function getActiveWorktree(): WorktreeInfo | null {
		// Verify cached worktree still exists on disk
		if (activeWorktree) {
			try {
				statSync(activeWorktree.path);
				return activeWorktree;
			} catch {
				activeWorktree = null;
			}
		}
		return activeWorktree;
	}

	/**
	 * Activate a worktree (auto-selects most recently modified if not specified).
	 * Side effect: sets session name to the worktree's branch.
	 * Returns the activated worktree, or null if none could be selected.
	 */
	function activateWorktree(cwd: string, override?: WorktreeInfo): WorktreeInfo | null {
		const chosen = override ?? selectBestWorktree(getLinkedWorktrees(cwd));
		if (!chosen) return null;
		activeWorktree = chosen;
		const branch = chosen.branch.replace(/^refs\/heads\//, "");
		if (branch) {
			pi.setSessionName(branch);
		}
		return activeWorktree;
	}

	function invalidateCache(): void {
		activeWorktree = null;
	}

	pi.on("session_start", async (_event, ctx) => {
		activeWorktree = null;

		// --- Custom footer: show main / active worktree ---
		if (!ctx.hasUI) return;

		ctx.ui.setFooter((tui, theme, footerData) => {
			const unsub = footerData.onBranchChange(() => tui.requestRender());

			return {
				dispose: unsub,
				invalidate() {},
				render(width: number): string[] {
					// --- Line 1: branch + CWD + statuses ---
					// Show active worktree if activated; otherwise show main cwd.
					const worktree = getActiveWorktree();
					const effectiveCwd = worktree?.path ?? ctx.cwd;
					const shortDir = shortenPath(effectiveCwd);
					const branch = worktree
						? worktree.branch.replace(/^refs\/heads\//, "")
						: footerData.getGitBranch();

					// Branch is the primary identity. Distinct color when a linked
					// worktree has been activated.
					const sessionPart = branch
						? (worktree
							? theme.fg("accent", `⏻ ${branch} `)
							: theme.fg("warning", `⏻ ${branch} `))
						: "";

					const cwdPart = worktree
						? theme.fg("success", `🌿 ${shortDir}`)
						: theme.fg("dim", shortDir);
					const line1Left = `${sessionPart}${cwdPart}`;

					// Extension statuses (right side of line 1)
					const statuses = footerData.getExtensionStatuses();
					const statusParts: string[] = [];
					for (const [, text] of statuses) {
						if (text) statusParts.push(text);
					}
					const statusStr = statusParts.length > 0 ? statusParts.join("  ") : "";
					const pad1 = " ".repeat(
						Math.max(2, width - visibleWidth(line1Left) - visibleWidth(statusStr)),
					);
					const line1 = truncateToWidth(line1Left + pad1 + statusStr, width);

					// --- Line 2: Context bar + tokens + cost + model ---
					const usage = ctx.getContextUsage();
					const contextWindow = usage?.contextWindow ?? ctx.model?.contextWindow ?? 0;
					const contextTokens = usage?.tokens ?? null;
					const contextPercent = usage?.percent ?? null;

					const BAR_WIDTH = 12;
					let barPart: string;
					if (contextTokens !== null && contextPercent !== null && contextWindow > 0) {
						const pct = contextPercent;
						const color: "success" | "warning" | "error" =
							pct > 80 ? "error" : pct > 60 ? "warning" : "success";
						const bar = buildBar(contextTokens / contextWindow, BAR_WIDTH);
						barPart = theme.fg(color, `[${bar}] ${pct.toFixed(0)}%`);
					} else {
						const bar = " ".repeat(BAR_WIDTH);
						barPart = theme.fg("dim", `[${bar}] ?`);
					}

					const stats = computeSessionStats(ctx);
					const tokenParts: string[] = [];
					if (stats.input) tokenParts.push(`↑${formatTokens(stats.input)}`);
					if (stats.output) tokenParts.push(`↓${formatTokens(stats.output)}`);
					if (stats.cost > 0) tokenParts.push(`$${stats.cost.toFixed(3)}`);
					const tokenStr = tokenParts.length > 0
						? theme.fg("dim", " ") + theme.fg("dim", tokenParts.join(" "))
						: "";

					const line2Left = barPart + tokenStr;

					const thinking = pi.getThinkingLevel();
					const modelId = ctx.model?.id ?? "no-model";
					const line2Right = theme.fg(
						"dim",
						thinking === "off" ? modelId : `${modelId} ${thinking}`,
					);

					const pad2 = " ".repeat(
						Math.max(2, width - visibleWidth(line2Left) - visibleWidth(line2Right)),
					);
					const line2 = truncateToWidth(line2Left + pad2 + line2Right, width);

					return [line1, line2];
				},
			};
		});
	});

	// Invalidate cache when a worktree is created via bash (so a freshly
	// created worktree can be picked up on the next edit/write).
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

		const isMutating = event.toolName === "edit" || event.toolName === "write";

		// On first edit/write, activate a worktree. This is the only event that
		// triggers auto-activation; read/grep/find/ls/bash never activate.
		if (isMutating && !getActiveWorktree()) {
			const activated = activateWorktree(ctx.cwd);
			if (!activated) {
				return { block: true, reason: NO_WORKTREE_REASON };
			}
		}

		const worktree = getActiveWorktree();
		if (!worktree) {
			// Not yet activated and tool is not mutating: operate in main worktree.
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

		const worktree = getActiveWorktree();

		if (worktree) {
			// Already activated (e.g. resumed session, or /worktree switch).
			return {
				systemPrompt:
					event.systemPrompt +
					`
## Auto Worktree Resolution (active)

You are in the **main worktree**, but file paths and commands are **automatically
resolved** to the linked worktree at:
  \`${worktree.path}\` (branch: ${worktree.branch})

You do **NOT** need to manually \`cd\` or use worktree-specific paths.
Just write paths as if you were in the main worktree — the extension handles
the redirection transparently.
`,
			};
		}

		// Not yet activated: operate in main worktree until edit/write triggers.
		const worktrees = getLinkedWorktrees(ctx.cwd);
		if (worktrees.length > 0) {
			const candidate = selectBestWorktree(worktrees)!;
			const candidateBranch = candidate.branch.replace(/^refs\/heads\//, "");
			return {
				systemPrompt:
					event.systemPrompt +
					`
## Auto Worktree Resolution (deferred)

You are in the **main worktree**. Read-only tools (read/grep/find/ls/bash) operate
here as-is.

The first time you call \`edit\` or \`write\`, the extension will automatically
activate the most recently modified linked worktree:
  \`${candidate.path}\` (branch: ${candidateBranch})

From that point on, all path-based tools and bash commands are transparently
redirected to that worktree. Use \`/worktree switch\` to pick a different one
before your first edit.
`,
			};
		}

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

			// If argument is "switch", show selector (manual activation)
			if (args?.trim() === "switch") {
				const active = getActiveWorktree();
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
						const chosen = activateWorktree(ctx.cwd, worktrees[idx]);
						if (chosen) {
							ctx.ui.notify(
								`Activated: ${chosen.branch} (${chosen.path})`,
								"info",
							);
						}
					}
				}
				return;
			}

			// Default: show status
			const active = getActiveWorktree();
			const lines = worktrees.map(
				(wt) =>
					`  ${wt.path === active?.path ? "→ " : "  "}${wt.branch} (${wt.path})`,
			);
			ctx.ui.notify(
				`Linked worktrees:\n${lines.join("\n")}\n\nActive: ${active ? `${active.branch} (${active.path})` : "none (will auto-activate on first edit/write)"}\n\nUse /worktree switch to change`,
				"info",
			);
		},
	});
}
