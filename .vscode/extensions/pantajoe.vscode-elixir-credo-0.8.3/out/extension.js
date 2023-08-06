"use strict";
// this extension's structure is heavily inspired by https://github.com/misogi/vscode-ruby-rubocop
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const provider_1 = require("./provider");
const configuration_1 = require("./configuration");
const logger_1 = require("./logger");
function activate(context) {
    const { workspace } = vscode;
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('elixir');
    context.subscriptions.push(diagnosticCollection);
    const credo = new provider_1.CredoProvider({ diagnosticCollection });
    workspace.onDidChangeConfiguration(() => {
        (0, logger_1.log)({ message: 'Extension configuration has changed. Refreshing configuration ...', level: logger_1.LogLevel.Debug });
        (0, configuration_1.reloadConfiguration)();
    });
    workspace.textDocuments.forEach((document) => {
        credo.execute({ document });
    });
    workspace.onDidOpenTextDocument((document) => {
        credo.execute({ document });
    });
    workspace.onDidSaveTextDocument((document) => {
        credo.execute({ document });
    });
    workspace.onDidCloseTextDocument((document) => {
        credo.clear({ document });
    });
    (0, logger_1.log)({ message: 'Credo (Elixir Linter) initiated successfully.', level: logger_1.LogLevel.Info });
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map