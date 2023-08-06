"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredoProvider = void 0;
const vscode = require("vscode");
const task_queue_1 = require("./task-queue");
const execution_1 = require("./execution");
const logger_1 = require("./logger");
const utilities_1 = require("./utilities");
class CredoProvider {
    constructor({ diagnosticCollection }) {
        this.diagnosticCollection = diagnosticCollection;
        this.taskQueue = new task_queue_1.TaskQueue();
    }
    execute({ document, onComplete }) {
        const { languageId, isUntitled, uri } = document;
        if (languageId !== 'elixir' || isUntitled || !(0, utilities_1.isFileUri)(uri) || !(0, utilities_1.inMixProject)(uri) || !document.getText()) {
            // git diff has elixir-mode. but it is Untitled file.
            return;
        }
        const currentPath = (0, utilities_1.getProjectFolder)(uri);
        const task = new task_queue_1.Task(uri, (token) => {
            const processes = (0, execution_1.executeCredo)({
                cmdArgs: (0, utilities_1.getCommandArguments)(document.uri),
                document,
                options: {
                    cwd: currentPath,
                    env: (0, utilities_1.getCommandEnvironment)(),
                },
                onFinishedExecution: (0, execution_1.createLintDocumentCallback)({
                    token,
                    document,
                    diagnosticCollection: this.diagnosticCollection,
                    onComplete,
                }),
            });
            return () => processes.forEach((process) => {
                process.kill();
            });
        });
        this.taskQueue.enqueue(task);
    }
    clear({ document }) {
        const { uri } = document;
        if ((0, utilities_1.isFileUri)(uri)) {
            (0, logger_1.log)({
                message: `Removing linter messages and cancel running linting processes for ${uri.fsPath}.`,
                level: logger_1.LogLevel.Debug,
            });
            this.taskQueue.cancel(uri);
            this.diagnosticCollection.delete(uri);
        }
    }
    clearAll() {
        vscode.window.visibleTextEditors.forEach((textEditor) => {
            this.clear({ document: textEditor.document });
        });
    }
}
exports.CredoProvider = CredoProvider;
//# sourceMappingURL=provider.js.map