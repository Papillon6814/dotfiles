/**
 * Custom footer with session name and stats.
 *
 * Replaces the default footer with a 2-line layout:
 *   Line 1: Session name + git branch + extension statuses
 *   Line 2: Token stats + cost + model name
 *
 * MBDTF theme-aware: uses gold/cream/bronze for proper contrast
 * against obsidian background.
 */

import type { AssistantMessage } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

export default function (pi: ExtensionAPI) {
	pi.on("session_start", async (_event, ctx) => {
		// Automatically set session name to git branch name if not already set
		if (!ctx.sessionManager.getSessionName()) {
			const branch = ctx.sessionManager.getCwd();
			// Get git branch from cwd (this is a sync call in the context)
			try {
				const { execSync } = await import("child_process");
				const branch = execSync("git rev-parse --abbrev-ref HEAD", {
					cwd: ctx.sessionManager.getCwd(),
					encoding: "utf-8",
					timeout: 5000,
				}).trim();
				if (branch && branch !== "HEAD") {
					ctx.sessionManager.appendSessionInfo(branch);
				}
			} catch {
				// Not in a git repo or git command failed, ignore
			}
		}

		ctx.ui.setFooter((tui, theme, footerData) => {
			const unsub = footerData.onBranchChange(() => tui.requestRender());

			return {
				dispose: unsub,
				invalidate() {},
				render(width: number): string[] {
					// --- Token stats from session branch ---
					let input = 0;
					let output = 0;
					let cost = 0;
					for (const e of ctx.sessionManager.getBranch()) {
						if (e.type === "message" && e.message.role === "assistant") {
							const m = e.message as AssistantMessage;
							input += m.usage.input;
							output += m.usage.output;
							cost += m.usage.cost.total;
						}
					}

					// --- Line 1: Session name + git branch + extension statuses ---
					const sessionName = ctx.sessionManager.getSessionName();
					const namePart = sessionName
						? theme.fg("accent", `⏻ ${sessionName}`)
						: theme.fg("muted", "⏻ unnamed");
					const branch = footerData.getGitBranch();
					const branchPart = branch ? theme.fg("muted", `  ${branch}`) : "";
					const line1Left = namePart + branchPart;

					// Extension statuses on the right
					const statuses = footerData.getExtensionStatuses();
					let statusStr = "";
					for (const [, text] of statuses) {
						if (text) statusStr += " " + text;
					}
					const pad1 = " ".repeat(
						Math.max(1, width - visibleWidth(line1Left) - visibleWidth(statusStr)),
					);
					const line1 = truncateToWidth(line1Left + pad1 + statusStr, width);

					// --- Line 2: Token stats + cost + model ---
					const fmt = (n: number) => (n < 1000 ? `${n}` : `${(n / 1000).toFixed(1)}k`);
					const left =
						theme.fg("muted", "↑") +
						theme.fg("text", fmt(input)) +
						theme.fg("muted", " ↓") +
						theme.fg("text", fmt(output)) +
						theme.fg("muted", " ") +
						theme.fg("accent", `$${cost.toFixed(3)}`);
					const modelId = ctx.model?.id ?? "no-model";
					const right = theme.fg("muted", modelId);
					const pad2 = " ".repeat(
						Math.max(1, width - visibleWidth(left) - visibleWidth(right)),
					);
					const line2 = truncateToWidth(left + pad2 + right, width);

					return [line1, line2];
				},
			};
		});
	});
}
