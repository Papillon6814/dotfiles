"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceTracker = exports.WorkspaceMode = exports.getProjectDir = void 0;
const path = require("path");
const vscode = require("vscode");
const fs = require("fs");
function getProjectDir(workspaceFolder) {
    // check if projectDir is not overridden in workspace
    const projectDir = vscode.workspace
        .getConfiguration("elixirLS", workspaceFolder)
        .get("projectDir");
    return projectDir
        ? path.join(workspaceFolder.uri.fsPath, projectDir)
        : workspaceFolder.uri.fsPath;
}
exports.getProjectDir = getProjectDir;
var WorkspaceMode;
(function (WorkspaceMode) {
    WorkspaceMode["NO_WORKSPACE"] = "NO_WORKSPACE";
    WorkspaceMode["SINGLE_FOLDER"] = "SINGLE_FOLDER";
    WorkspaceMode["MULTI_ROOT"] = "MULTI_ROOT";
})(WorkspaceMode = exports.WorkspaceMode || (exports.WorkspaceMode = {}));
class WorkspaceTracker {
    sortedWorkspaceFolders() {
        if (this._sortedWorkspaceFolders === void 0) {
            this._sortedWorkspaceFolders = vscode.workspace.workspaceFolders
                ? vscode.workspace.workspaceFolders
                    .map((folder) => {
                    let result = folder.uri.toString();
                    if (result.charAt(result.length - 1) !== "/") {
                        result = result + "/";
                    }
                    return result;
                })
                    .sort((a, b) => {
                    return a.length - b.length;
                })
                : [];
        }
        return this._sortedWorkspaceFolders;
    }
    getOuterMostWorkspaceFolder(folder) {
        return this._getOuterMostWorkspaceFolder(folder, false);
    }
    _getOuterMostWorkspaceFolder(folder, isRetry) {
        let uri = folder.uri.toString();
        if (uri.charAt(uri.length - 1) !== "/") {
            uri = uri + "/";
        }
        let outermostFolder = null;
        for (const element of this.sortedWorkspaceFolders()) {
            if (uri.startsWith(element)) {
                const foundFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.parse(element));
                if (foundFolder) {
                    if (!outermostFolder) {
                        // store outermost no mix.exs candidate
                        // it will be discarded if better one with mix.exs is found
                        outermostFolder = foundFolder;
                    }
                    const projectDir = getProjectDir(foundFolder);
                    const mixFilePath = path.join(projectDir, "mix.exs");
                    if (fs.existsSync(mixFilePath)) {
                        // outermost workspace folder with mix.exs found
                        return foundFolder;
                    }
                }
            }
        }
        if (outermostFolder) {
            // no folder containing mix.exs was found, return the outermost folder
            return outermostFolder;
        }
        // most likely handleDidChangeWorkspaceFolders callback hs not yet run
        // clear cache and try again
        if (!isRetry) {
            this.handleDidChangeWorkspaceFolders();
            return this._getOuterMostWorkspaceFolder(folder, true);
        }
        else {
            throw `not able to find outermost workspace folder for ${folder.uri.fsPath}`;
        }
    }
    handleDidChangeWorkspaceFolders() {
        this._sortedWorkspaceFolders = undefined;
    }
    getProjectDirForUri(uri) {
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
        if (workspaceFolder) {
            const outermostWorkspaceFolder = this.getOuterMostWorkspaceFolder(workspaceFolder);
            return getProjectDir(outermostWorkspaceFolder);
        }
    }
    get mode() {
        if (vscode.workspace.workspaceFile) {
            return WorkspaceMode.MULTI_ROOT;
        }
        else if (vscode.workspace.workspaceFolders &&
            vscode.workspace.workspaceFolders.length !== 0) {
            return WorkspaceMode.SINGLE_FOLDER;
        }
        else {
            return WorkspaceMode.NO_WORKSPACE;
        }
    }
}
exports.WorkspaceTracker = WorkspaceTracker;
//# sourceMappingURL=project.js.map