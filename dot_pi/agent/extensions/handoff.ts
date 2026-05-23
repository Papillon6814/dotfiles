/**
 * Handoff Extension for pi
 *
 * Transfers context to a new focused session via goal-driven extraction.
 * Appends a persistent record to `.pi/handoff/HANDOFF.md` in the current project.
 *
 * Why extraction over compaction:
 *   Compaction = LLM summarizes everything (lossy, recursive decay, WHY evaporates)
 *   Extraction = goal-directed selection (surgical, structured, preserves specifics)
 *
 * Design credits:
 *   - default-anton/pi-handoff      → proven /handoff command flow
 *   - @ssweens/pi-handoff           → session_before_compact hook, buildSessionContext safety
 *   - thepushkarp/handoff           → HANDOFF.md append-log format
 *   - jayshah5696/pi-agent-extensions → goal-driven extraction, git metadata
 *
 * Entry points:
 *   1. /handoff <goal>           — user-initiated
 *   2. session_before_compact    — offered automatically when context fills up
 *
 * Both paths:
 *   a. Extract goal-relevant context via LLM
 *   b. Append timestamped entry to .pi/handoff/HANDOFF.md
 *   c. Spawn new session with briefing preloaded in editor
 */

import { appendFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";
import { complete, type Message } from "@mariozechner/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import {
	BorderedLoader,
	buildSessionContext,
	convertToLlm,
	serializeConversation,
} from "@mariozechner/pi-coding-agent";

// ============================================================================
// Extraction prompt — goal-driven, structured
// ============================================================================

const EXTRACTION_SYSTEM_PROMPT = `You are a context transfer assistant. Read the conversation and produce a structured handoff note for the stated goal. The new session must be able to proceed WITHOUT access to this conversation.

Do NOT continue the conversation. Do NOT answer questions from history. ONLY output the structured handoff.

Use this EXACT format:

## Goal
[Restate the user's goal for the new session in 1-2 sentences.]

## Current State
[What is done, what is in progress, what works. Be specific.]

## Key Decisions
- **[Decision]**: [Rationale — WHY, not just what]
- Use code pointers where relevant: \`path/to/file.ts:42\` or \`path/to/file.ts#functionName\`

## Constraints & Invariants
- [Any requirements, constraints, preferences the user stated]
- [Or "(none)" if none were mentioned]

## Files Touched
- \`path/to/file.ts\` — [what was done to it]

## Open Questions / Blockers
- [Unresolved questions or blockers]
- [Or "(none)" if none]

## Next Steps
1. [First concrete action for the new session]
2. [Second action]

## Critical Context
- [Gotchas, non-obvious requirements, hidden dependencies]
- [Or "(none)" if none]

Rules:
- Be concise. Every bullet earns its place.
- Preserve EXACT file paths, function names, error messages, commands.
- Prefer specifics over generalizations.
- Only include information relevant to the stated goal — discard unrelated history.
- Do NOT invent missing details. Say "(unknown)" if needed.
- Do NOT write a plan unless one already exists in the conversation.
- Output markdown only. No preamble, no filler.`;

// ============================================================================
// File I/O: HANDOFF.md
// ============================================================================

function getHandoffFilePath(cwd: string): string {
	return join(cwd, ".pi", "handoff", "HANDOFF.md");
}

function ensureFile(filePath: string): void {
	const dir = dirname(filePath);
	mkdirSync(dir, { recursive: true });
	if (!existsSync(filePath)) {
		writeFileSync(
			filePath,
			`# Handoff Log\n\nProject handoff history. Each entry is a checkpoint created by \`/handoff\` or auto-compact rescue.\n\nNewer entries appended at the bottom.\n`,
			"utf-8",
		);
	}
}

function formatTimestamp(date: Date): string {
	const pad = (n: number) => String(n).padStart(2, "0");
	return (
		`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
		`${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
	);
}

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

function getGitMetadata(cwd: string): string {
	const branch = tryGit(["rev-parse", "--abbrev-ref", "HEAD"], cwd);
	if (!branch) return "";
	const dirty = tryGit(["status", "--porcelain"], cwd);
	const head = tryGit(["rev-parse", "--short", "HEAD"], cwd);
	const parts: string[] = [`branch: \`${branch}\``];
	if (head) parts.push(`HEAD: \`${head}\``);
	parts.push(`dirty: ${dirty ? "yes" : "no"}`);
	return parts.join(" · ");
}

function appendHandoff(
	cwd: string,
	goal: string,
	note: string,
	metadata: { model?: string; trigger: "command" | "pre-compact" },
): string {
	const filePath = getHandoffFilePath(cwd);
	ensureFile(filePath);

	const timestamp = formatTimestamp(new Date());
	const git = getGitMetadata(cwd);

	const entry =
		`\n---\n\n` +
		`## Handoff: ${timestamp}\n\n` +
		`**Trigger:** ${metadata.trigger}` +
		(metadata.model ? ` · **Model:** \`${metadata.model}\`` : "") +
		(git ? ` · **Git:** ${git}` : "") +
		`\n\n` +
		`**Goal:** ${goal}\n\n` +
		note.trim() +
		`\n`;

	appendFileSync(filePath, entry, "utf-8");
	return filePath;
}

// ============================================================================
// Conversation gathering (safe — only what the agent actually sees)
// ============================================================================

interface Conversation {
	text: string;
	count: number;
}

function gatherConversation(ctx: ExtensionContext): Conversation | null {
	const branch = ctx.sessionManager.getBranch();
	const leafId = ctx.sessionManager.getLeafId();
	// buildSessionContext returns current compaction summary + kept messages
	// (unlike raw getBranch which returns entire history, potentially exceeding context)
	const { messages } = buildSessionContext(branch, leafId);
	if (messages.length === 0) return null;
	return {
		text: serializeConversation(convertToLlm(messages)),
		count: messages.length,
	};
}

// ============================================================================
// Handoff prompt generation via LLM
// ============================================================================

type GenerateResult =
	| { type: "ok"; text: string }
	| { type: "error"; message: string }
	| null;

async function generateHandoffNote(
	conversationText: string,
	goal: string,
	ctx: ExtensionContext,
): Promise<GenerateResult> {
	return ctx.ui.custom<GenerateResult>((tui, theme, _kb, done) => {
		const loader = new BorderedLoader(tui, theme, "Extracting handoff context...");
		loader.onAbort = () => done(null);

		const run = async () => {
			const auth = await ctx.modelRegistry.getApiKeyAndHeaders(ctx.model!);
			if (!auth.ok) throw new Error(auth.error);

			const userMessage: Message = {
				role: "user",
				content: [
					{
						type: "text",
						text: `## Conversation\n\n${conversationText}\n\n## Goal for new session\n\n${goal}`,
					},
				],
				timestamp: Date.now(),
			};

			const response = await complete(
				ctx.model!,
				{ systemPrompt: EXTRACTION_SYSTEM_PROMPT, messages: [userMessage] },
				{ apiKey: auth.apiKey, headers: auth.headers, signal: loader.signal },
			);

			if (response.stopReason === "aborted") return null;
			if (response.stopReason === "error") {
				const msg =
					"errorMessage" in response && typeof (response as { errorMessage?: unknown }).errorMessage === "string"
						? ((response as { errorMessage: string }).errorMessage)
						: "LLM request failed";
				return { type: "error" as const, message: msg };
			}

			const text = response.content
				.filter((c): c is { type: "text"; text: string } => c.type === "text")
				.map((c) => c.text)
				.join("\n")
				.trim();

			return text.length > 0
				? { type: "ok" as const, text }
				: { type: "error" as const, message: "LLM returned empty response" };
		};

		run()
			.then(done)
			.catch((err) => {
				const message = err instanceof Error ? err.message : String(err);
				done({ type: "error" as const, message });
			});

		return loader;
	});
}

// ============================================================================
// System prompt hint — educates the agent when to suggest /handoff
// ============================================================================

const HANDOFF_SYSTEM_HINT = `
## Context Handoff

Use \`/handoff <goal>\` to transfer context to a new focused session when:
- The current session has accumulated noise from failed attempts or exploration
- A clear subtask is ready to execute in isolation
- Context is approaching the token limit

Handoff is preferred over compaction: it extracts goal-relevant specifics instead of producing a lossy summary.
At high context usage (>70%), proactively suggest a handoff rather than waiting for auto-compact.
`;

// ============================================================================
// Extension
// ============================================================================

export default function (pi: ExtensionAPI) {
	// Store pending prompt keyed by parent session (set on handoff, consumed on session_switch)
	const pendingPromptByParent = new Map<string, string>();

	// --------------------------------------------------------------------------
	// session_switch: after ctx.newSession() succeeds, preload the editor
	// --------------------------------------------------------------------------
	pi.on("session_switch", async (event, ctx) => {
		if (event.reason !== "new" || !ctx.hasUI) return;
		const header = ctx.sessionManager.getHeader();
		const parent = header?.parentSession;
		if (!parent) return;

		const prompt = pendingPromptByParent.get(parent);
		if (prompt) {
			ctx.ui.setEditorText(prompt);
			ctx.ui.notify("Handoff ready — review then press Enter to send", "info");
			pendingPromptByParent.delete(parent);
		}
	});

	// --------------------------------------------------------------------------
	// before_agent_start: inject handoff hint into system prompt
	// --------------------------------------------------------------------------
	pi.on("before_agent_start", async (event) => {
		return { systemPrompt: event.systemPrompt + HANDOFF_SYSTEM_HINT };
	});

	// --------------------------------------------------------------------------
	// session_before_compact: auto-offer handoff before compaction destroys info
	// --------------------------------------------------------------------------
	pi.on("session_before_compact", async (event, ctx) => {
		if (!ctx.hasUI || !ctx.model) return;

		const usage = ctx.getContextUsage?.();
		const pctStr = usage?.percent != null ? `${Math.round(usage.percent)}%` : "high";

		const choice = await ctx.ui.select(
			`Context is ${pctStr} full. Handoff preserves details better than compaction.`,
			["Handoff to new session", "Compact as usual", "Continue (skip both)"],
		);

		if (choice === "Compact as usual" || choice === undefined) return;
		if (choice === "Continue (skip both)") return { cancel: true };

		// User chose handoff: generate, append, switch
		const { preparation } = event;
		const conversationText = serializeConversation(convertToLlm(preparation.messagesToSummarize));

		const result = await generateHandoffNote(
			conversationText,
			"Continue current work (triggered by context pressure)",
			ctx,
		);

		if (!result) {
			ctx.ui.notify("Handoff cancelled — compacting instead", "warning");
			return;
		}
		if (result.type === "error") {
			ctx.ui.notify(`Handoff failed: ${result.message} — compacting instead`, "warning");
			return;
		}

		// Append to HANDOFF.md
		const cwd = process.cwd();
		try {
			const path = appendHandoff(cwd, "Continue current work", result.text, {
				model: ctx.model.id,
				trigger: "pre-compact",
			});
			ctx.ui.notify(`Handoff saved to ${path}`, "info");
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			ctx.ui.notify(`Failed to write HANDOFF.md: ${msg}`, "warning");
		}

		// Switch session (raw sessionManager — no agent loop running during compact)
		const currentSessionFile = ctx.sessionManager.getSessionFile();
		try {
			(ctx.sessionManager as unknown as { newSession: (o: { parentSession?: string }) => void }).newSession({
				parentSession: currentSessionFile,
			});
			// Preload editor (defer so session switch completes first)
			setTimeout(() => {
				if (ctx.hasUI) {
					ctx.ui.setEditorText(result.text);
					ctx.ui.notify("New session started — review handoff then press Enter", "info");
				}
			}, 0);
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			ctx.ui.notify(`Session switch failed: ${msg} — compacting instead`, "warning");
			return;
		}

		// Cancel the default compaction
		return { cancel: true };
	});

	// --------------------------------------------------------------------------
	// /handoff <goal> — manual entry point
	// --------------------------------------------------------------------------
	pi.registerCommand("handoff", {
		description: "Transfer context to a new focused session (preserves specifics better than /compact)",
		handler: async (args, ctx) => {
			const goal = args.trim();
			if (!goal) {
				ctx.ui.notify("Usage: /handoff <goal for new session>", "error");
				return;
			}
			if (!ctx.model) {
				ctx.ui.notify("No model selected", "error");
				return;
			}

			const conv = gatherConversation(ctx);
			if (!conv) {
				ctx.ui.notify("No conversation to hand off", "error");
				return;
			}

			const result = await generateHandoffNote(conv.text, goal, ctx);
			if (!result) {
				ctx.ui.notify("Handoff cancelled", "info");
				return;
			}
			if (result.type === "error") {
				ctx.ui.notify(`Handoff failed: ${result.message}`, "error");
				return;
			}

			// Append to HANDOFF.md
			const cwd = process.cwd();
			let savedPath: string | null = null;
			try {
				savedPath = appendHandoff(cwd, goal, result.text, {
					model: ctx.model.id,
					trigger: "command",
				});
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				ctx.ui.notify(`Failed to write HANDOFF.md: ${msg}`, "warning");
			}

			// Build prompt for new session: task + extracted note
			const promptForNewSession =
				`# Goal\n${goal}\n\n` +
				`---\n\n` +
				result.text +
				(savedPath ? `\n\n_(Full handoff log: \`${savedPath}\`)_\n` : "");

			// Spawn new session (this will fire session_switch, which preloads the editor).
			// NOTE: after ctx.newSession() the original ctx is invalidated. Any post-replacement
			// work must go inside `withSession`, which receives a fresh ctx bound to the new session.
			const currentSessionFile = ctx.sessionManager.getSessionFile();
			if (currentSessionFile) {
				pendingPromptByParent.set(currentSessionFile, promptForNewSession);
			}

			const sessionResult = await ctx.newSession({
				parentSession: currentSessionFile ?? undefined,
				withSession: async (newCtx) => {
					if (savedPath) {
						newCtx.ui.notify(`Handoff saved: ${savedPath}`, "info");
					}
				},
			});

			if (sessionResult.cancelled) {
				if (currentSessionFile) pendingPromptByParent.delete(currentSessionFile);
				// ctx is now stale — cannot notify here. Cancellation is already surfaced by pi.
				return;
			}
		},
	});
}
