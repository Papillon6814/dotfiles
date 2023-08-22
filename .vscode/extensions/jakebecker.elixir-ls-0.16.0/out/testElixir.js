"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testElixir = void 0;
const vscode = require("vscode");
const child_process_1 = require("child_process");
const shell = require("shelljs");
function testElixirCommand(command) {
    try {
        return (0, child_process_1.execSync)(`${command} -e " "`);
    }
    catch {
        return false;
    }
}
function testElixir() {
    let testResult = testElixirCommand("elixir");
    if (testResult === false) {
        // Try finding elixir in the path directly
        const elixirPath = shell.which("elixir");
        if (elixirPath) {
            testResult = testElixirCommand(elixirPath);
        }
    }
    if (!testResult) {
        vscode.window.showErrorMessage("Failed to run 'elixir' command. ElixirLS will probably fail to launch. Logged PATH to Development Console.");
        console.warn(`Failed to run 'elixir' command. Current process's PATH: ${process.env["PATH"]}`);
        return false;
    }
    else if (testResult.length > 0) {
        vscode.window.showErrorMessage("Running 'elixir' command caused extraneous print to stdout. See VS Code's developer console for details.");
        console.warn("Running 'elixir -e \"\"' printed to stdout:\n" + testResult.toString());
        return false;
    }
    else {
        return true;
    }
}
exports.testElixir = testElixir;
//# sourceMappingURL=testElixir.js.map