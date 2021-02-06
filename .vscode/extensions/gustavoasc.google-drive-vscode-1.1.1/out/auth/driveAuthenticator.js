"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriveAuthenticator = void 0;
const vscode_1 = require("vscode");
const credentialsManager_1 = require("../drive/credentials/credentialsManager");
const { google } = require('googleapis');
const fs = require("fs");
const extension_1 = require("../extension");
// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
class DriveAuthenticator {
    constructor(credentialsManager) {
        this.credentialsManager = credentialsManager;
    }
    checkCredentialsConfigured() {
        return new Promise((resolve, reject) => {
            this.credentialsManager.retrievePassword(credentialsManager_1.CREDENTIALS_JSON_SERVICE)
                .then(() => resolve())
                .catch(err => reject(err));
        });
    }
    storeApiCredentials(apiCredentialsJsonFile) {
        return new Promise((resolve, reject) => {
            fs.readFile(apiCredentialsJsonFile, (err, content) => {
                if (err) {
                    return reject(err);
                }
                this.credentialsManager.storePassword(content.toString(), credentialsManager_1.CREDENTIALS_JSON_SERVICE)
                    .then(() => {
                    // Credentials have been successfully stored.
                    // So, we need to check whether any remaining auth token exists
                    this.credentialsManager.retrievePassword(credentialsManager_1.TOKENS_JSON_SERVICE)
                        .then(() => {
                        // A remaining auth token really exists, so remove it
                        // from operating system key vault
                        this.credentialsManager.removePassword(credentialsManager_1.TOKENS_JSON_SERVICE)
                            .then(() => resolve())
                            .catch(err => reject(err));
                        resolve();
                    }).catch(() => {
                        // It's okay to be here because there was no remaining
                        // auth token
                        resolve();
                    });
                })
                    .catch(err => reject(err));
            });
        });
    }
    authenticate() {
        return new Promise((resolve, reject) => {
            // Checks whether the authorization flow has already
            // been done before
            if (this.isAuthenticated()) {
                return resolve(this.oAuth2Client);
            }
            // Authentication needs to be done before any operation on 
            // Google Drive API
            this.credentialsManager.retrievePassword(credentialsManager_1.CREDENTIALS_JSON_SERVICE)
                .then(originalJson => {
                // User has already configured credentials.json so use it to
                // proceed with the authorization flow 
                const credentialsJson = JSON.parse(originalJson.toString());
                this.authorize(credentialsJson)
                    .then(() => resolve(this.oAuth2Client))
                    .catch(err => reject(err));
            }).catch(err => {
                // Credentials have not been configured yet, so there is no way to proceed
                // with authorization flow
                this.showMissingCredentialsMessage();
                // Rejects current authentication
                reject(err);
            });
        });
    }
    showMissingCredentialsMessage() {
        const configureButton = 'Configure credentials';
        vscode_1.window.showWarningMessage(`The operation cannot proceed since Google Drive API credentials haven't been configured. Please configure the credentials and try again.`, configureButton)
            .then(selectedButton => {
            if (selectedButton === configureButton) {
                vscode_1.commands.executeCommand(extension_1.CONFIGURE_CREDENTIALS_COMMAND);
            }
        });
    }
    isAuthenticated() {
        return this.oAuth2Client && this.token;
    }
    authorize(credentials) {
        return new Promise((resolve, reject) => {
            const { client_secret, client_id, redirect_uris } = credentials.installed;
            this.oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
            this.credentialsManager.retrievePassword(credentialsManager_1.TOKENS_JSON_SERVICE)
                .then(token => {
                const tokenJson = JSON.parse(token.toString());
                this.oAuth2Client.setCredentials(tokenJson);
                resolve();
            }).catch(() => {
                // We don't have the auth token yet, so open external browser
                // to ask user the required access
                this.getAccessToken()
                    .then(() => resolve())
                    .catch((err) => reject(err));
            });
        });
    }
    getAccessToken() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const authUrl = this.oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES });
                vscode_1.window.showInformationMessage('Authorize this app by visiting the external URL and paste in the auth token');
                const opened = yield vscode_1.env.openExternal(vscode_1.Uri.parse(authUrl));
                if (!opened) {
                    // User has cancelled the authorization flow
                    vscode_1.window.showWarningMessage('Authorization flow canceled by user.');
                    return reject();
                }
                const authToken = yield vscode_1.window.showInputBox({
                    ignoreFocusOut: true,
                    prompt: 'Paste here the auth token'
                });
                if (authToken) {
                    this.oAuth2Client.getToken(authToken, (err, token) => {
                        if (err) {
                            return reject(err);
                        }
                        this.token = token;
                        const stringified = JSON.stringify(this.token);
                        this.credentialsManager.storePassword(stringified, credentialsManager_1.TOKENS_JSON_SERVICE)
                            .then(() => {
                            this.oAuth2Client.setCredentials(this.token);
                            vscode_1.window.showInformationMessage('Authorization completed! Now you can access your drive files through VSCode.');
                            resolve();
                        }).catch(err => reject(err));
                    });
                }
                else {
                    // User has cancelled the authorization flow
                    vscode_1.window.showWarningMessage('Authorization flow canceled by user.');
                    reject();
                }
            }));
        });
    }
}
exports.DriveAuthenticator = DriveAuthenticator;
//# sourceMappingURL=driveAuthenticator.js.map