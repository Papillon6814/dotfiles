// TODO why we have MS copyright here?
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = exports.defaultClient = void 0;
const vscode = require("vscode");
const child_process_1 = require("child_process");
const shell = require("shelljs");
const path = require("path");
const vscode_1 = require("vscode");
const node_1 = require("vscode-languageclient/node");
const os = require("os");
const TaskProvider_1 = require("./TaskProvider");
const commands_1 = require("./constants/commands");
const runTest_1 = require("./commands/runTest");
const ExpandMacroTitle = "Expand macro result";
exports.defaultClient = null;
const clients = new Map();
let _sortedWorkspaceFolders;
function allClients() {
    const result = [...clients.values()];
    if (exports.defaultClient) {
        result.push(exports.defaultClient);
    }
    return result;
}
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
function detectConflictingExtension(extensionId) {
    const extension = vscode.extensions.getExtension(extensionId);
    if (extension) {
        vscode.window.showErrorMessage("Warning: " +
            extensionId +
            " is not compatible with ElixirLS, please uninstall " +
            extensionId);
    }
}
function sortedWorkspaceFolders() {
    if (_sortedWorkspaceFolders === void 0) {
        _sortedWorkspaceFolders = vscode_1.workspace.workspaceFolders
            ? vscode_1.workspace.workspaceFolders
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
    return _sortedWorkspaceFolders;
}
let workspaceSubscription = vscode_1.workspace.onDidChangeWorkspaceFolders(() => (_sortedWorkspaceFolders = undefined));
function getOuterMostWorkspaceFolder(folder) {
    let uri = folder.uri.toString();
    if (uri.charAt(uri.length - 1) !== "/") {
        uri = uri + "/";
    }
    for (const element of sortedWorkspaceFolders()) {
        if (uri.startsWith(element)) {
            return vscode_1.workspace.getWorkspaceFolder(vscode_1.Uri.parse(element));
        }
    }
    throw "this should not happen";
}
function configureCopyDebugInfo(context) {
    const disposable = vscode.commands.registerCommand("extension.copyDebugInfo", () => {
        const elixirVersion = (0, child_process_1.execSync)(`elixir --version`);
        const extension = vscode.extensions.getExtension("jakebecker.elixir-ls");
        if (!extension) {
            return;
        }
        const message = `
* Elixir & Erlang versions (elixir --version): ${elixirVersion}
* VSCode ElixirLS version: ${extension.packageJSON.version}
* Operating System Version: ${os.platform()} ${os.release()}
`;
        vscode.window.showInformationMessage(`Copied to clipboard: ${message}`);
        vscode.env.clipboard.writeText(message);
    });
    context.subscriptions.push(disposable);
}
function getExpandMacroWebviewContent(content) {
    let body = "";
    for (const [key, value] of Object.entries(content)) {
        body += `<div>
      <h4>${key}</h4>
      <code><pre>${value}</pre></code>
    </div>`;
    }
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${ExpandMacroTitle}</title>
</head>
<body>
  ${body}
</body>
</html>`;
}
function configureExpandMacro(context) {
    const disposable = vscode.commands.registerCommand("extension.expandMacro", async () => {
        const extension = vscode.extensions.getExtension("jakebecker.elixir-ls");
        const editor = vscode.window.activeTextEditor;
        if (!extension || !editor) {
            return;
        }
        const uri = editor.document.uri;
        const client = getClient(editor.document);
        if (!client) {
            return;
        }
        if (editor.selection.isEmpty) {
            return;
        }
        const command = client.initializeResult.capabilities.executeCommandProvider.commands.find((c) => c.startsWith("expandMacro:"));
        const params = {
            command: command,
            arguments: [
                uri.toString(),
                editor.document.getText(editor.selection),
                editor.selection.start.line,
            ],
        };
        const res = await client.sendRequest("workspace/executeCommand", params);
        const panel = vscode.window.createWebviewPanel("expandMacro", ExpandMacroTitle, vscode.ViewColumn.One, {});
        panel.webview.html = getExpandMacroWebviewContent(res);
    });
    context.subscriptions.push(disposable);
}
function configureRestart(context) {
    const disposable = vscode.commands.registerCommand("extension.restart", async () => {
        const extension = vscode.extensions.getExtension("jakebecker.elixir-ls");
        if (!extension) {
            return;
        }
        await Promise.all(allClients().map(async (client) => {
            const command = client.initializeResult.capabilities.executeCommandProvider.commands.find((c) => c.startsWith("restart:"));
            const params = {
                command: command,
                arguments: [],
            };
            try {
                await client.sendRequest("workspace/executeCommand", params);
            }
            catch {
                // this command will throw Connection got disposed
                // client reference remains valid as VS will restart server process and the connection
            }
        }));
    });
    context.subscriptions.push(disposable);
}
function configureMixClean(context, cleanDeps) {
    const commandName = "extension." + (cleanDeps ? "mixCleanIncludeDeps" : "mixClean");
    const disposable = vscode.commands.registerCommand(commandName, async () => {
        const extension = vscode.extensions.getExtension("jakebecker.elixir-ls");
        if (!extension) {
            return;
        }
        await Promise.all(allClients().map(async (client) => {
            const command = client.initializeResult.capabilities.executeCommandProvider.commands.find((c) => c.startsWith("mixClean:"));
            const params = {
                command: command,
                arguments: [cleanDeps],
            };
            await client.sendRequest("workspace/executeCommand", params);
        }));
    });
    context.subscriptions.push(disposable);
}
function configureManipulatePipes(context, operation) {
    const commandName = `extension.${operation}`;
    const disposable = vscode.commands.registerCommand(commandName, async () => {
        const extension = vscode.extensions.getExtension("jakebecker.elixir-ls");
        const editor = vscode.window.activeTextEditor;
        if (!extension || !editor) {
            return;
        }
        const client = getClient(editor.document);
        const uri = editor.document.uri;
        if (!client) {
            return;
        }
        const command = client.initializeResult.capabilities.executeCommandProvider.commands.find((c) => c.startsWith("manipulatePipes:"));
        const uriStr = uri.toString();
        const args = [
            operation,
            uriStr,
            editor.selection.start.line,
            editor.selection.start.character,
        ];
        const params = { command, arguments: args };
        client.sendRequest("workspace/executeCommand", params);
    });
    context.subscriptions.push(disposable);
}
class DebugAdapterExecutableFactory {
    createDebugAdapterDescriptor(session, executable) {
        if (session.workspaceFolder) {
            const cwd = session.workspaceFolder.uri.fsPath;
            let options;
            if (executable.options) {
                options = { ...executable.options, cwd };
            }
            else {
                options = { cwd };
            }
            return new vscode.DebugAdapterExecutable(executable.command, executable.args, options);
        }
        return executable;
    }
}
function configureDebugger(context) {
    // Use custom DebugAdaptureExecutableFactory that launches the debugger with
    // the current working directory set to the workspace root so asdf can load
    // the correct environment properly.
    const factory = new DebugAdapterExecutableFactory();
    const disposable = vscode.debug.registerDebugAdapterDescriptorFactory("mix_task", factory);
    context.subscriptions.push(disposable);
}
function configureTerminalLinkProvider(context) {
    function openUri(uri, line) {
        vscode.workspace.openTextDocument(uri).then((document) => {
            vscode.window.showTextDocument(document).then((editor) => {
                const position = new vscode.Position(line - 1, 0);
                const selection = new vscode.Selection(position, position);
                editor.revealRange(selection);
                editor.selection = selection;
            });
        });
    }
    const disposable = vscode.window.registerTerminalLinkProvider({
        provideTerminalLinks: (context, _token) => {
            const regex = /(?:\((?<app>[_a-z]+) \d+.\d+.\d+\) )(?<file>[_a-z/]*[_a-z]+.ex):(?<line>\d+)/;
            const matches = context.line.match(regex);
            if (matches === null) {
                return [];
            }
            return [
                {
                    startIndex: matches.index,
                    length: matches[0].length,
                    data: {
                        app: matches.groups.app,
                        file: matches.groups.file,
                        line: parseInt(matches.groups.line),
                    },
                },
            ];
        },
        handleTerminalLink: ({ data: { app, file, line }, }) => {
            const umbrellaFile = path.join("apps", app, file);
            vscode.workspace.findFiles(`{${umbrellaFile},${file}}`).then((uris) => {
                if (uris.length === 1) {
                    openUri(uris[0], line);
                }
                else if (uris.length > 1) {
                    const items = uris.map((uri) => ({ label: uri.toString(), uri }));
                    vscode.window.showQuickPick(items).then((selection) => {
                        if (!selection) {
                            return;
                        }
                        openUri(selection.uri, line);
                    });
                }
            });
        },
    });
    context.subscriptions.push(disposable);
}
function startClient(context, clientOptions) {
    const command = os.platform() == "win32" ? "language_server.bat" : "language_server.sh";
    // get workspaceFolder scoped configuration or default
    const lsOverridePath = vscode.workspace
        .getConfiguration("elixirLS", clientOptions.workspaceFolder)
        .get("languageServerOverridePath");
    const serverOpts = {
        command: lsOverridePath
            ? path.join(lsOverridePath, command)
            : context.asAbsolutePath("./elixir-ls-release/" + command),
    };
    // If the extension is launched in debug mode then the `debug` server options are used instead of `run`
    // currently we pass the same options regardless of the mode
    const serverOptions = {
        run: serverOpts,
        debug: serverOpts,
    };
    let displayName;
    if (clientOptions.workspaceFolder) {
        console.log(`ElixirLS: starting client for ${clientOptions.workspaceFolder.uri.toString()} with server options`, serverOptions, "client options", clientOptions);
        displayName = `ElixirLS - ${clientOptions.workspaceFolder.name}`;
    }
    else {
        console.log(`ElixirLS: starting default client with server options`, serverOptions, "client options", clientOptions);
        displayName = "ElixirLS - (default)";
    }
    const client = new node_1.LanguageClient("elixirLS", // langId
    displayName, // display name
    serverOptions, clientOptions);
    client.start().then(() => {
        if (clientOptions.workspaceFolder) {
            console.log(`ElixirLS: started client for ${clientOptions.workspaceFolder.uri.toString()}`);
        }
        else {
            console.log(`ElixirLS: started default client`);
        }
    });
    return client;
}
function activate(context) {
    console.log(`ElixirLS: activating extension`);
    testElixir();
    detectConflictingExtension("mjmcloug.vscode-elixir");
    // https://github.com/elixir-lsp/vscode-elixir-ls/issues/34
    detectConflictingExtension("sammkj.vscode-elixir-formatter");
    configureCopyDebugInfo(context);
    configureExpandMacro(context);
    configureRestart(context);
    configureMixClean(context, false);
    configureMixClean(context, true);
    configureManipulatePipes(context, "fromPipe");
    configureManipulatePipes(context, "toPipe");
    configureDebugger(context);
    configureTerminalLinkProvider(context);
    configureTestController(context);
    // Options to control the language client
    const clientOptions = {
        // Register the server for Elixir documents
        // the client will iterate through this list and chose the first matching element
        documentSelector: [
            { language: "elixir", scheme: "file" },
            { language: "elixir", scheme: "untitled" },
            { language: "eex", scheme: "file" },
            { language: "eex", scheme: "untitled" },
            { language: "html-eex", scheme: "file" },
            { language: "html-eex", scheme: "untitled" },
            { language: "phoenix-heex", scheme: "file" },
            { language: "phoenix-heex", scheme: "untitled" },
            { language: "surface", scheme: "file" },
            { language: "surface", scheme: "untitled" },
        ],
        // Don't focus the Output pane on errors because request handler errors are no big deal
        revealOutputChannelOn: node_1.RevealOutputChannelOn.Never,
        synchronize: {
            // Synchronize the setting section 'elixirLS' to the server
            configurationSection: "elixirLS",
        },
    };
    function didOpenTextDocument(document) {
        // We are only interested in elixir related files
        if (["elixir", "eex", "html-eex", "phoenix-heex", "surface"].indexOf(document.languageId) < 0) {
            return;
        }
        const uri = document.uri;
        let folder = vscode_1.workspace.getWorkspaceFolder(uri);
        console.log("uri", uri, "folder", folder?.uri);
        // Files outside of workspace go to default client when no directory is open
        // otherwise they go to first workspace
        // (even if we pass undefined in clientOptions vs will pass first workspace as rootUri/rootPath)
        if (!folder) {
            if (vscode_1.workspace.workspaceFolders &&
                vscode_1.workspace.workspaceFolders.length !== 0) {
                // untitled file assigned to first workspace
                folder = vscode_1.workspace.getWorkspaceFolder(vscode_1.workspace.workspaceFolders[0].uri);
            }
            else {
                // no workspace folders - use default client
                if (!exports.defaultClient) {
                    // Create the language client and start the client.
                    exports.defaultClient = startClient(context, clientOptions);
                }
                return;
            }
        }
        // If we have nested workspace folders we only start a server on the outer most workspace folder.
        folder = getOuterMostWorkspaceFolder(folder);
        if (!clients.has(folder.uri.toString())) {
            const pattern = `${folder.uri.fsPath}/**/*`;
            // open untitled files go to the first workspace
            const untitled = folder.index === 0
                ? [
                    { language: "elixir", scheme: "untitled" },
                    { language: "eex", scheme: "untitled" },
                    { language: "html-eex", scheme: "untitled" },
                    { language: "phoenix-heex", scheme: "untitled" },
                    { language: "surface", scheme: "untitled" },
                ]
                : [];
            const workspaceClientOptions = {
                ...clientOptions,
                // the client will iterate through this list and chose the first matching element
                documentSelector: [
                    { language: "elixir", scheme: "file", pattern: pattern },
                    { language: "eex", scheme: "file", pattern: pattern },
                    { language: "html-eex", scheme: "file", pattern: pattern },
                    { language: "phoenix-heex", scheme: "file", pattern: pattern },
                    { language: "surface", scheme: "file", pattern: pattern },
                    ...untitled,
                ],
                workspaceFolder: folder,
            };
            clients.set(folder.uri.toString(), startClient(context, workspaceClientOptions));
        }
    }
    context.subscriptions.push(vscode_1.workspace.onDidOpenTextDocument(didOpenTextDocument));
    vscode_1.workspace.textDocuments.forEach(didOpenTextDocument);
    context.subscriptions.push(vscode_1.workspace.onDidChangeWorkspaceFolders((event) => {
        for (const folder of event.removed) {
            const client = clients.get(folder.uri.toString());
            if (client) {
                const uri = folder.uri.toString();
                clients.delete(uri);
                client.stop();
            }
        }
    }));
    context.subscriptions.push(vscode.tasks.registerTaskProvider(TaskProvider_1.TaskProvider.TaskType, new TaskProvider_1.TaskProvider()));
}
exports.activate = activate;
async function deactivate() {
    workspaceSubscription.dispose();
    workspaceSubscription = undefined;
    const promises = [];
    if (exports.defaultClient) {
        promises.push(exports.defaultClient.stop());
        exports.defaultClient = null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [uri, client] of clients.entries()) {
        promises.push(client.stop());
    }
    clients.clear();
    await Promise.all(promises);
}
exports.deactivate = deactivate;
function getClientByUri(uri) {
    // Files outside of workspace go to default client when no directory is open
    // otherwise they go to first workspace
    // (even if we pass undefined in clientOptions vs will pass first workspace as rootUri/rootPath)
    let folder = vscode_1.workspace.getWorkspaceFolder(uri);
    if (!folder) {
        if (vscode_1.workspace.workspaceFolders && vscode_1.workspace.workspaceFolders.length !== 0) {
            // untitled file assigned to first workspace
            folder = vscode_1.workspace.getWorkspaceFolder(vscode_1.workspace.workspaceFolders[0].uri);
        }
        else {
            // no workspace folders - use default client
            return exports.defaultClient;
        }
    }
    // If we have nested workspace folders we only start a server on the outer most workspace folder.
    folder = getOuterMostWorkspaceFolder(folder);
    return clients.get(folder.uri.toString());
}
function getClient(document) {
    // We are only interested in elixir files
    if (document.languageId !== "elixir") {
        return null;
    }
    return getClientByUri(document.uri);
}
function getProjectDir(workspaceFolder) {
    // check if projectDir is not overriden in workspace
    const projectDir = vscode.workspace
        .getConfiguration("elixirLS", workspaceFolder)
        .get("projectDir");
    return projectDir
        ? path.join(workspaceFolder.uri.fsPath, projectDir)
        : workspaceFolder.uri.fsPath;
}
function configureTestController(context) {
    console.log("creating test controller");
    const controller = vscode.tests.createTestController("elixirLSExUnitTests", "ExUnit Tests");
    context.subscriptions.push(controller);
    // First, create the `resolveHandler`. This may initially be called with
    // "undefined" to ask for all tests in the workspace to be discovered, usually
    // when the user opens the Test Explorer for the first time.
    controller.resolveHandler = async (test) => {
        if (!test) {
            await discoverAllFilesInWorkspace();
        }
        else {
            await parseTestsInFileContents(test);
        }
    };
    context.subscriptions.push(
    // When text documents are open, parse tests in them.
    vscode.workspace.onDidOpenTextDocument(parseTestsInDocument), 
    // We could also listen to document changes to re-parse unsaved changes:
    vscode.workspace.onDidChangeTextDocument((e) => parseTestsInDocument(e.document)));
    let ItemType;
    (function (ItemType) {
        ItemType[ItemType["WorkspaceFolder"] = 0] = "WorkspaceFolder";
        ItemType[ItemType["File"] = 1] = "File";
        ItemType[ItemType["Module"] = 2] = "Module";
        ItemType[ItemType["Describe"] = 3] = "Describe";
        ItemType[ItemType["TestCase"] = 4] = "TestCase";
    })(ItemType || (ItemType = {}));
    const testData = new WeakMap();
    const getType = (testItem) => testData.get(testItem) ?? ItemType.TestCase;
    function getOrCreateWorkspaceFolderTestItem(uri) {
        let workspaceFolder = vscode_1.workspace.getWorkspaceFolder(uri);
        workspaceFolder = getOuterMostWorkspaceFolder(workspaceFolder);
        const existing = controller.items.get(workspaceFolder.uri.toString());
        if (existing) {
            return existing;
        }
        const workspaceFolderTestItem = controller.createTestItem(workspaceFolder.uri.toString(), workspaceFolder.name, workspaceFolder.uri);
        workspaceFolderTestItem.canResolveChildren = true;
        workspaceFolderTestItem.range = new vscode.Range(0, 0, 0, 0);
        controller.items.add(workspaceFolderTestItem);
        testData.set(workspaceFolderTestItem, ItemType.WorkspaceFolder);
        return workspaceFolderTestItem;
    }
    // In this function, we'll get the file TestItem if we've already found it,
    // otherwise we'll create it with `canResolveChildren = true` to indicate it
    // can be passed to the `controller.resolveHandler` to gets its children.
    function getOrCreateFile(uri, projectDir) {
        const existing = controller.items.get(uri.toString());
        if (existing) {
            return existing;
        }
        const relativePath = uri.fsPath.slice(projectDir.length);
        const fileTestItem = controller.createTestItem(uri.toString(), relativePath, uri);
        fileTestItem.canResolveChildren = true;
        fileTestItem.range = new vscode.Range(0, 0, 0, 0);
        const workspaceFolderTestItem = getOrCreateWorkspaceFolderTestItem(uri);
        workspaceFolderTestItem.children.add(fileTestItem);
        testData.set(fileTestItem, ItemType.File);
        return fileTestItem;
    }
    function filterTestFile(uri, projectDir) {
        if (uri.scheme !== "file") {
            // filter out untitled and other non file
            return false;
        }
        if (!uri.path.endsWith("_test.exs")) {
            // filter out non test
            return false;
        }
        const relativePath = uri.fsPath.slice(projectDir.length);
        const pathSegments = relativePath.split("/");
        const firstSegment = pathSegments[1];
        if (firstSegment == "_build" ||
            firstSegment == "deps" ||
            firstSegment == ".elixir_ls") {
            // filter out test files in deps and _build dirs
            return false;
        }
        if (pathSegments.includes("node_modules")) {
            // exclude phoenix tests in node_module
            return false;
        }
        return true;
    }
    function parseTestsInDocument(e) {
        let workspaceFolder = vscode_1.workspace.getWorkspaceFolder(e.uri);
        if (!workspaceFolder) {
            return;
        }
        workspaceFolder = getOuterMostWorkspaceFolder(workspaceFolder);
        const projectDir = getProjectDir(workspaceFolder);
        if (filterTestFile(e.uri, projectDir)) {
            parseTestsInFileContents(getOrCreateFile(e.uri, projectDir));
        }
    }
    async function parseTestsInFileContents(file) {
        // If a document is open, VS Code already knows its contents. If this is being
        // called from the resolveHandler when a document isn't open, we'll need to
        // read them from disk ourselves.
        const client = getClientByUri(file.uri);
        const command = client.initializeResult.capabilities.executeCommandProvider.commands.find((c) => c.startsWith("getExUnitTestsInFile:"));
        const params = {
            command: command,
            arguments: [file.uri.toString()],
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = await client.sendRequest("workspace/executeCommand", params);
        for (const moduleEntry of res) {
            const moduleTestItem = controller.createTestItem(moduleEntry.module, moduleEntry.module, file.uri);
            moduleTestItem.range = new vscode.Range(moduleEntry.line, 0, moduleEntry.line, 0);
            testData.set(moduleTestItem, ItemType.Module);
            file.children.add(moduleTestItem);
            for (const describeEntry of moduleEntry.describes) {
                let describeCollection;
                if (describeEntry.describe) {
                    const describeTestItem = controller.createTestItem(describeEntry.describe, describeEntry.describe, file.uri);
                    describeTestItem.range = new vscode.Range(describeEntry.line, 0, describeEntry.line, 0);
                    describeTestItem.description = "describe";
                    testData.set(describeTestItem, ItemType.Describe);
                    moduleTestItem.children.add(describeTestItem);
                    describeCollection = describeTestItem.children;
                }
                else {
                    describeCollection = moduleTestItem.children;
                }
                for (const testEntry of describeEntry.tests) {
                    const testItem = controller.createTestItem(testEntry.name, testEntry.name, file.uri);
                    testItem.range = new vscode.Range(testEntry.line, 0, testEntry.line, 0);
                    testItem.description = testEntry.type;
                    describeCollection.add(testItem);
                }
            }
        }
    }
    async function discoverAllFilesInWorkspace() {
        if (!vscode.workspace.workspaceFolders) {
            return []; // handle the case of no open folders
        }
        console.log("calling discoverAllFilesInWorkspace");
        const outerMostWorkspaceFolders = [
            ...new Set(vscode.workspace.workspaceFolders.map((workspaceFolder) => getOuterMostWorkspaceFolder(workspaceFolder))),
        ];
        return Promise.all(outerMostWorkspaceFolders.map(async (workspaceFolder) => {
            const projectDir = getProjectDir(workspaceFolder);
            console.log("registering watcher in", workspaceFolder.name, "projectDir", projectDir);
            const pattern = new vscode.RelativePattern(projectDir, "**/*_test.exs");
            const watcher = vscode.workspace.createFileSystemWatcher(pattern);
            context.subscriptions.push(watcher);
            // When files are created, make sure there's a corresponding "file" node in the tree
            watcher.onDidCreate((uri) => getOrCreateFile(uri, projectDir));
            // When files change, re-parse them. Note that you could optimize this so
            // that you only re-parse children that have been resolved in the past.
            watcher.onDidChange((uri) => parseTestsInFileContents(getOrCreateFile(uri, projectDir)));
            // And, finally, delete TestItems for removed files. This is simple, since
            // we use the URI as the TestItem's ID.
            watcher.onDidDelete((uri) => controller.items.delete(uri.toString()));
            const files = await vscode.workspace.findFiles(pattern);
            for (const file of files) {
                if (filterTestFile(file, projectDir)) {
                    getOrCreateFile(file, projectDir);
                }
            }
            return watcher;
        }));
    }
    function writeOutput(run, output, test) {
        // output is a raw terminal, we need to wrap lines with CRLF
        // note replace("\n", "\r\n") is not working correctly
        for (const line of output.split("\n")) {
            run.appendOutput(line, undefined, test);
            run.appendOutput("\r\n", undefined, test);
        }
    }
    async function runHandler(shouldDebug, request, token) {
        const run = controller.createTestRun(request);
        const queue = [];
        // Loop through all included tests, or all known tests, and add them to our queue
        if (request.include) {
            request.include.forEach((test) => {
                queue.push(test);
                run.enqueued(test);
            });
        }
        else {
            controller.items.forEach((test) => {
                queue.push(test);
                run.enqueued(test);
            });
        }
        // For every test that was queued, try to run it. Call run.passed() or run.failed().
        // The `TestMessage` can contain extra information, like a failing location or
        // a diff output. But here we'll just give it a textual message.
        while (queue.length > 0 && !token.isCancellationRequested) {
            const test = queue.pop();
            // Skip tests the user asked to exclude
            if (request.exclude?.includes(test)) {
                continue;
            }
            switch (getType(test)) {
                case ItemType.File:
                    // If we're running a file and don't know what it contains yet, parse it now
                    if (test.children.size === 0) {
                        await parseTestsInFileContents(test);
                    }
                    break;
                case ItemType.TestCase:
                    // Otherwise, just run the test case. Note that we don't need to manually
                    // set the state of parent tests; they'll be set automatically.
                    // eslint-disable-next-line no-case-declarations
                    const start = Date.now();
                    run.started(test);
                    try {
                        let workspaceFolder = vscode_1.workspace.getWorkspaceFolder(test.uri);
                        workspaceFolder = getOuterMostWorkspaceFolder(workspaceFolder);
                        const projectDir = getProjectDir(workspaceFolder);
                        const relativePath = test.uri.fsPath.slice(projectDir.length + 1);
                        const output = await (0, runTest_1.default)({
                            cwd: projectDir,
                            filePath: relativePath,
                            line: test.range.start.line + 1,
                        }, shouldDebug);
                        writeOutput(run, output, test);
                        run.passed(test, Date.now() - start);
                    }
                    catch (e) {
                        writeOutput(run, e, test);
                        run.failed(test, new vscode.TestMessage(e), Date.now() - start);
                    }
                    break;
                default:
                    break;
            }
            test.children.forEach((test) => {
                queue.push(test);
                run.enqueued(test);
            });
        }
        // Make sure to end the run after all tests have been executed:
        run.end();
    }
    const runProfile = controller.createRunProfile("Run", vscode.TestRunProfileKind.Run, (request, token) => {
        runHandler(false, request, token);
    });
    context.subscriptions.push(runProfile);
    const debugProfile = controller.createRunProfile("Debug", vscode.TestRunProfileKind.Debug, (request, token) => {
        runHandler(true, request, token);
    });
    context.subscriptions.push(debugProfile);
    const testCommand = vscode.commands.registerCommand(commands_1.default.RUN_TEST_FROM_CODELENS, async (args) => {
        const fileTestItem = vscode.Uri.file(args.filePath);
        let workspaceFolder = vscode_1.workspace.getWorkspaceFolder(fileTestItem);
        workspaceFolder = getOuterMostWorkspaceFolder(workspaceFolder);
        const projectDir = getProjectDir(workspaceFolder);
        await parseTestsInFileContents(getOrCreateFile(fileTestItem, projectDir));
        function getTestItem(item, ids) {
            if (ids.length === 0) {
                return item;
            }
            const [id, ...rest] = ids;
            if (!id) {
                return getTestItem(item, rest);
            }
            const childItem = item.children.get(id);
            if (childItem) {
                return getTestItem(childItem, rest);
            }
            return item;
        }
        const testItem = getTestItem(controller.items.get(fileTestItem.toString()), [args.module, args.describe, args.testName]);
        runHandler(false, new vscode.TestRunRequest([testItem]), new vscode.CancellationTokenSource().token);
        vscode.commands.executeCommand("vscode.revealTestInExplorer", testItem);
    });
    context.subscriptions.push(testCommand);
}
//# sourceMappingURL=extension.js.map