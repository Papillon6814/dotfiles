"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeytarCredentialsProvider = void 0;
const keytar = require("keytar");
class KeytarCredentialsProvider {
    getPassword(service, account) {
        return keytar.getPassword(service, account);
    }
    setPassword(service, account, password) {
        return keytar.setPassword(service, account, password);
    }
    deletePassword(service, account) {
        return keytar.deletePassword(service, account);
    }
}
exports.KeytarCredentialsProvider = KeytarCredentialsProvider;
//# sourceMappingURL=keytarCredentialsProvider.js.map