"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCommand = void 0;
const vscode = require("vscode");
const os = require("os");
const path = require("path");
const platformCommand = (command) => command + (os.platform() == "win32" ? ".bat" : ".sh");
function buildCommand(context, kind, workspaceFolder) {
    // get workspaceFolder scoped configuration or default
    const lsOverridePath = vscode.workspace
        .getConfiguration("elixirLS", workspaceFolder)
        .get("languageServerOverridePath");
    const command = platformCommand(kind);
    const dir = process.env.ELS_LOCAL == "1"
        ? "./elixir-ls/scripts/"
        : "./elixir-ls-release/";
    return lsOverridePath
        ? path.join(lsOverridePath, command)
        : context.asAbsolutePath(dir + command);
}
exports.buildCommand = buildCommand;
//# sourceMappingURL=executable.js.map