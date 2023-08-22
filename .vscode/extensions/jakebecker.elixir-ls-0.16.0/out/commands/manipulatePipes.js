"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureManipulatePipes = void 0;
const vscode = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
const constants_1 = require("../constants");
function configureManipulatePipes(context, languageClientManager, operation) {
    const commandName = `extension.${operation}`;
    const disposable = vscode.commands.registerCommand(commandName, async () => {
        const extension = vscode.extensions.getExtension(constants_1.ELIXIR_LS_EXTENSION_NAME);
        const editor = vscode.window.activeTextEditor;
        if (!extension || !editor) {
            return;
        }
        const client = languageClientManager.getClientByDocument(editor.document);
        const uri = editor.document.uri;
        if (!client) {
            console.error(`ElixirLS: no language client for document ${uri.fsPath}`);
            return;
        }
        if (!client.initializeResult) {
            console.error(`ElixirLS: unable to execute command on server ${client.name} in state ${vscode_languageclient_1.State[client.state]}`);
            return;
        }
        const command = client.initializeResult.capabilities.executeCommandProvider.commands.find((c) => c.startsWith("manipulatePipes:"));
        const uriStr = uri.toString();
        const args = [
            operation,
            uriStr,
            editor.selection.start.line,
            editor.selection.start.character,
        ];
        const params = { command, arguments: args };
        client.sendRequest("workspace/executeCommand", params);
    });
    context.subscriptions.push(disposable);
}
exports.configureManipulatePipes = configureManipulatePipes;
//# sourceMappingURL=manipulatePipes.js.map