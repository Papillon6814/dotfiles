"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureMixClean = void 0;
const vscode = require("vscode");
const constants_1 = require("../constants");
function configureMixClean(context, languageClientManager, cleanDeps) {
    const commandName = "extension." + (cleanDeps ? "mixCleanIncludeDeps" : "mixClean");
    const disposable = vscode.commands.registerCommand(commandName, async () => {
        const extension = vscode.extensions.getExtension(constants_1.ELIXIR_LS_EXTENSION_NAME);
        if (!extension) {
            return;
        }
        await Promise.all(languageClientManager.allClients().map(async (client) => {
            const command = client.initializeResult.capabilities.executeCommandProvider.commands.find((c) => c.startsWith("mixClean:"));
            const params = {
                command: command,
                arguments: [cleanDeps],
            };
            await client.sendRequest("workspace/executeCommand", params);
        }));
    });
    context.subscriptions.push(disposable);
}
exports.configureMixClean = configureMixClean;
//# sourceMappingURL=mixClean.js.map