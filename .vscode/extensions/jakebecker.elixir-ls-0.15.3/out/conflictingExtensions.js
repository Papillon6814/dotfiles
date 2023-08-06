"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectConflictingExtensions = void 0;
const vscode = require("vscode");
function detectConflictingExtension(extensionId) {
    const extension = vscode.extensions.getExtension(extensionId);
    if (extension) {
        vscode.window.showErrorMessage("Warning: " +
            extensionId +
            " is not compatible with ElixirLS, please uninstall " +
            extensionId);
    }
}
function detectConflictingExtensions() {
    detectConflictingExtension("mjmcloug.vscode-elixir");
    // https://github.com/elixir-lsp/vscode-elixir-ls/issues/34
    detectConflictingExtension("sammkj.vscode-elixir-formatter");
}
exports.detectConflictingExtensions = detectConflictingExtensions;
//# sourceMappingURL=conflictingExtensions.js.map