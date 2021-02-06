module.exports=function(e){var t={};function i(r){if(t[r])return t[r].exports;var s=t[r]={i:r,l:!1,exports:{}};return e[r].call(s.exports,s,s.exports,i),s.l=!0,s.exports}return i.m=e,i.c=t,i.d=function(e,t,r){i.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},i.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},i.t=function(e,t){if(1&t&&(e=i(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(i.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var s in e)i.d(r,s,function(t){return e[t]}.bind(null,s));return r},i.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return i.d(t,"a",t),t},i.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},i.p="",i(i.s=6)}([function(e,t){e.exports=require("vscode")},function(e,t,i){"use strict";Object.defineProperty(t,"__esModule",{value:!0});const r=i(0),s=i(2);class n extends s.default{static create(e,t,i){let r=new n(e,t,"csv-preview");return r.initWebviewPanel(i),r.handleEvents(),r}static revive(e,t,i){let r=new n(e,t,"csv-preview");return r.attachWebviewPanel(i),r.handleEvents(),r}getOptions(){let e=this.separator,t=r.workspace.textDocuments.find(e=>e.uri.toString()===this.uri.toString()),i=t?t.languageId:this.state.languageId;return"tsv"===i?e="\t":"csv (semicolon)"===i?e=";":"csv (pipe)"===i&&(e="\\|"),{separator:e,languageId:i,quoteMark:this.quoteMark,hasHeaders:this.hasHeaders,capitalizeHeaders:this.capitalizeHeaders,resizeColumns:this.resizeColumns,lineNumbers:this.lineNumbers,commentCharacter:this.commentCharacter,skipComments:this.skipComments,formatValues:this.formatValues,numberFormat:this.numberFormat,uri:this.uri.toString(),previewUri:this.previewUri.toString(),state:this.state}}refresh(){let e=this;r.workspace.openTextDocument(this.uri).then(t=>{e.webview.postMessage({refresh:!0,content:t.getText()})},e=>{r.window.showInformationMessage(e)})}getHtml(e=!1){return`\n        <!DOCTYPE html>\n        <html>\n        <head>\n            <link href="${this.extensionUrl}/styles/wijmo.min.css" rel="stylesheet" type="text/css" />\n            <link href="${this.extensionUrl}/styles/vscode.css" rel="stylesheet" type="text/css" />\n        </head>\n        <script src="${this.extensionUrl}/controls/wijmo.min.js" type="text/javascript"><\/script>\n        <script src="${this.extensionUrl}/controls/wijmo.input.min.js" type="text/javascript"><\/script>\n        <script src="${this.extensionUrl}/controls/wijmo.grid.min.js" type="text/javascript"><\/script>\n        <script src="${this.extensionUrl}/controls/wijmo.grid.filter.min.js" type="text/javascript"><\/script>\n        <script src="${this.extensionUrl}/csv.js"><\/script>\n        <body style="padding:0px; overflow:hidden" onload="resizeGrid()" onresize="resizeGrid()">\n            <div id="flex"></div>\n        </body>\n        <script type="text/javascript">\n            const key = "GrapeCity-vscode-webview-only,911384715638811#B08IKpjIEJCLi4TPntSb9cERjlkSZJDbBhGMRlXUk5kV4dzL6UzUBtUVaxWawRHVMdmNiVzVD96cYJ4VuZ6dv3UbWFWYIJVNzBDTO34QGBzVvYleBNjZVt6SVdHWUVVbXV7cPRHRrZ4cQVTTH3WR4M4YwFnS9F5K7FWN6lFajpmdvYFdOdlV7UFS9tybE5kUidnWxFnTyZFSw4ESCh4LRZEamVDROJFeGBVNoV6cwklT89WOvQXcQZmM6dlQw2yTrcFdUhEd9dUQZFlaSN6UBpWawsGTxMGTZtkUQNFZCZ7YXVlNNFmcYxmMntCWsxkW4FUYV5GNwVldTZjWHtmWvdUZiJXe6g6dX9UcORzbityYPdzVrdFNS54TrU5UjZ7K43Sd5kTQOdFMEVXUwRTOwNVRsd6M0VGemlDc4JmWZpGUrMkS4QjYpN4cvBnew5kd6E4MV3WMkBTZHlEbGJ6ZXdGaiojITJCLiYzN9IjNEJTMiojIIJCLyEDM4QzM6EDN0IicfJye#4Xfd5nIJBjMSJiOiMkIsIibvl6cuVGd8VEIgQXZlh6U8VGbGBybtpWaXJiOi8kI1xSfiUTSOFlI0IyQiwiIu3Waz9WZ4hXRgAicldXZpZFdy3GclJFIv5mapdlI0IiTisHL3JyS7gDSiojIDJCLi86bpNnblRHeFBCI73mUpRHb55EIv5mapdlI0IiTisHL3JCNGZDRiojIDJCLi86bpNnblRHeFBCIQFETPBCIv5mapdlI0IiTisHL3JyMDBjQiojIDJCLiUmcvNEIv5mapdlI0IiTisHL3JSV8cTQiojIDJCLi86bpNnblRHeFBCI4JXYoNEbhl6YuFmbpZEIv5mapdlI0IiTis7W0ICZyBlIsISM5YDNyADIxAjMwEjMwIjI0ICdyNkIsICMygDMxIDMyIiOiAHeFJCLikHdpNUZwFmcHJiOiEmTDJCLiETM8gzM6UTM7QDOzETM9IiOiQWSiwSfiEjdxIDMyIiOiIXZ6JCLlNHbhZmOiI7ckJye0IUbcF";\n            wijmo.setLicenseKey(key);\n            function ignoreState() {\n                return ${e};\n            }\n            function getOptions() {\n                return ${JSON.stringify(this.getOptions())};\n            }\n            initPage();\n        <\/script>\n        </html>`}get viewType(){return"gc-excelviewer-csv"}get separator(){return r.workspace.getConfiguration("csv-preview").get("separator")}get quoteMark(){return r.workspace.getConfiguration("csv-preview").get("quoteMark")}get hasHeaders(){return r.workspace.getConfiguration("csv-preview").get("hasHeaders")}get capitalizeHeaders(){return r.workspace.getConfiguration("csv-preview").get("capitalizeHeaders")}get resizeColumns(){return r.workspace.getConfiguration("csv-preview").get("resizeColumns")}get lineNumbers(){return r.workspace.getConfiguration("csv-preview").get("lineNumbers")}get commentCharacter(){return r.workspace.getConfiguration("csv-preview").get("commentCharacter")}get skipComments(){return r.workspace.getConfiguration("csv-preview").get("skipComments")}get formatValues(){return r.workspace.getConfiguration("csv-preview").get("formatValues")}get numberFormat(){return r.workspace.getConfiguration("csv-preview").get("numberFormat")}}t.default=n},function(e,t,i){"use strict";Object.defineProperty(t,"__esModule",{value:!0});const r=i(0),s=i(3),n=i(4);t.default=class{constructor(e,t,i){this._disposables=[],this._storage=e.workspaceState,this._uri=t,this._previewUri=this._uri.with({scheme:i}),this._extOutUri=r.Uri.file(s.join(e.extensionPath,"out")),this._title=`Preview '${s.basename(this._uri.fsPath)}'`,n.previewManager.add(this)}initWebviewPanel(e){let t=r.window.createWebviewPanel(this.viewType,this._title,e,{enableScripts:!0,enableCommandUris:!0,enableFindWidget:!0,retainContextWhenHidden:!0});return this.attachWebviewPanel(t)}attachWebviewPanel(e){return this._panel=e,this._panel.onDidDispose(()=>{this.dispose()},this,this._disposables),this}handleEvents(){this.webview.onDidReceiveMessage(e=>{e.save?this.saveState(e.state):e.refresh?this.refresh():e.error&&r.window.showErrorMessage(e.error)},this,this._disposables),this.webview.html=this.getHtml()}dispose(){for(n.previewManager.remove(this),this._panel.dispose();this._disposables.length;){const e=this._disposables.pop();e&&e.dispose()}}configure(){this.webview.html=this.getHtml()}reload(){this.webview.html=this.getHtml(!0)}reveal(){this._panel.reveal()}get visible(){return this._panel.visible}get webview(){return this._panel.webview}get storage(){return this._storage}get state(){let e=this.previewUri.toString();return this.storage.get(e,{})}get uri(){return this._uri}get previewUri(){return this._previewUri}get extensionUrl(){return this._panel.webview.asWebviewUri(this._extOutUri).toString()}saveState(e){this._storage.update(this.previewUri.toString(),e)}}},function(e,t){e.exports=require("path")},function(e,t,i){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.previewManager=t.PreviewManager=void 0;class r{constructor(){this._previews=[]}static get Instance(){return this._instance||(this._instance=new this)}add(e){this._previews.push(e)}remove(e){let t=this._previews.indexOf(e);t>=0&&this._previews.splice(t,1)}find(e){return this._previews.find(t=>t.previewUri.toString()===e.toString())}active(){return this._previews.find(e=>e.visible)}configure(){this._previews.forEach(e=>e.configure())}}t.PreviewManager=r,t.previewManager=r.Instance},function(e,t,i){"use strict";Object.defineProperty(t,"__esModule",{value:!0});const r=i(0),s=i(2);class n extends s.default{static create(e,t,i){let r=new n(e,t,"excel-preview");return r.initWebviewPanel(i),r.handleEvents(),r}static revive(e,t,i){let r=new n(e,t,"excel-preview");return r.attachWebviewPanel(i),r.handleEvents(),r}getOptions(){return{uri:this.uri.toString(),previewUri:this.previewUri.toString(),state:this.state}}refresh(){let e=this;r.workspace.fs.readFile(this.uri).then(t=>{e.webview.postMessage({refresh:!0,content:t})},e=>{r.window.showInformationMessage(e)})}getHtml(e=!1){return`\n        <!DOCTYPE html>\n        <html>\n        <head>\n        <link href="${this.extensionUrl}/styles/wijmo.min.css" rel="stylesheet" type="text/css" />\n        <link href="${this.extensionUrl}/styles/vscode.css" rel="stylesheet" type="text/css" />\n        </head>\n        <script src="${this.extensionUrl}/controls/wijmo.min.js" type="text/javascript"><\/script>\n        <script src="${this.extensionUrl}/controls/wijmo.input.min.js" type="text/javascript"><\/script>\n        <script src="${this.extensionUrl}/controls/wijmo.grid.min.js" type="text/javascript"><\/script>\n        <script src="${this.extensionUrl}/controls/wijmo.grid.filter.min.js" type="text/javascript"><\/script>\n        <script src="${this.extensionUrl}/controls/wijmo.grid.sheet.min.js" type="text/javascript"><\/script>\n        <script src="${this.extensionUrl}/controls/wijmo.grid.xlsx.min.js" type="text/javascript"><\/script>\n        <script src="${this.extensionUrl}/controls/wijmo.xlsx.min.js" type="text/javascript"><\/script>\n        <script src="${this.extensionUrl}/jszip.min.js"><\/script>\n        <script src="${this.extensionUrl}/excel.js"><\/script>\n        <body style="padding:0px; overflow:hidden" onload="resizeSheet()" onresize="resizeSheet()">\n            <div id="sheet"></div>\n        </body>\n        <script type="text/javascript">\n            const key = "GrapeCity-vscode-webview-only,911384715638811#B08IKpjIEJCLi4TPntSb9cERjlkSZJDbBhGMRlXUk5kV4dzL6UzUBtUVaxWawRHVMdmNiVzVD96cYJ4VuZ6dv3UbWFWYIJVNzBDTO34QGBzVvYleBNjZVt6SVdHWUVVbXV7cPRHRrZ4cQVTTH3WR4M4YwFnS9F5K7FWN6lFajpmdvYFdOdlV7UFS9tybE5kUidnWxFnTyZFSw4ESCh4LRZEamVDROJFeGBVNoV6cwklT89WOvQXcQZmM6dlQw2yTrcFdUhEd9dUQZFlaSN6UBpWawsGTxMGTZtkUQNFZCZ7YXVlNNFmcYxmMntCWsxkW4FUYV5GNwVldTZjWHtmWvdUZiJXe6g6dX9UcORzbityYPdzVrdFNS54TrU5UjZ7K43Sd5kTQOdFMEVXUwRTOwNVRsd6M0VGemlDc4JmWZpGUrMkS4QjYpN4cvBnew5kd6E4MV3WMkBTZHlEbGJ6ZXdGaiojITJCLiYzN9IjNEJTMiojIIJCLyEDM4QzM6EDN0IicfJye#4Xfd5nIJBjMSJiOiMkIsIibvl6cuVGd8VEIgQXZlh6U8VGbGBybtpWaXJiOi8kI1xSfiUTSOFlI0IyQiwiIu3Waz9WZ4hXRgAicldXZpZFdy3GclJFIv5mapdlI0IiTisHL3JyS7gDSiojIDJCLi86bpNnblRHeFBCI73mUpRHb55EIv5mapdlI0IiTisHL3JCNGZDRiojIDJCLi86bpNnblRHeFBCIQFETPBCIv5mapdlI0IiTisHL3JyMDBjQiojIDJCLiUmcvNEIv5mapdlI0IiTisHL3JSV8cTQiojIDJCLi86bpNnblRHeFBCI4JXYoNEbhl6YuFmbpZEIv5mapdlI0IiTis7W0ICZyBlIsISM5YDNyADIxAjMwEjMwIjI0ICdyNkIsICMygDMxIDMyIiOiAHeFJCLikHdpNUZwFmcHJiOiEmTDJCLiETM8gzM6UTM7QDOzETM9IiOiQWSiwSfiEjdxIDMyIiOiIXZ6JCLlNHbhZmOiI7ckJye0IUbcF";\n            wijmo.setLicenseKey(key);\n            function ignoreState() {\n                return ${e};\n            }\n            function getOptions() {\n                return ${JSON.stringify(this.getOptions())};\n            }\n            initPage();\n        <\/script>\n        </html>`}get viewType(){return"gc-excelviewer-excel"}}t.default=n},function(e,t,i){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.deactivate=t.activate=void 0;const r=i(0),s=i(1),n=i(5),o=i(4),a=i(3),c=i(7);function l(e){if(e){let t=e.languageId.toLowerCase();return["csv","csv (semicolon)","csv (pipe)","tsv","plaintext"].find(e=>e===t)&&"csv-preview"!==e.uri.scheme}return!1}function p(e){return!(!r.workspace.getConfiguration("csv-preview").get("openStdin")||!e)&&a.basename(e.fileName).match("code-stdin-[^.]+.txt")}function d(){const e=r.window.activeTextEditor;return e?e.viewColumn:r.ViewColumn.One}t.activate=function(e){let t=r.commands.registerCommand("csv.preview",t=>{let i=t,n=d();if(!(i instanceof r.Uri)){if(!r.window.activeTextEditor)return void r.window.showInformationMessage("Open a CSV file first to show a preview.");i=r.window.activeTextEditor.document.uri,n=r.window.activeTextEditor.viewColumn}const a=i.with({scheme:"csv-preview"});let c=o.previewManager.find(a);if(!c)return c=s.default.create(e,i,n),c.webview;c.reveal()}),i=r.commands.registerCommand("excel.preview",t=>{let i=t,s=d();if(!(i instanceof r.Uri))return void r.window.showInformationMessage("Use the explorer context menu or editor title menu to preview Excel files.");const a=i.with({scheme:"excel-preview"});let c=o.previewManager.find(a);if(!c)return c=n.default.create(e,i,s),c.webview;c.reveal()}),a=r.commands.registerCommand("csv.clearState",()=>{let e=o.previewManager.active();if(e){let t=e.previewUri.toString();e.storage.get(t)&&(e.storage.update(t,null),e.reload(),e.refresh())}}),u=r.commands.registerCommand("csv.refresh",()=>{let e=o.previewManager.active();e&&e.refresh()});if(e.subscriptions.push(t),e.subscriptions.push(i),e.subscriptions.push(a),e.subscriptions.push(u),r.window.registerWebviewPanelSerializer("gc-excelviewer-csv",new c.CsvSerializer(e)),r.window.registerWebviewPanelSerializer("gc-excelviewer-excel",new c.ExcelSerializer(e)),r.workspace.onDidSaveTextDocument(e=>{if(l(e)){const t=e.uri.with({scheme:"csv-preview"});let i=o.previewManager.find(t);i&&i.refresh()}}),r.workspace.onDidChangeTextDocument(e=>{if(l(e.document)){const t=e.document.uri.with({scheme:"csv-preview"});let i=o.previewManager.find(t);i&&e.contentChanges.length>0&&i.refresh()}}),r.workspace.onDidChangeConfiguration(()=>{o.previewManager.configure()}),r.workspace.onDidOpenTextDocument(e=>{p(e)&&r.commands.executeCommand("csv.preview",e.uri)}),r.window.activeTextEditor){let e=r.window.activeTextEditor.document;p(e)&&r.commands.executeCommand("csv.preview",e.uri)}},t.deactivate=function(){}},function(e,t,i){"use strict";var r=this&&this.__awaiter||function(e,t,i,r){return new(i||(i=Promise))((function(s,n){function o(e){try{c(r.next(e))}catch(e){n(e)}}function a(e){try{c(r.throw(e))}catch(e){n(e)}}function c(e){var t;e.done?s(e.value):(t=e.value,t instanceof i?t:new i((function(e){e(t)}))).then(o,a)}c((r=r.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.ExcelSerializer=t.CsvSerializer=void 0;const s=i(0),n=i(1),o=i(5);t.CsvSerializer=class{constructor(e){this._context=e}deserializeWebviewPanel(e,t){return r(this,void 0,void 0,(function*(){n.default.revive(this._context,s.Uri.parse(t.uri),e)}))}};t.ExcelSerializer=class{constructor(e){this._context=e}deserializeWebviewPanel(e,t){return r(this,void 0,void 0,(function*(){o.default.revive(this._context,s.Uri.parse(t.uri),e)}))}}}]);
//# sourceMappingURL=extension.js.map