"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleDriveFileProvider = void 0;
const driveTypeConverter_1 = require("./driveTypeConverter");
const fs = require("fs");
const { google } = require('googleapis');
const HTTP_RESPONSE_OK = 200;
class GoogleDriveFileProvider {
    constructor(authenticator) {
        this.authenticator = authenticator;
        this.typeConverter = new driveTypeConverter_1.DriveTypeConverter();
    }
    provideFiles(parentFolderId) {
        return new Promise((resolve, reject) => {
            this.authenticator.authenticate().then((auth) => {
                const listParams = {
                    q: `'${parentFolderId}' in parents and trashed = false`,
                    orderBy: 'folder,name',
                    pageSize: 1000,
                    fields: 'nextPageToken, files(id, name, iconLink, mimeType, size, modifiedTime, createdTime)'
                };
                const callbackFn = (err, res) => {
                    if (err) {
                        return reject(err);
                    }
                    const apiFiles = res.data.files;
                    const convertedFiles = this.typeConverter.fromApiToTypescript(apiFiles);
                    resolve(convertedFiles);
                };
                drive(auth).files.list(listParams, callbackFn);
            }).catch(err => reject(err));
        });
    }
    uploadFile(parentFolderId, fullFileName, basename, mimeType) {
        return new Promise((resolve, reject) => {
            this.authenticator.authenticate().then((auth) => {
                const fileMetadata = {
                    'name': basename,
                    'parents': [parentFolderId]
                };
                const media = {
                    mimeType: mimeType,
                    body: fs.createReadStream(fullFileName).on('error', err => reject(err.message))
                };
                const callbackFn = ((err, _file) => {
                    err ? reject(err) : resolve();
                });
                drive(auth).files.create({
                    resource: fileMetadata,
                    media: media,
                    fields: 'id'
                }, callbackFn);
            }).catch(err => reject(err));
        });
    }
    createFolder(parentFolderId, folderName) {
        return new Promise((resolve, reject) => {
            this.authenticator.authenticate().then((auth) => {
                const fileMetadata = {
                    'name': folderName,
                    'mimeType': 'application/vnd.google-apps.folder',
                    'parents': [parentFolderId]
                };
                drive(auth).files.create({ resource: fileMetadata })
                    .then((response) => response.status == HTTP_RESPONSE_OK ? resolve() : reject())
                    .catch(() => reject());
            }).catch(err => reject(err));
        });
    }
    retrieveFileContentStream(fileId) {
        return new Promise((resolve, reject) => {
            this.authenticator.authenticate().then((auth) => {
                const getParams = {
                    'fileId': fileId,
                    'alt': 'media'
                };
                const responseType = { responseType: 'stream' };
                const callbackFn = (err, response) => {
                    err ? reject(err) : resolve(response.data);
                };
                drive(auth).files.get(getParams, responseType, callbackFn);
            }).catch(err => reject(err));
        });
    }
    renameFile(fileId, newName) {
        return new Promise((resolve, reject) => {
            this.authenticator.authenticate().then((auth) => {
                const resource = {
                    name: newName
                };
                const updateParams = {
                    fileId: fileId,
                    resource: resource
                };
                const callbackFn = (err, _response) => {
                    err ? reject(err) : resolve();
                };
                drive(auth).files.update(updateParams, callbackFn);
            }).catch(err => reject(err));
        });
    }
}
exports.GoogleDriveFileProvider = GoogleDriveFileProvider;
function drive(auth) {
    const drive = google.drive({ version: 'v3', auth });
    return drive;
}
//# sourceMappingURL=googleDriveFileProvider.js.map