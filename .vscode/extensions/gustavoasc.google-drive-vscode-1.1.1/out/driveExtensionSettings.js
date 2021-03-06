"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriveExtensionSettings = void 0;
const vscode_1 = require("vscode");
const EXTENSION_SETTINGS_GROUP = 'google.drive';
const MISSING_CREDENTIALS = 'alertMissingCredentials';
class DriveExtensionSettings {
    isAlertMissingCredentials() {
        return settingsGroup().get(MISSING_CREDENTIALS, true);
    }
    updateAlertMissingCredentials(value) {
        return settingsGroup().update(MISSING_CREDENTIALS, value, vscode_1.ConfigurationTarget.Global);
    }
}
exports.DriveExtensionSettings = DriveExtensionSettings;
function settingsGroup() {
    return vscode_1.workspace.getConfiguration(EXTENSION_SETTINGS_GROUP);
}
//# sourceMappingURL=driveExtensionSettings.js.map