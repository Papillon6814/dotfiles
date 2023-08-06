"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureDebugger = void 0;
const vscode = require("vscode");
const executable_1 = require("./executable");
class DebugAdapterExecutableFactory {
    constructor(context) {
        this._context = context;
    }
    createDebugAdapterDescriptor(session, executable) {
        console.log("DebugAdapterExecutableFactory called with session", session, "executable", executable);
        const command = (0, executable_1.buildCommand)(this._context, "debugger", session.workspaceFolder);
        let options = executable.options;
        if (session.workspaceFolder) {
            const cwd = session.workspaceFolder.uri.fsPath;
            if (options) {
                options = { ...options, cwd };
            }
            else {
                options = { cwd };
            }
            // for some reason env from launch config is not being passed to executable config
            // by default we need to do that manually
            if (session.configuration.env) {
                options = {
                    ...options,
                    env: {
                        ...(options.env ?? {}),
                        ...session.configuration.env,
                    },
                };
            }
        }
        const resultExecutable = new vscode.DebugAdapterExecutable(command, executable.args, options);
        if (session.workspaceFolder) {
            console.log(`ElixirLS: starting DAP for ${session.workspaceFolder.uri.fsPath} with executable`, resultExecutable);
        }
        else {
            console.log("ElixirLS: starting DAP with executable", resultExecutable);
        }
        return resultExecutable;
    }
}
function configureDebugger(context) {
    // Use custom DebugAdaptureExecutableFactory that launches the debugger with
    // the current working directory set to the workspace root so asdf can load
    // the correct environment properly.
    const factory = new DebugAdapterExecutableFactory(context);
    const disposable = vscode.debug.registerDebugAdapterDescriptorFactory("mix_task", factory);
    context.subscriptions.push(disposable);
}
exports.configureDebugger = configureDebugger;
//# sourceMappingURL=debugAdapter.js.map