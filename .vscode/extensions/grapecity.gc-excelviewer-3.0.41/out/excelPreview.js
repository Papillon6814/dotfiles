'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const basePreview_1 = require("./basePreview");
class ExcelPreview extends basePreview_1.default {
    static create(context, uri, viewColumn) {
        let preview = new ExcelPreview(context, uri, "excel-preview");
        preview.initWebviewPanel(viewColumn);
        preview.handleEvents();
        return preview;
    }
    static revive(context, uri, webviewPanel) {
        let preview = new ExcelPreview(context, uri, "excel-preview");
        preview.attachWebviewPanel(webviewPanel);
        preview.handleEvents();
        return preview;
    }
    getOptions() {
        return {
            uri: this.uri.toString(),
            previewUri: this.previewUri.toString(),
            state: this.state
        };
    }
    refresh() {
        let self = this;
        vscode_1.workspace.fs.readFile(this.uri).then(buffer => {
            self.webview.postMessage({
                refresh: true,
                content: buffer
            });
        }, reason => {
            vscode_1.window.showInformationMessage(reason);
        });
    }
    getHtml(ignoreState = false) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
        <link href="${this.extensionUrl}/styles/wijmo.min.css" rel="stylesheet" type="text/css" />
        <link href="${this.extensionUrl}/styles/vscode.css" rel="stylesheet" type="text/css" />
        </head>
        <script src="${this.extensionUrl}/controls/wijmo.min.js" type="text/javascript"></script>
        <script src="${this.extensionUrl}/controls/wijmo.input.min.js" type="text/javascript"></script>
        <script src="${this.extensionUrl}/controls/wijmo.grid.min.js" type="text/javascript"></script>
        <script src="${this.extensionUrl}/controls/wijmo.grid.filter.min.js" type="text/javascript"></script>
        <script src="${this.extensionUrl}/controls/wijmo.grid.sheet.min.js" type="text/javascript"></script>
        <script src="${this.extensionUrl}/controls/wijmo.grid.xlsx.min.js" type="text/javascript"></script>
        <script src="${this.extensionUrl}/controls/wijmo.xlsx.min.js" type="text/javascript"></script>
        <script src="${this.extensionUrl}/jszip.min.js"></script>
        <script src="${this.extensionUrl}/excel.js"></script>
        <body style="padding:0px; overflow:hidden" onload="resizeSheet()" onresize="resizeSheet()">
            <div id="sheet"></div>
        </body>
        <script type="text/javascript">
            const key = "GrapeCity-vscode-webview-only,911384715638811#B08IKpjIEJCLi4TPntSb9cERjlkSZJDbBhGMRlXUk5kV4dzL6UzUBtUVaxWawRHVMdmNiVzVD96cYJ4VuZ6dv3UbWFWYIJVNzBDTO34QGBzVvYleBNjZVt6SVdHWUVVbXV7cPRHRrZ4cQVTTH3WR4M4YwFnS9F5K7FWN6lFajpmdvYFdOdlV7UFS9tybE5kUidnWxFnTyZFSw4ESCh4LRZEamVDROJFeGBVNoV6cwklT89WOvQXcQZmM6dlQw2yTrcFdUhEd9dUQZFlaSN6UBpWawsGTxMGTZtkUQNFZCZ7YXVlNNFmcYxmMntCWsxkW4FUYV5GNwVldTZjWHtmWvdUZiJXe6g6dX9UcORzbityYPdzVrdFNS54TrU5UjZ7K43Sd5kTQOdFMEVXUwRTOwNVRsd6M0VGemlDc4JmWZpGUrMkS4QjYpN4cvBnew5kd6E4MV3WMkBTZHlEbGJ6ZXdGaiojITJCLiYzN9IjNEJTMiojIIJCLyEDM4QzM6EDN0IicfJye#4Xfd5nIJBjMSJiOiMkIsIibvl6cuVGd8VEIgQXZlh6U8VGbGBybtpWaXJiOi8kI1xSfiUTSOFlI0IyQiwiIu3Waz9WZ4hXRgAicldXZpZFdy3GclJFIv5mapdlI0IiTisHL3JyS7gDSiojIDJCLi86bpNnblRHeFBCI73mUpRHb55EIv5mapdlI0IiTisHL3JCNGZDRiojIDJCLi86bpNnblRHeFBCIQFETPBCIv5mapdlI0IiTisHL3JyMDBjQiojIDJCLiUmcvNEIv5mapdlI0IiTisHL3JSV8cTQiojIDJCLi86bpNnblRHeFBCI4JXYoNEbhl6YuFmbpZEIv5mapdlI0IiTis7W0ICZyBlIsISM5YDNyADIxAjMwEjMwIjI0ICdyNkIsICMygDMxIDMyIiOiAHeFJCLikHdpNUZwFmcHJiOiEmTDJCLiETM8gzM6UTM7QDOzETM9IiOiQWSiwSfiEjdxIDMyIiOiIXZ6JCLlNHbhZmOiI7ckJye0IUbcF";
            wijmo.setLicenseKey(key);
            function ignoreState() {
                return ${ignoreState};
            }
            function getOptions() {
                return ${JSON.stringify(this.getOptions())};
            }
            initPage();
        </script>
        </html>`;
    }
    get viewType() {
        return "gc-excelviewer-excel";
    }
}
exports.default = ExcelPreview;
//# sourceMappingURL=excelPreview.js.map