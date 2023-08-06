"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reloadConfiguration = exports.getCurrentConfiguration = exports.fetchConfig = exports.autodetectExecutePath = void 0;
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const vscode = require("vscode");
const MixCommand = {
    unix: 'mix',
    win32: 'mix.bat',
};
function autodetectExecutePath() {
    const conf = vscode.workspace.getConfiguration('elixir.credo');
    const key = 'PATH';
    const paths = process.env[key];
    if (!paths)
        return '';
    let executePath = '';
    const pathParts = paths.split(path.delimiter);
    if (conf.get('executePath')) {
        pathParts.push(conf.get('executePath'));
    }
    pathParts.forEach((pathPart) => {
        const binPath = os.platform() === 'win32' ? path.join(pathPart, MixCommand.win32) : path.join(pathPart, MixCommand.unix);
        if (fs.existsSync(binPath))
            executePath = pathPart + path.sep;
    });
    return executePath;
}
exports.autodetectExecutePath = autodetectExecutePath;
function fetchConfig() {
    const conf = vscode.workspace.getConfiguration('elixir.credo');
    const mixCommand = os.platform() === 'win32' ? MixCommand.win32 : MixCommand.unix;
    return {
        command: `${autodetectExecutePath()}${mixCommand}`,
        configurationFile: conf.get('configurationFile', '.credo.exs'),
        credoConfiguration: conf.get('credoConfiguration', 'default'),
        strictMode: conf.get('strictMode', false),
        checksWithTag: conf.get('checksWithTag', []),
        checksWithoutTag: conf.get('checksWithoutTag', []),
        ignoreWarningMessages: conf.get('ignoreWarningMessages', false),
        lintEverything: conf.get('lintEverything', false),
        enableDebug: conf.get('enableDebug', false),
        diffMode: {
            enabled: conf.get('diffMode.enabled', false),
            mergeBase: conf.get('diffMode.mergeBase', 'main'),
        },
    };
}
exports.fetchConfig = fetchConfig;
let configuration;
function getCurrentConfiguration() {
    if (!configuration) {
        configuration = Object.assign({}, fetchConfig());
    }
    return configuration;
}
exports.getCurrentConfiguration = getCurrentConfiguration;
function reloadConfiguration(configurationFetcher = fetchConfig) {
    configuration = Object.assign({}, configurationFetcher());
}
exports.reloadConfiguration = reloadConfiguration;
//# sourceMappingURL=configuration.js.map