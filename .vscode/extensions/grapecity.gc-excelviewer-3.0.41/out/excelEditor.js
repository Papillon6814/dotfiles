"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelProvider = void 0;
const dispose_1 = require("./dispose");
class ExcelDocument extends dispose_1.Disposable {
}
class ExcelProvider {
    openCustomDocument(uri, openContext, token) {
        throw new Error("Method not implemented.");
    }
    resolveCustomEditor(document, webviewPanel, token) {
        throw new Error("Method not implemented.");
    }
}
exports.ExcelProvider = ExcelProvider;
//# sourceMappingURL=excelEditor.js.map