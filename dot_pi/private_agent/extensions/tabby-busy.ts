/**
 * Tabby busy/done/input indicator integration.
 *
 * Busy: When pi is processing, sets braille spinner in pane title + @tabby_busy.
 * Input: When pi calls ask_user, shows ? in title + @tabby_input.
 * Done: When pi finishes and pane is not active, sets @tabby_done=1 (pane option).
 *       Tabby shows ✓ icon until the user focuses the pane.
 *
 * Uses TMUX_PANE env var to target the correct pane in multi-pane windows.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { execSync } from "child_process";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
let spinnerInterval: ReturnType<typeof setInterval> | null = null;
let frameIndex = 0;
let originalTitle: string | null = null;
let askUserActive = false;

const PANE_ID = process.env.TMUX_PANE || "";

function tmux(args: string): void {
	try {
		execSync(`tmux ${args}`, { timeout: 2000, stdio: "ignore" });
	} catch {
		// Not in tmux or command failed
	}
}

function tmuxQuery(args: string): string {
	try {
		return execSync(`tmux ${args}`, { timeout: 2000, encoding: "utf-8" }).trim();
	} catch {
		return "";
	}
}

function isPaneActive(): boolean {
	if (!PANE_ID) return true;
	return tmuxQuery(`display-message -p -t ${PANE_ID} '#{pane_active}'`) === "1";
}

function startBusy(): void {
	if (!PANE_ID) return;

	// Clear any existing done indicator
	tmux(`set-option -p -t ${PANE_ID} -u @tabby_done`);

	// Save original title
	if (originalTitle === null) {
		originalTitle = tmuxQuery(`display-message -p -t ${PANE_ID} '#{pane_title}'`);
	}

	// Set @tabby_busy
	tmux(`set-option -w -t ${PANE_ID} @tabby_busy 1`);

	// Start spinner in pane title
	if (spinnerInterval) return;
	frameIndex = 0;
	updateTitle();
	spinnerInterval = setInterval(updateTitle, 250);
}

function stopBusy(): void {
	if (!PANE_ID) return;

	// Stop spinner
	if (spinnerInterval) {
		clearInterval(spinnerInterval);
		spinnerInterval = null;
	}

	// Restore original title
	if (originalTitle !== null) {
		tmux(`select-pane -t ${PANE_ID} -T '${originalTitle.replace(/'/g, "'\\''")}'`);
		originalTitle = null;
	}

	// Unset @tabby_busy and @tabby_input
	tmux(`set-option -wu -t ${PANE_ID} @tabby_busy`);
	tmux(`set-option -wu -t ${PANE_ID} @tabby_input`);

	// Set @tabby_done if pane is not active (unread indicator)
	if (!isPaneActive()) {
		tmux(`set-option -p -t ${PANE_ID} @tabby_done 1`);
	}
}

function updateTitle(): void {
	if (!PANE_ID) return;
	const frame = SPINNER_FRAMES[frameIndex % SPINNER_FRAMES.length]!;
	frameIndex++;
	const base = originalTitle || "π";
	tmux(`select-pane -t ${PANE_ID} -T '${frame} ${base.replace(/'/g, "'\\''")}'`);
}

function startInput(): void {
	if (!PANE_ID) return;
	askUserActive = true;

	// Pause spinner while waiting for user input
	if (spinnerInterval) {
		clearInterval(spinnerInterval);
		spinnerInterval = null;
	}

	// Show ? in pane title
	const base = originalTitle || "π";
	tmux(`select-pane -t ${PANE_ID} -T '? ${base.replace(/'/g, "'\\''")}'`);

	// Set @tabby_input (window-level, Tabby shows ? icon in sidebar)
	tmux(`set-option -w -t ${PANE_ID} @tabby_input 1`);
	// Clear busy so Tabby doesn't show spinner alongside ?
	tmux(`set-option -wu -t ${PANE_ID} @tabby_busy`);
}

function stopInput(): void {
	if (!PANE_ID || !askUserActive) return;
	askUserActive = false;

	// Unset @tabby_input
	tmux(`set-option -wu -t ${PANE_ID} @tabby_input`);

	// Resume busy state (agent is still running after ask_user returns)
	tmux(`set-option -w -t ${PANE_ID} @tabby_busy 1`);
	if (!spinnerInterval) {
		frameIndex = 0;
		updateTitle();
		spinnerInterval = setInterval(updateTitle, 250);
	}
}

function isAskUser(toolName: string): boolean {
	return toolName === "ask_user" || toolName === "mcp_Ask_user";
}

export default function (pi: ExtensionAPI) {
	pi.on("agent_start", async () => {
		startBusy();
	});

	pi.on("agent_end", async () => {
		if (askUserActive) stopInput();
		stopBusy();
	});

	pi.on("tool_call", async (event) => {
		if (isAskUser(event.toolName)) {
			startInput();
		}
	});

	pi.on("tool_result", async (event) => {
		if (isAskUser(event.toolName)) {
			stopInput();
		}
	});
}
