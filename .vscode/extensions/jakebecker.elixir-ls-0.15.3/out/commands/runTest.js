"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const vscode = require("vscode");
function runTest(args, debug) {
    return debug ? debugTest(args) : runTestWithoutDebug(args);
}
exports.default = runTest;
async function runTestWithoutDebug(args) {
    const command = `mix test ${buildTestCommandArgs(args)}`;
    console.log(command, args.cwd);
    return new Promise((resolve, reject) => {
        const options = {
            cwd: args.cwd,
            env: {
                ...process.env,
                MIX_ENV: "test",
            },
        };
        (0, child_process_1.exec)(command, options, (error, stdout, stderr) => {
            console.log("stdout", stdout);
            console.log("stderr", stderr);
            if (!error) {
                resolve(stdout);
            }
            else {
                reject(stdout + (stderr ? "\n" + stderr : ""));
            }
        });
    });
}
// Get the configuration for mix test, if it exists
function getTestConfig(args) {
    const launchJson = vscode.workspace.getConfiguration("launch");
    const testConfig = launchJson.configurations.findLast((e) => e.name == "mix test");
    if (testConfig == undefined) {
        return undefined;
    }
    testConfig.projectDir = args.cwd;
    testConfig.taskArgs.concat(buildTestCommandArgs(args));
    testConfig.requireFiles.push(args.filePath);
    return testConfig;
}
// Get the config to use for debugging
function getDebugConfig(args) {
    const fileConfiguration = getTestConfig(args);
    const fallbackConfiguration = {
        type: "mix_task",
        name: "mix test",
        request: "launch",
        task: "test",
        env: {
            MIX_ENV: "test",
        },
        taskArgs: [buildTestCommandArgs(args)],
        startApps: true,
        projectDir: args.cwd,
        // we need to require all test helpers and only the file we need to test
        // mix test runs tests in all required files even if they do not match
        // given path:line
        requireFiles: [
            "test/**/test_helper.exs",
            "apps/*/test/**/test_helper.exs",
            args.filePath,
        ],
    };
    const config = fileConfiguration ?? fallbackConfiguration;
    console.log("Starting debug session with launch config", config);
    return config;
}
async function debugTest(args) {
    const debugConfiguration = getDebugConfig(args);
    return new Promise((resolve, reject) => {
        const listeners = [];
        const disposeListeners = () => {
            for (const listener of listeners) {
                listener.dispose();
            }
        };
        listeners.push(vscode.debug.onDidStartDebugSession((_s) => {
            console.log("Debug session started");
        }));
        listeners.push(vscode.debug.onDidTerminateDebugSession((_s) => {
            console.log("Debug session terminated");
            disposeListeners();
            // there is no documented way of getting output from
            // vscode.debug.activeDebugConsole
            resolve("");
        }));
        vscode.debug
            .startDebugging(vscode.workspace.workspaceFolders[0], debugConfiguration)
            .then((debugSessionStarted) => {
            if (!debugSessionStarted) {
                disposeListeners();
                reject("Unable to start debug session");
            }
        });
    });
}
function buildTestCommandArgs(args) {
    let line = "";
    if (typeof args.line === "number") {
        line = `:${args.line}`;
    }
    // as of vscode 1.78 ANSI is not fully supported
    return `${args.filePath}${line} --no-color`;
}
//# sourceMappingURL=runTest.js.map