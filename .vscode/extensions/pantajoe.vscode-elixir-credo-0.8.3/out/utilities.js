"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommandEnvironment = exports.getCommandArguments = exports.getCredoConfigFilePath = exports.getProjectFolder = exports.inMixProject = exports.findUp = exports.isFileUri = exports.trunc = exports.makeZeroBasedIndex = exports.DefaultCommandArguments = exports.DiffCommand = exports.DefaultCommand = exports.DefaultConfigFile = void 0;
const path = require("node:path");
const fs = require("node:fs");
const vscode = require("vscode");
const configuration_1 = require("./configuration");
const logger_1 = require("./logger");
exports.DefaultConfigFile = '.credo.exs';
exports.DefaultCommand = 'credo';
exports.DiffCommand = 'diff';
exports.DefaultCommandArguments = ['--format', 'json', '--read-from-stdin'];
function makeZeroBasedIndex(index) {
    if (index) {
        const zeroBasedIndex = index - 1;
        if (zeroBasedIndex < 0) {
            return 0;
        }
        return zeroBasedIndex;
    }
    return 0;
}
exports.makeZeroBasedIndex = makeZeroBasedIndex;
function trunc(strings, ...placeholders) {
    return strings.reduce((result, string, i) => result + placeholders[i - 1] + string).replace(/$\n^\s*/gm, ' ');
}
exports.trunc = trunc;
function isFileUri(uri) {
    return uri.scheme === 'file';
}
exports.isFileUri = isFileUri;
/**
 * Search for a directory (upward recursively) that contains a certain file.
 *
 * @param name filename to search for in directories
 * @param opts specify start and stop of upward recursive directory search
 */
function findUp(name, opts) {
    const { startAt: dir, stopAt } = opts;
    const filePath = path.join(dir, name);
    if (fs.existsSync(filePath))
        return dir;
    if (dir === stopAt)
        return undefined;
    return findUp(name, { startAt: path.dirname(dir), stopAt });
}
exports.findUp = findUp;
function inMixProject(documentUri) {
    const workspace = vscode.workspace.getWorkspaceFolder(documentUri);
    if (!workspace)
        return false;
    const mixProjectPath = findUp('mix.exs', {
        startAt: path.dirname(documentUri.fsPath),
        stopAt: workspace.uri.fsPath,
    });
    return !!mixProjectPath;
}
exports.inMixProject = inMixProject;
function getProjectFolder(documentUri) {
    const { fsPath: documentPath } = documentUri;
    const workspace = vscode.workspace.getWorkspaceFolder(documentUri);
    const mixProjectPath = workspace
        ? findUp('mix.exs', {
            startAt: path.dirname(documentUri.fsPath),
            stopAt: workspace.uri.fsPath,
        })
        : undefined;
    return mixProjectPath || (workspace === null || workspace === void 0 ? void 0 : workspace.uri.fsPath) || path.dirname(documentPath);
}
exports.getProjectFolder = getProjectFolder;
function getCredoConfigFilePath(documentUri, opts) {
    var _a;
    const { silent = false } = opts !== null && opts !== void 0 ? opts : {};
    const extensionConfig = (0, configuration_1.getCurrentConfiguration)();
    const configurationFile = extensionConfig.configurationFile || exports.DefaultConfigFile;
    // add unchanged value of `configurationFile` in case it is an absolute path
    if (path.isAbsolute(configurationFile) && fs.existsSync(configurationFile))
        return configurationFile;
    let projectFolder = documentUri ? getProjectFolder(documentUri) : undefined;
    if (!projectFolder && documentUri)
        projectFolder = (_a = vscode.workspace.getWorkspaceFolder(documentUri)) === null || _a === void 0 ? void 0 : _a.uri.fsPath;
    const found = projectFolder
        ? [path.join(projectFolder, configurationFile), path.join(projectFolder, 'config', configurationFile)].filter((fullPath) => fs.existsSync(fullPath))
        : [];
    if (found.length === 0) {
        if (!silent)
            (0, logger_1.log)({ message: `${configurationFile} file does not exist. Ignoring...`, level: logger_1.LogLevel.Warning });
        return null;
    }
    else {
        if (found.length > 1 && !silent) {
            (0, logger_1.log)({ message: `Found multiple files (${found.join(', ')}). I will use ${found[0]}`, level: logger_1.LogLevel.Warning });
        }
        return found[0].replace(`${projectFolder}${path.sep}`, '');
    }
}
exports.getCredoConfigFilePath = getCredoConfigFilePath;
function getCommandArguments(documentUri) {
    const commandArguments = [...exports.DefaultCommandArguments];
    const extensionConfig = (0, configuration_1.getCurrentConfiguration)();
    const configFilePath = getCredoConfigFilePath(documentUri);
    if (configFilePath)
        commandArguments.push('--config-file', configFilePath);
    if (extensionConfig.credoConfiguration) {
        commandArguments.push('--config-name', extensionConfig.credoConfiguration);
    }
    if (extensionConfig.checksWithTag.length) {
        extensionConfig.checksWithTag.forEach((tag) => {
            commandArguments.push('--checks-with-tag', tag);
        });
    }
    else if (extensionConfig.checksWithoutTag.length) {
        extensionConfig.checksWithoutTag.forEach((tag) => {
            commandArguments.push('--checks-without-tag', tag);
        });
    }
    if (extensionConfig.strictMode) {
        commandArguments.push('--strict');
    }
    if (extensionConfig.diffMode.enabled) {
        commandArguments.push('--from-git-merge-base', extensionConfig.diffMode.mergeBase || 'main');
    }
    const commandPrefix = extensionConfig.diffMode.enabled ? [exports.DefaultCommand, exports.DiffCommand] : [exports.DefaultCommand];
    return [...commandPrefix, ...commandArguments];
}
exports.getCommandArguments = getCommandArguments;
function getCommandEnvironment() {
    const conf = vscode.workspace.getConfiguration('elixir.credo');
    const executePath = conf.get('executePath');
    if (executePath) {
        return Object.assign(Object.assign({}, process.env), { PATH: `${process.env.PATH}${path.delimiter}${executePath}` });
    }
    return Object.assign({}, process.env);
}
exports.getCommandEnvironment = getCommandEnvironment;
//# sourceMappingURL=utilities.js.map