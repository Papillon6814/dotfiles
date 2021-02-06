"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
require("mocha");
const driveModel_1 = require("../../../drive/model/driveModel");
const driveController_1 = require("../../../drive/controller/driveController");
const abstractFileProvider_test_1 = require("../model/abstractFileProvider.test");
const fileSystemConstants_1 = require("../../../drive/fileSystem/fileSystemConstants");
const abstractDriveView_test_1 = require("../view/abstractDriveView.test");
describe('Drive controller operations', () => {
    it('Uploads file with invalid scheme', () => {
        const model = new driveModel_1.DriveModel(new abstractFileProvider_test_1.EmptyMockFileProvider());
        const view = new WrongSchemeDriveView();
        const controller = new driveController_1.DriveController(model, view);
        controller.uploadFileAndAskFolder(fileSystemConstants_1.DRIVE_SCHEME, './extension.ts');
        chai_1.expect(true).to.equal(view.warningShown);
    });
    it('Uploads file with valid scheme but user canceled', () => {
        const model = new driveModel_1.DriveModel(new abstractFileProvider_test_1.EmptyMockFileProvider());
        const view = new UploadCanceledDriveView();
        const controller = new driveController_1.DriveController(model, view);
        controller.uploadFileAndAskFolder('file://', './extension.ts');
    });
});
class WrongSchemeDriveView extends abstractDriveView_test_1.AbstractDriveView {
    constructor() {
        super(...arguments);
        this.warningShown = false;
    }
    showWarningMessage(message) {
        this.warningShown = true;
        chai_1.expect(`It's not possible to proceed with upload operation since file is already on Google Drive.`).to.equal(message);
    }
}
class UploadCanceledDriveView extends abstractDriveView_test_1.AbstractDriveView {
    constructor() {
        super(...arguments);
        this.warningShown = false;
    }
    askForRemoteDestinationFolder() {
        return new Promise(resolve => {
            resolve(undefined);
        });
    }
    showWarningMessage(message) {
        this.warningShown = true;
        chai_1.expect(`'Upload file' process canceled by user.`).to.equal(message);
    }
}
//# sourceMappingURL=driveController.test.js.map