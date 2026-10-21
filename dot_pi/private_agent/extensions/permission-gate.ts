/**
 * Always-deny variant of Pi's examples/extensions/permission-gate.ts (MIT).
 * Keeps the upstream patterns; no confirmation UI or prompt/tool registration.
 * This is a bash string matcher, NOT a shell parser or an OS sandbox:
 * rm -fr, scripts, non-bash tools and extension-owned processes are not covered.
 * Echoed/quoted text may also match. User ! commands use a different event.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  const dangerousPatterns = [
    /\brm\s+(-rf?|--recursive)/i,
    /\bsudo\b/i,
    /\b(chmod|chown)\b.*777/i,
  ];

  pi.on("tool_call", (event) => {
    if (event.toolName !== "bash") return undefined;
    const command = event.input.command;
    if (typeof command !== "string") {
      return { block: true, reason: "permission-gate: invalid bash command" };
    }
    if (dangerousPatterns.some((pattern) => pattern.test(command))) {
      // Never include the command: arguments may contain credentials.
      return { block: true, reason: "permission-gate: prohibited command (always denied)" };
    }
    return undefined;
  });
}
