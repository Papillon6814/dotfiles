"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageClientManager = void 0;
const vscode = require("vscode");
const node_1 = require("vscode-languageclient/node");
const project_1 = require("./project");
const executable_1 = require("./executable");
const languageIds = ["elixir", "eex", "html-eex", "phoenix-heex", "surface"];
const defaultDocumentSelector = languageIds.flatMap((language) => [
    { language, scheme: "file" },
    { language, scheme: "untitled" },
]);
const untitledDocumentSelector = languageIds.map((language) => ({
    language,
    scheme: "untitled",
}));
const patternDocumentSelector = (pattern) => languageIds.map((language) => ({ language, scheme: "file", pattern }));
// Options to control the language client
const clientOptions = {
    // Register the server for Elixir documents
    // the client will iterate through this list and chose the first matching element
    documentSelector: defaultDocumentSelector,
    // Don't focus the Output pane on errors because request handler errors are no big deal
    revealOutputChannelOn: node_1.RevealOutputChannelOn.Never,
    synchronize: {
        // Synchronize the setting section 'elixirLS' to the server
        configurationSection: "elixirLS",
    },
};
function startClient(context, clientOptions) {
    const serverOpts = {
        command: (0, executable_1.buildCommand)(context, "language_server", clientOptions.workspaceFolder),
    };
    // If the extension is launched in debug mode then the `debug` server options are used instead of `run`
    // currently we pass the same options regardless of the mode
    const serverOptions = {
        run: serverOpts,
        debug: serverOpts,
    };
    let displayName;
    if (clientOptions.workspaceFolder) {
        console.log(`ElixirLS: starting LSP client for ${clientOptions.workspaceFolder.uri.fsPath} with server options`, serverOptions, "client options", clientOptions);
        displayName = `ElixirLS - ${clientOptions.workspaceFolder.name}`;
    }
    else {
        console.log(`ElixirLS: starting default LSP client with server options`, serverOptions, "client options", clientOptions);
        displayName = "ElixirLS - (default)";
    }
    const client = new node_1.LanguageClient("elixirLS", // langId
    displayName, // display name
    serverOptions, clientOptions);
    const clientPromise = new Promise((resolve) => {
        client.start().then(() => {
            if (clientOptions.workspaceFolder) {
                console.log(`ElixirLS: started LSP client for ${clientOptions.workspaceFolder.uri.toString()}`);
            }
            else {
                console.log(`ElixirLS: started default LSP client`);
            }
            resolve(client);
        });
    });
    return [client, clientPromise];
}
class LanguageClientManager {
    get onDidChange() {
        return this._onDidChange.event;
    }
    constructor(workspaceTracker) {
        this.defaultClient = null;
        this.defaultClientPromise = null;
        this.clients = new Map();
        this.clientsPromises = new Map();
        this._onDidChange = new vscode.EventEmitter();
        this._workspaceTracker = workspaceTracker;
    }
    getDefaultClient() {
        return this.defaultClient;
    }
    allClients() {
        const result = [...this.clients.values()];
        if (this.defaultClient) {
            result.push(this.defaultClient);
        }
        return result;
    }
    getClientByUri(uri) {
        // Files outside of workspace go to default client when no directory is open
        // otherwise they go to first workspace
        // (even if we pass undefined in clientOptions vs will pass first workspace as rootUri/rootPath)
        let folder = vscode.workspace.getWorkspaceFolder(uri);
        if (!folder) {
            if (vscode.workspace.workspaceFolders &&
                vscode.workspace.workspaceFolders.length !== 0) {
                // untitled: and file: outside workspace folders assigned to first workspace
                folder = vscode.workspace.workspaceFolders[0];
            }
            else {
                // no workspace folders - use default client
                if (this.defaultClient) {
                    return this.defaultClient;
                }
                else {
                    throw "default client LSP not started";
                }
            }
        }
        // If we have nested workspace folders we only start a server on the outer most workspace folder.
        folder = this._workspaceTracker.getOuterMostWorkspaceFolder(folder);
        const client = this.clients.get(folder.uri.toString());
        if (client) {
            return client;
        }
        else {
            throw `LSP client for ${folder.uri.toString()} not started`;
        }
    }
    getClientPromiseByUri(uri) {
        // Files outside of workspace go to default client when no directory is open
        // otherwise they go to first workspace
        // (even if we pass undefined in clientOptions vs will pass first workspace as rootUri/rootPath)
        let folder = vscode.workspace.getWorkspaceFolder(uri);
        if (!folder) {
            if (vscode.workspace.workspaceFolders &&
                vscode.workspace.workspaceFolders.length !== 0) {
                // untitled: and file: outside workspace folders assigned to first workspace
                folder = vscode.workspace.workspaceFolders[0];
            }
            else {
                // no folders - use default client
                return this.defaultClientPromise;
            }
        }
        // If we have nested workspace folders we only start a server on the outer most workspace folder.
        folder = this._workspaceTracker.getOuterMostWorkspaceFolder(folder);
        return this.clientsPromises.get(folder.uri.toString());
    }
    getClientByDocument(document) {
        // We are only interested in elixir files
        if (document.languageId !== "elixir") {
            return null;
        }
        return this.getClientByUri(document.uri);
    }
    handleDidOpenTextDocument(document, context) {
        // We are only interested in elixir related files
        if (!languageIds.includes(document.languageId)) {
            return;
        }
        const uri = document.uri;
        let folder = vscode.workspace.getWorkspaceFolder(uri);
        // Files outside of workspace go to default client when no workspace folder is open
        // otherwise they go to first workspace
        // NOTE
        // even if we pass undefined in clientOptions and try to create a default client
        // vscode will pass first workspace as rootUri/rootPath and we will have 2 servers
        // running in the same directory
        if (!folder) {
            if (vscode.workspace.workspaceFolders &&
                vscode.workspace.workspaceFolders.length !== 0) {
                // untitled: or file: outside the workspace folders assigned to first workspace
                folder = vscode.workspace.workspaceFolders[0];
            }
            else {
                // no workspace - use default client
                if (!this.defaultClient) {
                    // Create the language client and start the client
                    // the client will get all requests from untitled: file:
                    [this.defaultClient, this.defaultClientPromise] = startClient(context, clientOptions);
                    this._onDidChange.fire();
                }
                return;
            }
        }
        // If we have nested workspace folders we only start a server on the outer most workspace folder.
        folder = this._workspaceTracker.getOuterMostWorkspaceFolder(folder);
        if (!this.clients.has(folder.uri.toString())) {
            let documentSelector;
            if (this._workspaceTracker.mode === project_1.WorkspaceMode.MULTI_ROOT) {
                // multi-root workspace
                // create document selector with glob pattern that will match files
                // in that directory
                const pattern = `${folder.uri.fsPath}/**/*`;
                // additionally if this is the first workspace add untitled schema files
                // NOTE that no client will match file: outside any of the workspace folders
                // if we passed a glob allowing any file the first server would get requests form
                // other workspace folders
                const maybeUntitledDocumentSelector = folder.index === 0 ? untitledDocumentSelector : [];
                documentSelector = [
                    ...patternDocumentSelector(pattern),
                    ...maybeUntitledDocumentSelector,
                ];
            }
            else if (this._workspaceTracker.mode === project_1.WorkspaceMode.SINGLE_FOLDER) {
                // single folder workspace
                // no need to filter with glob patterns
                // the client will get all requests even from untitled: and files outside
                // workspace folder
                documentSelector = defaultDocumentSelector;
            }
            else if (this._workspaceTracker.mode === project_1.WorkspaceMode.NO_WORKSPACE) {
                throw "this should not happen";
            }
            const workspaceClientOptions = {
                ...clientOptions,
                // the client will iterate through this list and chose the first matching element
                documentSelector: documentSelector,
                workspaceFolder: folder,
            };
            const [client, clientPromise] = startClient(context, workspaceClientOptions);
            this.clients.set(folder.uri.toString(), client);
            this.clientsPromises.set(folder.uri.toString(), clientPromise);
            this._onDidChange.fire();
        }
    }
    async deactivate() {
        const clientStartPromises = [];
        const clientsToDispose = [];
        let changed = false;
        if (this.defaultClient) {
            clientStartPromises.push(this.defaultClientPromise);
            clientsToDispose.push(this.defaultClient);
            this.defaultClient = null;
            this.defaultClientPromise = null;
            changed = true;
        }
        for (const [uri, client] of this.clients.entries()) {
            clientStartPromises.push(this.clientsPromises.get(uri));
            clientsToDispose.push(client);
            changed = true;
        }
        this.clients.clear();
        this.clientsPromises.clear();
        if (changed) {
            this._onDidChange.fire();
        }
        // need to await - disposing or stopping a starting client crashes
        // in vscode-languageclient 8.1.0
        // https://github.com/microsoft/vscode-languageserver-node/blob/d859bb14d1bcb3923eecaf0ef587e55c48502ccc/client/src/common/client.ts#L1311
        try {
            await Promise.all(clientStartPromises);
        }
        catch {
            /* no reason to log here */
        }
        try {
            // dispose can timeout
            await Promise.all(clientsToDispose.map((client) => client.dispose()));
        }
        catch {
            /* no reason to log here */
        }
    }
    async handleWorkspaceFolderRemoved(folder) {
        const uri = folder.uri.toString();
        const client = this.clients.get(uri);
        if (client) {
            console.log("ElixirLS: Stopping LSP client for", folder.uri.fsPath);
            const clientPromise = this.clientsPromises.get(uri);
            this.clients.delete(uri);
            this.clientsPromises.delete(uri);
            this._onDidChange.fire();
            // need to await - disposing or stopping a starting client crashes
            // in vscode-languageclient 8.1.0
            // https://github.com/microsoft/vscode-languageserver-node/blob/d859bb14d1bcb3923eecaf0ef587e55c48502ccc/client/src/common/client.ts#L1311
            try {
                await clientPromise;
            }
            catch (e) {
                console.warn("ElixirLS: error during wait for stoppable LSP client state", e);
            }
            try {
                // dispose can timeout
                await client.dispose();
            }
            catch (e) {
                console.warn("ElixirLS: error during LSP client dispose", e);
            }
        }
    }
}
exports.LanguageClientManager = LanguageClientManager;
//# sourceMappingURL=languageClientManager.js.map