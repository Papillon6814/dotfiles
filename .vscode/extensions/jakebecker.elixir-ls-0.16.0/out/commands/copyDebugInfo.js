"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureCopyDebugInfo = void 0;
const vscode = require("vscode");
const os = require("os");
const child_process_1 = require("child_process");
const constants_1 = require("../constants");
function configureCopyDebugInfo(context) {
    const disposable = vscode.commands.registerCommand("extension.copyDebugInfo", () => {
        const elixirVersion = (0, child_process_1.execSync)(`elixir --version`);
        const extension = vscode.extensions.getExtension(constants_1.ELIXIR_LS_EXTENSION_NAME);
        if (!extension) {
            return;
        }
        const message = `
* Elixir & Erlang versions (elixir --version): ${elixirVersion}
* VSCode ElixirLS version: ${extension.packageJSON.version}
* Operating System Version: ${os.platform()} ${os.release()}
`;
        vscode.window.showInformationMessage(`Copied to clipboard: ${message}`);
        vscode.env.clipboard.writeText(message);
    });
    context.subscriptions.push(disposable);
}
exports.configureCopyDebugInfo = configureCopyDebugInfo;
//# sourceMappingURL=copyDebugInfo.js.map