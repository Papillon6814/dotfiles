"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = exports.languageClientManager = exports.workspaceTracker = void 0;
const vscode = require("vscode");
const taskProvider_1 = require("./taskProvider");
const debugAdapter_1 = require("./debugAdapter");
const terminalLinkProvider_1 = require("./terminalLinkProvider");
const testController_1 = require("./testController");
const languageClientManager_1 = require("./languageClientManager");
const conflictingExtensions_1 = require("./conflictingExtensions");
const commands_1 = require("./commands");
const project_1 = require("./project");
const testElixir_1 = require("./testElixir");
console.log("ElixirLS: Loading extension");
exports.workspaceTracker = new project_1.WorkspaceTracker();
exports.languageClientManager = new languageClientManager_1.LanguageClientManager(exports.workspaceTracker);
const startClientsForOpenDocuments = (context) => {
    vscode.workspace.textDocuments.forEach((value) => {
        exports.languageClientManager.handleDidOpenTextDocument(value, context);
    });
};
function activate(context) {
    console.log(`ElixirLS: activating extension in mode`, exports.workspaceTracker.mode);
    console.log("ElixirLS: Workspace folders are", vscode.workspace.workspaceFolders);
    console.log("ElixirLS: Workspace is", vscode.workspace.workspaceFile?.toString());
    context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(() => {
        console.info("ElixirLS: Workspace folders changed", vscode.workspace.workspaceFolders);
        exports.workspaceTracker.handleDidChangeWorkspaceFolders();
    }));
    (0, testElixir_1.testElixir)();
    (0, conflictingExtensions_1.detectConflictingExtensions)();
    (0, commands_1.configureCommands)(context, exports.languageClientManager);
    (0, debugAdapter_1.configureDebugger)(context);
    (0, terminalLinkProvider_1.configureTerminalLinkProvider)(context);
    (0, testController_1.configureTestController)(context, exports.languageClientManager, exports.workspaceTracker);
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument((value) => {
        exports.languageClientManager.handleDidOpenTextDocument(value, context);
    }));
    startClientsForOpenDocuments(context);
    context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders(async (event) => {
        for (const folder of event.removed) {
            await exports.languageClientManager.handleWorkspaceFolderRemoved(folder);
        }
        // we might have closed client for some nested workspace folder child
        // reopen all needed
        startClientsForOpenDocuments(context);
    }));
    context.subscriptions.push(vscode.tasks.registerTaskProvider(taskProvider_1.TaskProvider.TaskType, new taskProvider_1.TaskProvider()));
    console.log(`ElixirLS: extension activated`);
    return {
        languageClientManager: exports.languageClientManager,
        workspaceTracker: exports.workspaceTracker,
    };
}
exports.activate = activate;
async function deactivate() {
    console.log(`ElixirLS: deactivating extension`);
    exports.workspaceTracker.handleDidChangeWorkspaceFolders();
    await exports.languageClientManager.deactivate();
    console.log(`ElixirLS: extension deactivated`);
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map