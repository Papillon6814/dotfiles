"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureMixClean = void 0;
const vscode = require("vscode");
const node_1 = require("vscode-languageclient/node");
const constants_1 = require("../constants");
function configureMixClean(context, languageClientManager, cleanDeps) {
    const commandName = "extension." + (cleanDeps ? "mixCleanIncludeDeps" : "mixClean");
    const disposable = vscode.commands.registerCommand(commandName, async () => {
        const extension = vscode.extensions.getExtension(constants_1.ELIXIR_LS_EXTENSION_NAME);
        if (!extension) {
            return;
        }
        await Promise.all(languageClientManager.allClients().map(async (client) => {
            if (!client.initializeResult) {
                console.error(`ElixirLS: unable to execute command on server ${client.name} in state ${node_1.State[client.state]}`);
                return;
            }
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