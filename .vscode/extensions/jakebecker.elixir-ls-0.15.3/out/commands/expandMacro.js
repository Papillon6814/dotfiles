"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureExpandMacro = void 0;
const vscode = require("vscode");
const constants_1 = require("../constants");
const ExpandMacroTitle = "Expand macro result";
function getExpandMacroWebviewContent(content) {
    let body = "";
    for (const [key, value] of Object.entries(content)) {
        body += `<div>
      <h4>${key}</h4>
      <code><pre>${value}</pre></code>
    </div>`;
    }
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${ExpandMacroTitle}</title>
</head>
<body>
  ${body}
</body>
</html>`;
}
function configureExpandMacro(context, languageClientManager) {
    const disposable = vscode.commands.registerCommand("extension.expandMacro", async () => {
        const extension = vscode.extensions.getExtension(constants_1.ELIXIR_LS_EXTENSION_NAME);
        const editor = vscode.window.activeTextEditor;
        if (!extension || !editor) {
            return;
        }
        const uri = editor.document.uri;
        const client = languageClientManager.getClientByDocument(editor.document);
        if (!client) {
            return;
        }
        if (editor.selection.isEmpty) {
            return;
        }
        const command = client.initializeResult.capabilities.executeCommandProvider.commands.find((c) => c.startsWith("expandMacro:"));
        const params = {
            command: command,
            arguments: [
                uri.toString(),
                editor.document.getText(editor.selection),
                editor.selection.start.line,
            ],
        };
        const res = await client.sendRequest("workspace/executeCommand", params);
        const panel = vscode.window.createWebviewPanel("expandMacro", ExpandMacroTitle, vscode.ViewColumn.One, {});
        panel.webview.html = getExpandMacroWebviewContent(res);
    });
    context.subscriptions.push(disposable);
}
exports.configureExpandMacro = configureExpandMacro;
//# sourceMappingURL=expandMacro.js.map