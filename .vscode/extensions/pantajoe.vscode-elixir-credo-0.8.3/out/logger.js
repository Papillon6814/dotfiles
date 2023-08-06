"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = exports.outputChannel = exports.LogLevel = void 0;
const vscode = require("vscode");
const configuration_1 = require("./configuration");
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Debug"] = 0] = "Debug";
    LogLevel[LogLevel["Info"] = 1] = "Info";
    LogLevel[LogLevel["Warning"] = 2] = "Warning";
    LogLevel[LogLevel["Error"] = 3] = "Error";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
exports.outputChannel = vscode.window.createOutputChannel('Credo (Elixir Linter)');
function logToOutputChannel(message) {
    exports.outputChannel.appendLine(`> ${message}\n`);
}
function log({ message, level = LogLevel.Error }) {
    const { ignoreWarningMessages, enableDebug } = (0, configuration_1.getCurrentConfiguration)();
    switch (level) {
        case LogLevel.Debug:
            enableDebug && logToOutputChannel(message);
            break;
        case LogLevel.Info:
            logToOutputChannel(message);
            break;
        case LogLevel.Warning:
            logToOutputChannel(message);
            !ignoreWarningMessages && vscode.window.showWarningMessage(message);
            break;
        case LogLevel.Error:
            logToOutputChannel(message);
            vscode.window.showErrorMessage(message);
            break;
        default:
            break;
    }
}
exports.log = log;
//# sourceMappingURL=logger.js.map