"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureRestart = void 0;
const vscode = require("vscode");
const constants_1 = require("../constants");
function configureRestart(context, languageClientManager) {
    const disposable = vscode.commands.registerCommand("extension.restart", async () => {
        const extension = vscode.extensions.getExtension(constants_1.ELIXIR_LS_EXTENSION_NAME);
        if (!extension) {
            return;
        }
        await Promise.all(languageClientManager
            .allClients()
            .map(async (client) => {
            const command = client.initializeResult.capabilities.executeCommandProvider.commands.find((c) => c.startsWith("restart:"));
            const params = {
                command: command,
                arguments: [],
            };
            try {
                await client.sendRequest("workspace/executeCommand", params);
            }
            catch {
                // this command will throw Connection got disposed
                // client reference remains valid as VS will restart server process and the connection
            }
        }));
    });
    context.subscriptions.push(disposable);
}
exports.configureRestart = configureRestart;
//# sourceMappingURL=restart.js.map