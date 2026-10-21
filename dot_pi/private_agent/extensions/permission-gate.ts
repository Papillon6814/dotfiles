/**
 * Always-deny variant of Pi's MIT permission-gate example.
 * Rules are code-side configuration, not model prompt text. Shared patterns plus
 * a Profile-specific file are checked on every bash call (edits take effect live).
 * String matching is NOT shell parsing or an OS sandbox: scripts, user ! commands,
 * non-bash tools and extension-owned processes are not comprehensively covered.
 * Quoted/echoed text can match too. Do not put secrets in these rule files.
 */
import { readFileSync } from "node:fs";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const profileFiles: Record<string, string | undefined> = {
  developer: "permission-gate.developer.json",
  "roblox-game": "permission-gate.roblox-game.json",
};
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function readRules(file: string): RegExp[] {
  const raw = readFileSync(new URL(file, import.meta.url), "utf8");
  if (raw.length > 65536) throw new Error("Oversized rules");
  const rules: unknown = JSON.parse(raw);
  if (!record(rules) || rules.version !== 1 || !Array.isArray(rules.denyBashPatterns)) {
    throw new Error("Invalid rules");
  }
  return rules.denyBashPatterns.map((rule: unknown) => {
    if (!record(rule) || typeof rule.source !== "string" || !rule.source ||
      typeof rule.flags !== "string" || !/^(?:i)?$/.test(rule.flags)) {
      throw new Error("Invalid pattern");
    }
    return new RegExp(rule.source, rule.flags);
  });
}

function currentProfile(ctx: ExtensionContext): string {
  let selected: { id: string; label: string; instructions: string } | undefined;
  for (const entry of ctx.sessionManager?.getBranch() ?? []) {
    if (entry.type !== "custom" || entry.customType !== "startup-profile-state") continue;
    const data: unknown = entry.data;
    if (!record(data) || data.version !== 1 || typeof data.id !== "string" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.id) ||
      typeof data.label !== "string" || !data.label.trim() ||
      typeof data.instructions !== "string") throw new Error("Invalid profile");
    if (selected && (selected.id !== data.id || selected.label !== data.label ||
      selected.instructions !== data.instructions)) throw new Error("Conflicting profiles");
    selected = { id: data.id, label: data.label, instructions: data.instructions };
  }
  // Used only when no saved Profile exists (e.g. before its first session entry).
  const id = selected?.id ?? process.env.PI_PROFILE_ACTIVE ?? "standard";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error("Invalid profile");
  return id;
}

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", (event, ctx) => {
    if (event.toolName !== "bash") return undefined;
    const command = event.input.command;
    if (typeof command !== "string") {
      return { block: true, reason: "permission-gate: invalid bash command" };
    }
    try {
      const id = currentProfile(ctx);
      const file = Object.hasOwn(profileFiles, id) ? profileFiles[id] : undefined;
      const patterns = [
        ...readRules("permission-gate.common.json"),
        ...(file ? readRules(file) : []),
      ];
      if (patterns.some((pattern) => pattern.test(command))) {
        return { block: true, reason: "permission-gate: prohibited command (always denied)" };
      }
    } catch {
      // Never reflect exception text or command arguments: either may contain secrets.
      return { block: true, reason: "permission-gate: configuration or profile state invalid; bash denied" };
    }
    return undefined;
  });
}
