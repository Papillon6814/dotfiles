/**
 * Tabby busy indicator integration.
 *
 * When pi is actively processing (agent running), sets:
 *   1. tmux @tabby_busy=1 (window-level hook for Tabby)
 *   2. Pane title with braille spinner prefix (prevents Tabby's 10s staleness auto-clear)
 *
 * When idle, restores the original pane title and unsets @tabby_busy.
 *
 * Uses TMUX_PANE env var to target the correct pane in multi-pane windows.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { execSync } from "child_process";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
let spinnerInterval: ReturnType<typeof setInterval> | null = null;
let frameIndex = 0;
let originalTitle: string | null = null;

// Resolve our own pane ID once at load time
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

function startBusy(): void {
	if (!PANE_ID) return;

	// Save original title
	if (originalTitle === null) {
		originalTitle = tmuxQuery(`display-message -p -t ${PANE_ID} '#{pane_title}'`);
	}

	// Set @tabby_busy on our window
	tmux(`set-option -w -t ${PANE_ID} @tabby_busy 1`);

	// Start spinner in our pane title
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

	// Restore original title on our specific pane
	if (originalTitle !== null) {
		tmux(`select-pane -t ${PANE_ID} -T '${originalTitle.replace(/'/g, "'\\''")}'`);
		originalTitle = null;
	}

	// Unset @tabby_busy
	tmux(`set-option -wu -t ${PANE_ID} @tabby_busy`);
}

function updateTitle(): void {
	if (!PANE_ID) return;
	const frame = SPINNER_FRAMES[frameIndex % SPINNER_FRAMES.length]!;
	frameIndex++;
	const base = originalTitle || "π";
	tmux(`select-pane -t ${PANE_ID} -T '${frame} ${base.replace(/'/g, "'\\''")}'`);
}

export default function (pi: ExtensionAPI) {
	pi.on("agent_start", async () => {
		startBusy();
	});

	pi.on("agent_end", async () => {
		stopBusy();
	});
}
