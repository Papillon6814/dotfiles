'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const basePreview_1 = require("./basePreview");
class CsvPreview extends basePreview_1.default {
    static create(context, uri, viewColumn) {
        let preview = new CsvPreview(context, uri, "csv-preview");
        preview.initWebviewPanel(viewColumn);
        preview.handleEvents();
        return preview;
    }
    static revive(context, uri, webviewPanel) {
        let preview = new CsvPreview(context, uri, "csv-preview");
        preview.attachWebviewPanel(webviewPanel);
        preview.handleEvents();
        return preview;
    }
    getOptions() {
        let sep = this.separator;
        let document = vscode_1.workspace.textDocuments.find(document => {
            return document.uri.toString() === this.uri.toString();
        });
        let lang = document ? document.languageId : this.state.languageId;
        if (lang === 'tsv') {
            sep = "\t";
        }
        else if (lang === 'csv (semicolon)') {
            sep = ";";
        }
        else if (lang === 'csv (pipe)') {
            sep = "\\|";
        }
        return {
            separator: sep,
            languageId: lang,
            quoteMark: this.quoteMark,
            hasHeaders: this.hasHeaders,
            capitalizeHeaders: this.capitalizeHeaders,
            resizeColumns: this.resizeColumns,
            lineNumbers: this.lineNumbers,
            commentCharacter: this.commentCharacter,
            skipComments: this.skipComments,
            formatValues: this.formatValues,
            numberFormat: this.numberFormat,
            uri: this.uri.toString(),
            previewUri: this.previewUri.toString(),
            state: this.state
        };
    }
    refresh() {
        let self = this;
        vscode_1.workspace.openTextDocument(this.uri).then(document => {
            self.webview.postMessage({
                refresh: true,
                content: document.getText()
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
        <script src="${this.extensionUrl}/csv.js"></script>
        <body style="padding:0px; overflow:hidden" onload="resizeGrid()" onresize="resizeGrid()">
            <div id="flex"></div>
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
        return "gc-excelviewer-csv";
    }
    get separator() {
        return vscode_1.workspace.getConfiguration('csv-preview').get("separator");
    }
    get quoteMark() {
        return vscode_1.workspace.getConfiguration('csv-preview').get("quoteMark");
    }
    get hasHeaders() {
        return vscode_1.workspace.getConfiguration('csv-preview').get("hasHeaders");
    }
    get capitalizeHeaders() {
        return vscode_1.workspace.getConfiguration('csv-preview').get("capitalizeHeaders");
    }
    get resizeColumns() {
        return vscode_1.workspace.getConfiguration('csv-preview').get("resizeColumns");
    }
    get lineNumbers() {
        return vscode_1.workspace.getConfiguration('csv-preview').get("lineNumbers");
    }
    get commentCharacter() {
        return vscode_1.workspace.getConfiguration('csv-preview').get("commentCharacter");
    }
    get skipComments() {
        return vscode_1.workspace.getConfiguration('csv-preview').get("skipComments");
    }
    get formatValues() {
        return vscode_1.workspace.getConfiguration('csv-preview').get("formatValues");
    }
    get numberFormat() {
        return vscode_1.workspace.getConfiguration('csv-preview').get("numberFormat");
    }
}
exports.default = CsvPreview;
//# sourceMappingURL=csvPreview.js.map