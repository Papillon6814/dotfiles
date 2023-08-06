"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeCredo = exports.createLintDocumentCallback = exports.reportError = exports.parseOutput = void 0;
const cp = require("node:child_process");
const path = require("node:path");
const parser_1 = require("./parser");
const logger_1 = require("./logger");
const configuration_1 = require("./configuration");
const utilities_1 = require("./utilities");
const CredoInfoCommand = ['credo', 'info', '--format', 'json', '--verbose'];
function parseOutput(stdout) {
    const output = stdout.toString();
    if (!output.length) {
        (0, logger_1.log)({
            message: (0, utilities_1.trunc) `Command \`${(0, configuration_1.getCurrentConfiguration)().command} credo\`
        returns empty output! Please check your configuration.
        Did you add or modify your dependencies? You might need to run \`mix deps.get\` or recompile.`,
            level: logger_1.LogLevel.Error,
        });
        return null;
    }
    try {
        const extractedJSON = output.substr(output.indexOf('{'));
        return JSON.parse(extractedJSON);
    }
    catch (e) {
        const outputLog = output.replace(/[\r\n \t]/g, ' ');
        // It's probably safe to ignore SIGTERM errors: https://en.wikipedia.org/wiki/Signal_(IPC)#SIGTERM
        const isSIGTERM = outputLog.includes('SIGTERM');
        if (e instanceof SyntaxError && !isSIGTERM) {
            (0, logger_1.log)({
                message: `Error on parsing output (It might be non-JSON output): "${outputLog}"`,
                level: logger_1.LogLevel.Error,
            });
        }
        return null;
    }
}
exports.parseOutput = parseOutput;
// checking whether running credo command results in an error
function reportError({ error, stderr }) {
    if ((error === null || error === void 0 ? void 0 : error.signal) === 'SIGTERM' || (error === null || error === void 0 ? void 0 : error.code) === 15 || (error === null || error === void 0 ? void 0 : error.code) === 'SIGTERM') {
        // do not report SIGTERM errors (happens when running credo processes are killed onDidCloseTextDocument)
        return true;
    }
    const errorOutput = stderr.toString();
    if ((error === null || error === void 0 ? void 0 : error.code) === 'ENOENT') {
        (0, logger_1.log)({
            message: (0, utilities_1.trunc) `\`${(0, configuration_1.getCurrentConfiguration)().command}\` is not executable.
      Try setting the option in this extension's configuration "elixir.credo.executePath"
      to the path of the mix binary.`,
            level: logger_1.LogLevel.Error,
        });
        return true;
    }
    if ((error === null || error === void 0 ? void 0 : error.code) === 127 || (error === null || error === void 0 ? void 0 : error.code) === 126) {
        (0, logger_1.log)({
            message: `An error occurred: "${errorOutput}" - Error Object: ${JSON.stringify(error)}`,
            level: logger_1.LogLevel.Error,
        });
        return true;
    }
    if (errorOutput) {
        (0, logger_1.log)({
            message: `Warning: "${errorOutput}"`,
            level: logger_1.LogLevel.Warning,
        });
    }
    return false;
}
exports.reportError = reportError;
function createLintDocumentCallback({ token, diagnosticCollection, document, onComplete, }) {
    const { uri } = document;
    return (error, stdout, stderr) => {
        if (token.isCanceled)
            return;
        if (reportError({ error, stderr }))
            return;
        diagnosticCollection.delete(uri);
        const output = parseOutput(stdout);
        if (!output)
            return;
        const diagnostics = (0, parser_1.parseCredoOutput)({ credoOutput: output, document });
        (0, logger_1.log)({ message: `Setting ${diagnostics.length} linter issues for document ${uri.fsPath}.`, level: logger_1.LogLevel.Debug });
        diagnosticCollection.set(uri, diagnostics);
        token.finished();
        onComplete === null || onComplete === void 0 ? void 0 : onComplete();
    };
}
exports.createLintDocumentCallback = createLintDocumentCallback;
function executeCredoProcess({ cmdArgs, document, options, onFinishedExecution, }) {
    (0, logger_1.log)({
        message: (0, utilities_1.trunc) `Executing credo command \`${[(0, configuration_1.getCurrentConfiguration)().command, ...cmdArgs].join(' ')}\`
    for ${document.uri.fsPath} in directory ${options.cwd}`,
        level: logger_1.LogLevel.Debug,
    });
    const credoProcess = cp.execFile((0, configuration_1.getCurrentConfiguration)().command, cmdArgs, options, onFinishedExecution);
    if (credoProcess.stdin) {
        credoProcess.stdin.write(document.getText());
        credoProcess.stdin.end();
    }
    return credoProcess;
}
function executeCredo({ cmdArgs, document, options, onFinishedExecution, }) {
    if ((0, configuration_1.getCurrentConfiguration)().lintEverything) {
        const credoProcess = executeCredoProcess({ cmdArgs, document, options, onFinishedExecution });
        return [credoProcess];
    }
    const processes = [];
    const projectFolder = (0, utilities_1.getProjectFolder)(document.uri);
    const relativeDocumentPath = projectFolder
        ? document.fileName.replace(`${projectFolder}${path.sep}`, '')
        : document.fileName;
    (0, logger_1.log)({
        message: (0, utilities_1.trunc) `Retreiving credo information: Executing credo command
    \`${[(0, configuration_1.getCurrentConfiguration)().command, ...CredoInfoCommand].join(' ')}\` for ${document.uri.fsPath}
    in directory ${options.cwd}`,
        level: logger_1.LogLevel.Debug,
    });
    const infoProcess = cp.execFile((0, configuration_1.getCurrentConfiguration)().command, CredoInfoCommand, options, (error, stdout, stderr) => {
        if (reportError({ error, stderr }))
            return;
        const credoInformation = parseOutput(stdout);
        if (!credoInformation)
            return;
        // file paths of credo are shown in UNIX style with a '/' path separator
        credoInformation.config.files = credoInformation.config.files.map((filePath) => filePath.replace(/\//g, path.sep));
        if (!credoInformation.config.files.includes(relativeDocumentPath)) {
            onFinishedExecution(null, '{ "issues": [] }', '');
            return;
        }
        const credoProcess = executeCredoProcess({ cmdArgs, document, options, onFinishedExecution });
        processes.push(credoProcess);
    });
    processes.push(infoProcess);
    return processes;
}
exports.executeCredo = executeCredo;
//# sourceMappingURL=execution.js.map