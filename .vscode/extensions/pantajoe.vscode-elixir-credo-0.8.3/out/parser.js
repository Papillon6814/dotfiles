"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCredoOutput = exports.parseCredoIssue = void 0;
const vscode = require("vscode");
const output_1 = require("./output");
const utilities_1 = require("./utilities");
function parseSeverity(credoSeverity) {
    switch (credoSeverity) {
        case 'consistency':
            return vscode.DiagnosticSeverity.Warning;
        case 'design':
            return vscode.DiagnosticSeverity.Information;
        case 'readability':
            return vscode.DiagnosticSeverity.Information;
        case 'refactor':
            return vscode.DiagnosticSeverity.Information;
        case 'warning':
            return vscode.DiagnosticSeverity.Warning;
        default:
            return vscode.DiagnosticSeverity.Error;
    }
}
function triggerRange({ line, trigger }) {
    if (!trigger || typeof trigger !== 'string')
        return null;
    // remove arity, e.g., 'Application.get_env/2' -> 'Application.get_env'
    const triggerWithoutArity = trigger.replace(/\/\d+$/, '');
    const index = line.indexOf(triggerWithoutArity);
    if (index !== -1)
        return { start: index, end: index + triggerWithoutArity.length };
    return null;
}
function parseCredoIssue({ issue, documentContent, }) {
    const lineNumber = (0, utilities_1.makeZeroBasedIndex)(issue.line_no);
    const currentLine = documentContent.split('\n')[lineNumber];
    let range;
    if (issue.column === null && issue.column_end === null && currentLine) {
        const triggerIndices = triggerRange({ line: currentLine, trigger: issue.trigger });
        const columnStart = (triggerIndices === null || triggerIndices === void 0 ? void 0 : triggerIndices.start) || 0;
        const columnEnd = currentLine.length === 0 ? 1 : (triggerIndices === null || triggerIndices === void 0 ? void 0 : triggerIndices.end) || currentLine.length;
        range = new vscode.Range(lineNumber, columnStart, lineNumber, columnEnd);
    }
    else {
        range = new vscode.Range(lineNumber, (0, utilities_1.makeZeroBasedIndex)(issue.column), lineNumber, (0, utilities_1.makeZeroBasedIndex)(issue.column_end));
    }
    const severity = parseSeverity(issue.category);
    const message = `${issue.message} (${issue.category}:${issue.check})`;
    return new vscode.Diagnostic(range, message, severity);
}
exports.parseCredoIssue = parseCredoIssue;
function parseCredoOutput({ credoOutput, document, }) {
    const documentContent = document.getText();
    const issues = (0, output_1.isDiffOutput)(credoOutput) ? credoOutput.diff.new : credoOutput.issues;
    return issues.map((issue) => parseCredoIssue({ issue, documentContent }));
}
exports.parseCredoOutput = parseCredoOutput;
//# sourceMappingURL=parser.js.map