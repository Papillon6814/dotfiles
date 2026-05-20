/**
 * Context Meter Extension
 *
 * 2-line footer:
 *   Line 1: Session name + git branch
 *   Line 2: Context usage bar (with plan mode icon) + model info
 *
 * The context bar changes color based on usage and switches
 * between ✏️ (normal) and 🗺️ (plan mode) icons.
 */

import type { AssistantMessage } from "@mariozechner/pi-ai";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@mariozechner/pi-tui";

export default function (pi: ExtensionAPI) {
	pi.on("session_start", async (_event, ctx) => {
		ctx.ui.setFooter((tui, theme, footerData) => {
			const unsubBranch = footerData.onBranchChange(() => tui.requestRender());

			return {
				dispose: unsubBranch,
				invalidate() {},
				render(width: number): string[] {
					// ── Line 1: Session name + git branch + extension statuses ──
					const sessionName = pi.getSessionName();
					const namePart = sessionName
						? theme.fg("accent", `⏻ ${sessionName}`)
						: theme.fg("dim", "⏻ unnamed session");
					const branch = footerData.getGitBranch();
					const branchPart = branch ? theme.fg("dim", `  ${branch}`) : "";

					// Extension statuses (exclude plan mode indicator since we use icon)
					const extensionStatuses = footerData.getExtensionStatuses();
					const isPlanMode = Array.from(extensionStatuses.values()).some((s) => s.includes("planning"));
					const statusParts = Array.from(extensionStatuses.entries())
						.filter(([, s]) => !s.includes("planning"))
						.map(([, s]) => s);
					const statusPart =
						statusParts.length > 0 ? theme.fg("dim", `  ${statusParts.join("  ")}`) : "";

					const line1Left = namePart + branchPart + statusPart;
					const line1 = truncateToWidth(line1Left, width);

					// ── Line 2: Context bar + model ──
					const usage = ctx.getContextUsage();
					const contextWindow = usage?.contextWindow ?? ctx.model?.contextWindow ?? 0;
					const contextTokens = usage?.tokens ?? null;
					const contextPercent = usage?.percent ?? null;

					// Token stats from session
					let totalInput = 0;
					let totalOutput = 0;
					let totalCost = 0;
					for (const e of ctx.sessionManager.getEntries()) {
						if (e.type === "message" && e.message.role === "assistant") {
							const m = e.message as AssistantMessage;
							totalInput += m.usage.input;
							totalOutput += m.usage.output;
							totalCost += m.usage.cost.total;
						}
					}

					const fmt = (n: number) => (n < 1000 ? `${n}` : `${(n / 1000).toFixed(1)}k`);

					// Build the context usage bar
					const barWidth = 14;
					const buildBar = (ratio: number) => {
						const clamped = Math.max(0, Math.min(1, ratio));
						const filledCells = clamped * barWidth;
						const full = Math.floor(filledCells);
						const partialIdx = Math.floor((filledCells - full) * 8);
						const partials = [" ", "▏", "▎", "▍", "▌", "▋", "▊", "▉"];
						const empty = barWidth - full - (partialIdx > 0 ? 1 : 0);
						return (
							"█".repeat(full) +
							(partialIdx > 0 ? partials[partialIdx] : "") +
							" ".repeat(Math.max(0, empty))
						);
					};

					// Plan mode icon
					const contextIcon = isPlanMode ? "🗺️" : "✏️";

					let left: string;
					if (contextTokens === null || contextPercent === null || contextWindow === 0) {
						const bar = " ".repeat(barWidth);
						left = theme.fg("dim", `${contextIcon} [${bar}] ?/${fmt(contextWindow)}`);
					} else {
						const percent = contextPercent;
						const percentage = percent.toFixed(1);

						// Color based on usage
						let color: "success" | "warning" | "error" = "success";
						if (percent > 80) color = "error";
						else if (percent > 60) color = "warning";

						const bar = buildBar(contextTokens / contextWindow);
						left = theme.fg(color, `${contextIcon} [${bar}] ${percentage}%/${fmt(contextWindow)}`);
					}

					// Token stats
					const tokenParts: string[] = [];
					if (totalInput) tokenParts.push(`↑${fmt(totalInput)}`);
					if (totalOutput) tokenParts.push(`↓${fmt(totalOutput)}`);
					if (totalCost) tokenParts.push(`$${totalCost.toFixed(3)}`);
					const tokenStr = tokenParts.length > 0 ? theme.fg("dim", tokenParts.join(" ")) : "";

					// Right side: model name
					const modelId = ctx.model?.id ?? "no-model";
					const right = theme.fg("dim", modelId);

					// Layout: left [center tokens] ... right
					const leftWidth = visibleWidth(left);
					const rightWidth = visibleWidth(right);
					const minPadding = 2;

					// Try: left + tokens + padding + right
					const center = tokenStr ? `  ${tokenStr}` : "";
					const centerWidth = visibleWidth(center);
					const totalNeeded = leftWidth + centerWidth + minPadding + rightWidth;

					let line2: string;
					if (totalNeeded <= width) {
						const padding = " ".repeat(width - leftWidth - centerWidth - rightWidth);
						line2 = truncateToWidth(left + center + padding + right, width);
					} else {
						// Drop tokens, try left + right
						const lrNeeded = leftWidth + minPadding + rightWidth;
						if (lrNeeded <= width) {
							const padding = " ".repeat(width - leftWidth - rightWidth);
							line2 = truncateToWidth(left + padding + right, width);
						} else {
							// Truncate right
							const maxRight = Math.max(10, width - leftWidth - minPadding);
							const truncatedRight = truncateToWidth(right, maxRight, "");
							const padding = " ".repeat(
								Math.max(1, width - leftWidth - visibleWidth(truncatedRight)),
							);
							line2 = truncateToWidth(left + padding + truncatedRight, width);
						}
					}

					return [line1, line2];
				},
			};
		});
	});
}
