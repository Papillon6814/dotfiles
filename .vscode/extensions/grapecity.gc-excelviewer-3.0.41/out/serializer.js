'use strict';
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
exports.ExcelSerializer = exports.CsvSerializer = void 0;
const vscode_1 = require("vscode");
const csvPreview_1 = require("./csvPreview");
const excelPreview_1 = require("./excelPreview");
class CsvSerializer {
    constructor(context) {
        this._context = context;
    }
    deserializeWebviewPanel(webviewPanel, state) {
        return __awaiter(this, void 0, void 0, function* () {
            csvPreview_1.default.revive(this._context, vscode_1.Uri.parse(state.uri), webviewPanel);
        });
    }
}
exports.CsvSerializer = CsvSerializer;
class ExcelSerializer {
    constructor(context) {
        this._context = context;
    }
    deserializeWebviewPanel(webviewPanel, state) {
        return __awaiter(this, void 0, void 0, function* () {
            excelPreview_1.default.revive(this._context, vscode_1.Uri.parse(state.uri), webviewPanel);
        });
    }
}
exports.ExcelSerializer = ExcelSerializer;
//# sourceMappingURL=serializer.js.map