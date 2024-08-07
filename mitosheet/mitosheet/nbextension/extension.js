define(() => { return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./lib/jupyter/code.js":
/*!*****************************!*\
  !*** ./lib/jupyter/code.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "containsMitosheetCallWithAnyAnalysisToReplay": () => (/* binding */ containsMitosheetCallWithAnyAnalysisToReplay),
/* harmony export */   "containsMitosheetCallWithSpecificAnalysisToReplay": () => (/* binding */ containsMitosheetCallWithSpecificAnalysisToReplay),
/* harmony export */   "getArgsFromMitosheetCallCode": () => (/* binding */ getArgsFromMitosheetCallCode),
/* harmony export */   "getCodeString": () => (/* binding */ getCodeString),
/* harmony export */   "getLastNonEmptyLine": () => (/* binding */ getLastNonEmptyLine),
/* harmony export */   "hasCodeCellBeenEditedByUser": () => (/* binding */ hasCodeCellBeenEditedByUser),
/* harmony export */   "isMitoAnalysisCode": () => (/* binding */ isMitoAnalysisCode),
/* harmony export */   "isMitosheetCallCode": () => (/* binding */ isMitosheetCallCode),
/* harmony export */   "removeWhitespaceInPythonCode": () => (/* binding */ removeWhitespaceInPythonCode)
/* harmony export */ });
// Utilities for working with the generated code
const IMPORT_STATEMENTS = [
    'from mitosheet.public.v1 import *',
    'from mitosheet.public.v2 import *',
    'from mitosheet.public.v3 import *',
];
function getCodeString(analysisName, code, telemetryEnabled, publicInterfaceVersion) {
    if (code.length == 0) {
        return '';
    }
    const finalCode = code.join('\n');
    // If telemetry not enabled, we want to be clear about this by
    // simply not calling a func w/ the analysis name
    let analysisRegisterCode = '';
    if (telemetryEnabled) {
        analysisRegisterCode = `register_analysis("${analysisName}");`;
    }
    else {
        analysisRegisterCode = `# Analysis Name:${analysisName};`;
    }
    return finalCode.replace(`mitosheet.public.v${publicInterfaceVersion} import *`, `mitosheet.public.v${publicInterfaceVersion} import *; ${analysisRegisterCode}`);
}
// Returns the last line with any non-whitespace character
function getLastNonEmptyLine(codeText) {
    const filteredActiveText = codeText.split(/\r?\n/).filter(line => line.trim().length > 0);
    return filteredActiveText.length > 0 ? filteredActiveText.pop() : undefined;
}
const getArgsFromMitosheetCallCode = (codeText) => {
    const codeTextCleaned = removeWhitespaceInPythonCode(codeText);
    let nameString = codeTextCleaned.split('sheet(')[1].split(')')[0];
    // If there is a (new) analysis name parameter passed, we ignore it
    if (nameString.includes('analysis_to_replay')) {
        nameString = nameString.split('analysis_to_replay')[0].trim();
    }
    // If there is a view_df name parameter, we ignore it
    // TODO: remove this on Jan 1, 2023 (since we no longer need it)
    if (nameString.includes('view_df')) {
        nameString = nameString.split('view_df')[0].trim();
    }
    if (nameString.includes('sheet_functions')) {
        nameString = nameString.split('sheet_functions')[0].trim();
    }
    // Get the args and trim them up
    let args = nameString.split(',').map(dfName => dfName.trim());
    // Remove any names that are empty. Note that some of these names
    // may be strings, which we turn into valid df_names on the backend!
    args = args.filter(dfName => { return dfName.length > 0; });
    return args;
};
// Returns true iff a the given cell ends with a mitosheet.sheet call
function isMitosheetCallCode(codeText) {
    // Get the last non-empty line from the cell
    const lastLine = getLastNonEmptyLine(codeText);
    if (lastLine === undefined) {
        return false;
    }
    /*
        We check if the last line contains a mitosheet.sheet call, which can happen in a few ways
        
        1. `import mitosheet` -> mitosheet.sheet()
        2. `import mitosheet as {THING}` -> {THING}.sheet(
        3. `from mitosheet import sheet` -> sheet(

        We detect all three by checking if the line contains `sheet(`!
    */
    const lastLineCleaned = removeWhitespaceInPythonCode(lastLine);
    return lastLineCleaned.indexOf('sheet(') !== -1;
}
// Returns true iff a the given cell is a cell containing the generated code
function isMitoAnalysisCode(codeText) {
    // Check if it starts with any import statement from the versioned interface
    let startsWithPublicVersionImport = false;
    IMPORT_STATEMENTS.forEach(importStatement => {
        if (codeText.startsWith(importStatement + '; register_analysis(') || codeText.startsWith(importStatement + '; # Analysis Name:')) {
            startsWithPublicVersionImport = true;
        }
    });
    // Handle the old and new Mito boilerplate code
    return codeText.startsWith('# MITO CODE START')
        || codeText.startsWith('from mitosheet import *; register_analysis(')
        || codeText.startsWith('from mitosheet import *; # Analysis:')
        || codeText.startsWith('from mitosheet import *; # Analysis Name:')
        || startsWithPublicVersionImport;
}
/*
    Returns true if the cell contains a mitosheet.sheet(analysis_to_replay={analysisName})
*/
function containsMitosheetCallWithSpecificAnalysisToReplay(codeText, analysisName) {
    // Remove any whitespace from codeText
    const codeTextCleaned = removeWhitespaceInPythonCode(codeText);
    return codeTextCleaned.includes('sheet(') && codeTextCleaned.includes(`analysis_to_replay="${analysisName}"`);
}
/*
    Returns true if the cell contains a mitosheet.sheet(analysis_to_replay={analysisName})
*/
function containsMitosheetCallWithAnyAnalysisToReplay(codeText) {
    // Remove any whitespace from codeText
    const codeTextCleaned = removeWhitespaceInPythonCode(codeText);
    return isMitosheetCallCode(codeText) && codeTextCleaned.includes(`analysis_to_replay=`);
}
/**
 * This function is used to identify if the user has changed the contents of the code
 * cell that Mito is using to store the generated code. We need to know this to avoid
 * overwriting the user's code with the generated code.
 * @param oldCode - The last analysisData code that was written to the cell
 * @param codeCellText - The text in the cell that contains the code
 * @returns boolean indicating if the code cell has been changed
 */
function hasCodeCellBeenEditedByUser(oldCode, codeCellText) {
    // We're removing the first line of the old code and the cell code because
    // the cell code contains the analysis id and the old code does not
    const oldCodeWithoutFirstLine = oldCode === null || oldCode === void 0 ? void 0 : oldCode.slice(1).join('\n');
    const cellCodeWithoutFirstLine = codeCellText === null || codeCellText === void 0 ? void 0 : codeCellText.split('\n').slice(1).join('\n');
    return oldCodeWithoutFirstLine !== cellCodeWithoutFirstLine;
}
// Removes all whitespace from a string, except for whitespace in quoted strings.
function removeWhitespaceInPythonCode(codeText) {
    const pattern = /('[^']*'|"[^"]*")/;
    // This pattern matches:
    // 1. A single-quoted string containing any character except for '.
    // 2. OR a double-quoted string containing any character except for ".
    // Split the text into quoted strings and non-quoted sections.
    const parts = codeText.split(pattern);
    // Remove all whitespace from non-quoted sections.
    const partsWithoutSpaces = parts.map((part) => {
        if (pattern.test(part)) {
            return part; // Keep quoted strings unchanged.
        }
        return part.replace(/\s+/g, '');
    });
    // Join the parts back into a single string.
    const result = partsWithoutSpaces.join('');
    return result;
}
//# sourceMappingURL=code.js.map

/***/ }),

/***/ "./lib/jupyter/notebook/extension.js":
/*!*******************************************!*\
  !*** ./lib/jupyter/notebook/extension.js ***!
  \*******************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _extensionUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./extensionUtils */ "./lib/jupyter/notebook/extensionUtils.js");
/* module decorator */ module = __webpack_require__.hmd(module);
// Copyright (c) Jupyter Development Team.
var _a, _b;

// This file contains the javascript that is run when the notebook is loaded.
// It contains some requirejs configuration and the `load_ipython_extension`
// which is required for any notebook extension.
//
// Some static assets may be required by the custom widget javascript. The base
// url for the notebook is not known at build time and is therefore computed
// dynamically.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
window.__webpack_public_path__ = ((_a = document.querySelector('body')) === null || _a === void 0 ? void 0 : _a.getAttribute('data-base-url')) + 'nbextensions/mitosheet';
// Configure requirejs
if (window.require) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    window.require.config({
        map: {
            "*": {
                "mitosheet": "nbextensions/mitosheet/index",
            }
        }
    });
}
// Try to add a button
(_b = window.Jupyter) === null || _b === void 0 ? void 0 : _b.toolbar.add_buttons_group([{
        id: 'mito-toolbar-button-id',
        label: 'New Mitosheet',
        title: 'Create a blank Mitosheet below the active code cell',
        icon: 'fa-regular fa-table',
        callback: () => {
            (0,_extensionUtils__WEBPACK_IMPORTED_MODULE_0__.writeEmptyMitosheetCell)();
        },
    }]);
// Export the required load_ipython_extension
module.exports = {
    // eslint-disable-next-line  @typescript-eslint/no-empty-function
    load_ipython_extension: function () { }
};
//# sourceMappingURL=extension.js.map

/***/ }),

/***/ "./lib/jupyter/notebook/extensionUtils.js":
/*!************************************************!*\
  !*** ./lib/jupyter/notebook/extensionUtils.js ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getCellAtIndex": () => (/* binding */ getCellAtIndex),
/* harmony export */   "getCellCallingMitoshetWithAnalysis": () => (/* binding */ getCellCallingMitoshetWithAnalysis),
/* harmony export */   "getCellText": () => (/* binding */ getCellText),
/* harmony export */   "getMostLikelyMitosheetCallingCell": () => (/* binding */ getMostLikelyMitosheetCallingCell),
/* harmony export */   "isEmptyCell": () => (/* binding */ isEmptyCell),
/* harmony export */   "notebookGetArgs": () => (/* binding */ notebookGetArgs),
/* harmony export */   "notebookOverwriteAnalysisToReplayToMitosheetCall": () => (/* binding */ notebookOverwriteAnalysisToReplayToMitosheetCall),
/* harmony export */   "notebookWriteAnalysisToReplayToMitosheetCall": () => (/* binding */ notebookWriteAnalysisToReplayToMitosheetCall),
/* harmony export */   "notebookWriteCodeSnippetCell": () => (/* binding */ notebookWriteCodeSnippetCell),
/* harmony export */   "notebookWriteGeneratedCodeToCell": () => (/* binding */ notebookWriteGeneratedCodeToCell),
/* harmony export */   "tryOverwriteAnalysisToReplayParameter": () => (/* binding */ tryOverwriteAnalysisToReplayParameter),
/* harmony export */   "tryWriteAnalysisToReplayParameter": () => (/* binding */ tryWriteAnalysisToReplayParameter),
/* harmony export */   "writeEmptyMitosheetCell": () => (/* binding */ writeEmptyMitosheetCell),
/* harmony export */   "writeToCell": () => (/* binding */ writeToCell)
/* harmony export */ });
/* harmony import */ var _code__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../code */ "./lib/jupyter/code.js");

function getCellAtIndex(index) {
    var _a, _b;
    return (_b = (_a = window.Jupyter) === null || _a === void 0 ? void 0 : _a.notebook) === null || _b === void 0 ? void 0 : _b.get_cell(index);
}
function getCellText(cell) {
    return (cell === null || cell === void 0 ? void 0 : cell.get_text()) || '';
}
/*
    Returns True if the passed cell is empty.
    Returns False if the passed cells is either not empty or undefined
*/
function isEmptyCell(cell) {
    if (cell === undefined) {
        return false;
    }
    const currentCode = getCellText(cell);
    return currentCode.trim() === '';
}
/**
 * Returns the cell that has the mitosheet.sheet(analysis_to_replay={analysisName}) in it,
 * or undefined if no such cell exists
 */
function getCellCallingMitoshetWithAnalysis(analysisName) {
    var _a, _b;
    const cells = (_b = (_a = window.Jupyter) === null || _a === void 0 ? void 0 : _a.notebook) === null || _b === void 0 ? void 0 : _b.get_cells();
    if (cells === undefined) {
        return undefined;
    }
    let cellIndex = 0;
    for (const cell of cells) {
        if ((0,_code__WEBPACK_IMPORTED_MODULE_0__.containsMitosheetCallWithSpecificAnalysisToReplay)(getCellText(cell), analysisName)) {
            return [cell, cellIndex];
        }
        cellIndex++;
    }
    return undefined;
}
/**
 * A function that returns the [cell, index] pair of the mitosheet.sheet() call that contains
 * the analysis name.
 *
 * If no mitosheet.sheet() call contains this analysis name, then we assume it hasen't been
 * written yet, and take our best guess at which sheet this is.
 *
 * Returns undefined if it can find no good guess for a calling mitosheet cell.
 */
function getMostLikelyMitosheetCallingCell(analysisName) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    // First, we check if this analysis name is in a mitosheet call, in which case things are easy
    if (analysisName) {
        const mitosheetCallCellAndIndex = getCellCallingMitoshetWithAnalysis(analysisName);
        if (mitosheetCallCellAndIndex !== undefined) {
            return mitosheetCallCellAndIndex;
        }
    }
    const cells = (_b = (_a = window.Jupyter) === null || _a === void 0 ? void 0 : _a.notebook) === null || _b === void 0 ? void 0 : _b.get_cells();
    if (cells == undefined) {
        return;
    }
    const activeCell = (_d = (_c = window.Jupyter) === null || _c === void 0 ? void 0 : _c.notebook) === null || _d === void 0 ? void 0 : _d.get_cell((_f = (_e = window.Jupyter) === null || _e === void 0 ? void 0 : _e.notebook) === null || _f === void 0 ? void 0 : _f.get_anchor_index());
    const activeCellIndex = ((_h = (_g = window.Jupyter) === null || _g === void 0 ? void 0 : _g.notebook) === null || _h === void 0 ? void 0 : _h.get_anchor_index()) || 0;
    const previousCell = getCellAtIndex(activeCellIndex - 1);
    // As the most common way for a user to run a cell for the first time is to run and advanced, this 
    // means that the active cell will most likely be one below the mitosheet.sheet() call we want to 
    // write to, so we check this first
    if (previousCell && (0,_code__WEBPACK_IMPORTED_MODULE_0__.isMitosheetCallCode)(getCellText(previousCell)) && !(0,_code__WEBPACK_IMPORTED_MODULE_0__.containsMitosheetCallWithAnyAnalysisToReplay)(getCellText(previousCell))) {
        return [previousCell, activeCellIndex - 1];
    }
    // The next case we check is if they did a run and not advance, which means that the currently
    // selected cell is the mitosheet.sheet call
    if (activeCell && (0,_code__WEBPACK_IMPORTED_MODULE_0__.isMitosheetCallCode)(getCellText(activeCell)) && !(0,_code__WEBPACK_IMPORTED_MODULE_0__.containsMitosheetCallWithAnyAnalysisToReplay)(getCellText(activeCell))) {
        return [activeCell, activeCellIndex];
    }
    // The last case is that the user did some sort of run all, in which case we cross our fingers
    // that there is only one cell that does not have a mitosheet call with an analysis_to_replay, 
    // and go looking for it
    let index = activeCellIndex;
    while (index >= 0) {
        const cell = getCellAtIndex(index);
        if (cell && (0,_code__WEBPACK_IMPORTED_MODULE_0__.isMitosheetCallCode)(getCellText(cell)) && !(0,_code__WEBPACK_IMPORTED_MODULE_0__.containsMitosheetCallWithAnyAnalysisToReplay)(getCellText(cell))) {
            return [cell, index];
        }
        index--;
    }
    return undefined;
}
function writeToCell(cell, code) {
    if (cell == undefined) {
        return;
    }
    cell.set_text(code);
}
/**
 * Given a cell, will check if it has a mitosheet.sheet() call with the old
 * analysis to replay, and if so will replace it with the new analysis to
 * replay
 */
function tryOverwriteAnalysisToReplayParameter(cell, oldAnalysisName, newAnalysisName) {
    if ((0,_code__WEBPACK_IMPORTED_MODULE_0__.isMitosheetCallCode)(getCellText(cell)) && (0,_code__WEBPACK_IMPORTED_MODULE_0__.containsMitosheetCallWithSpecificAnalysisToReplay)(getCellText(cell), oldAnalysisName)) {
        const currentCode = getCellText(cell);
        const newCode = currentCode.replace(RegExp(`analysis_to_replay\\s*=\\s*"${oldAnalysisName}"`), `analysis_to_replay="${newAnalysisName}"`);
        writeToCell(cell, newCode);
        return true;
    }
    return false;
}
/**
 * Given a cell, will check if it has a mitosheet.sheet() call with no
 * analysis_to_replay, and if so add the analysisName as a parameter to
 * this cell. It will return true in this case.
 *
 * Otherwise, if this is not a mitosheet.sheet() call, or if it already has
 * a analysis_to_replay parameter, this will return false.
 */
function tryWriteAnalysisToReplayParameter(cell, analysisName) {
    const currentCode = getCellText(cell);
    if ((0,_code__WEBPACK_IMPORTED_MODULE_0__.isMitosheetCallCode)(currentCode) && !(0,_code__WEBPACK_IMPORTED_MODULE_0__.containsMitosheetCallWithAnyAnalysisToReplay)(currentCode)) {
        const currentCodeCleaned = (0,_code__WEBPACK_IMPORTED_MODULE_0__.removeWhitespaceInPythonCode)(currentCode);
        // We know the mitosheet.sheet() call is the last thing in the cell, so we 
        // just replace the last closing paren
        const lastIndex = currentCode.lastIndexOf(')');
        let replacement = ``;
        if (currentCodeCleaned.includes('sheet()')) {
            replacement = `analysis_to_replay="${analysisName}")`;
        }
        else {
            replacement = `, analysis_to_replay="${analysisName}")`;
        }
        const newCode = currentCode.substring(0, lastIndex) + replacement + currentCode.substring(lastIndex + 1);
        writeToCell(cell, newCode);
        return true;
    }
    return false;
}
const notebookGetArgs = (analysisToReplayName) => {
    const cellAndIndex = getMostLikelyMitosheetCallingCell(analysisToReplayName);
    if (cellAndIndex) {
        const [cell,] = cellAndIndex;
        return (0,_code__WEBPACK_IMPORTED_MODULE_0__.getArgsFromMitosheetCallCode)(getCellText(cell));
    }
    else {
        return [];
    }
};
const notebookWriteAnalysisToReplayToMitosheetCall = (analysisName, mitoAPI) => {
    const cellAndIndex = getMostLikelyMitosheetCallingCell(analysisName);
    if (cellAndIndex) {
        const [cell,] = cellAndIndex;
        const written = tryWriteAnalysisToReplayParameter(cell, analysisName);
        if (written) {
            return;
        }
    }
    // Log if we are unable to write this param for any reason
    void mitoAPI.log('write_analysis_to_replay_to_mitosheet_call_failed');
};
const notebookOverwriteAnalysisToReplayToMitosheetCall = (oldAnalysisName, newAnalysisName, mitoAPI) => {
    const mitosheetCallCellAndIndex = getCellCallingMitoshetWithAnalysis(oldAnalysisName);
    if (mitosheetCallCellAndIndex === undefined) {
        return;
    }
    const [mitosheetCallCell,] = mitosheetCallCellAndIndex;
    const overwritten = tryOverwriteAnalysisToReplayParameter(mitosheetCallCell, oldAnalysisName, newAnalysisName);
    if (!overwritten) {
        void mitoAPI.log('overwrite_analysis_to_replay_to_mitosheet_call_failed');
    }
};
const notebookWriteGeneratedCodeToCell = (analysisName, codeLines, telemetryEnabled, publicInterfaceVersion, oldCode, triggerUserEditedCodeDialog, overwriteIfUserEditedCode) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    const code = (0,_code__WEBPACK_IMPORTED_MODULE_0__.getCodeString)(analysisName, codeLines, telemetryEnabled, publicInterfaceVersion);
    // Find the cell that made the mitosheet.sheet call, and if it does not exist, give
    // up immediately
    const mitosheetCallCellAndIndex = getCellCallingMitoshetWithAnalysis(analysisName);
    if (mitosheetCallCellAndIndex === undefined) {
        return;
    }
    const [, mitosheetCallIndex] = mitosheetCallCellAndIndex;
    const cells = (_b = (_a = window.Jupyter) === null || _a === void 0 ? void 0 : _a.notebook) === null || _b === void 0 ? void 0 : _b.get_cells();
    if (cells === undefined) {
        return;
    }
    const activeCellIndex = ((_d = (_c = window.Jupyter) === null || _c === void 0 ? void 0 : _c.notebook) === null || _d === void 0 ? void 0 : _d.get_anchor_index()) || 0;
    const codeCell = getCellAtIndex(mitosheetCallIndex + 1);
    const codeCellText = getCellText(codeCell);
    // Prevent overwriting the cell if the user has changed the code
    if (overwriteIfUserEditedCode === undefined && !isEmptyCell(codeCell) && (0,_code__WEBPACK_IMPORTED_MODULE_0__.hasCodeCellBeenEditedByUser)(oldCode, codeCellText)) {
        triggerUserEditedCodeDialog(oldCode, codeCellText.split('\n'));
        return;
        // Only write to the cell if either of the following are true:
        // 1. The user has authorized overwriting the cell
        // 2. The cell hasn't been edited by the user
        // AND the cell exists. If the cell doesn't exist we can't write to it!
    }
    else if (codeCell !== undefined && (overwriteIfUserEditedCode || !(0,_code__WEBPACK_IMPORTED_MODULE_0__.hasCodeCellBeenEditedByUser)(oldCode, codeCellText))) {
        writeToCell(codeCell, code);
    }
    else {
        // If we cannot write to the cell below, we have to go back a new cell below, 
        // which can eb a bit of an involve process
        if (mitosheetCallIndex !== activeCellIndex) {
            // We have to move our selection back up to the cell that we 
            // make the mitosheet call to 
            if (mitosheetCallIndex < activeCellIndex) {
                for (let i = 0; i < (activeCellIndex - mitosheetCallIndex); i++) {
                    (_f = (_e = window.Jupyter) === null || _e === void 0 ? void 0 : _e.notebook) === null || _f === void 0 ? void 0 : _f.select_prev();
                }
            }
            else if (mitosheetCallIndex > activeCellIndex) {
                for (let i = 0; i < (mitosheetCallIndex - activeCellIndex); i++) {
                    (_h = (_g = window.Jupyter) === null || _g === void 0 ? void 0 : _g.notebook) === null || _h === void 0 ? void 0 : _h.select_next();
                }
            }
        }
        // And then write to this new cell below, which is not the active cell but we
        // should make it the actice cell
        (_k = (_j = window.Jupyter) === null || _j === void 0 ? void 0 : _j.notebook) === null || _k === void 0 ? void 0 : _k.insert_cell_below();
        (_m = (_l = window.Jupyter) === null || _l === void 0 ? void 0 : _l.notebook) === null || _m === void 0 ? void 0 : _m.select_next();
        const activeCell = (_p = (_o = window.Jupyter) === null || _o === void 0 ? void 0 : _o.notebook) === null || _p === void 0 ? void 0 : _p.get_cell((_r = (_q = window.Jupyter) === null || _q === void 0 ? void 0 : _q.notebook) === null || _r === void 0 ? void 0 : _r.get_anchor_index());
        writeToCell(activeCell, code);
    }
};
const notebookWriteCodeSnippetCell = (analysisName, code) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    // Find the cell that made the mitosheet.sheet call, and if it does not exist, give
    // up immediately
    const mitosheetCallCellAndIndex = getCellCallingMitoshetWithAnalysis(analysisName);
    if (mitosheetCallCellAndIndex === undefined) {
        return;
    }
    const [, mitosheetCallIndex] = mitosheetCallCellAndIndex;
    const cells = (_b = (_a = window.Jupyter) === null || _a === void 0 ? void 0 : _a.notebook) === null || _b === void 0 ? void 0 : _b.get_cells();
    if (cells === undefined) {
        return;
    }
    const codeCell = getCellAtIndex(mitosheetCallIndex + 1);
    if (isEmptyCell(codeCell)) {
        writeToCell(codeCell, code);
    }
    else {
        // Otherwise, we assume we have the mitosheet selected, so we select the next one, and then 
        // insert below so we have new cell below the generated code
        (_d = (_c = window.Jupyter) === null || _c === void 0 ? void 0 : _c.notebook) === null || _d === void 0 ? void 0 : _d.select_next();
        (_f = (_e = window.Jupyter) === null || _e === void 0 ? void 0 : _e.notebook) === null || _f === void 0 ? void 0 : _f.insert_cell_below();
        (_h = (_g = window.Jupyter) === null || _g === void 0 ? void 0 : _g.notebook) === null || _h === void 0 ? void 0 : _h.select_next();
        const activeCell = (_k = (_j = window.Jupyter) === null || _j === void 0 ? void 0 : _j.notebook) === null || _k === void 0 ? void 0 : _k.get_cell((_m = (_l = window.Jupyter) === null || _l === void 0 ? void 0 : _l.notebook) === null || _m === void 0 ? void 0 : _m.get_anchor_index());
        writeToCell(activeCell, code);
    }
};
const writeEmptyMitosheetCell = () => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    // Create a new cell below the active code cell
    (_b = (_a = window.Jupyter) === null || _a === void 0 ? void 0 : _a.notebook) === null || _b === void 0 ? void 0 : _b.insert_cell_below();
    (_d = (_c = window.Jupyter) === null || _c === void 0 ? void 0 : _c.notebook) === null || _d === void 0 ? void 0 : _d.select_next();
    const activeCell = (_f = (_e = window.Jupyter) === null || _e === void 0 ? void 0 : _e.notebook) === null || _f === void 0 ? void 0 : _f.get_cell((_h = (_g = window.Jupyter) === null || _g === void 0 ? void 0 : _g.notebook) === null || _h === void 0 ? void 0 : _h.get_anchor_index());
    // Add mitosheet.sheet call to new code cell
    if (isEmptyCell(activeCell)) {
        writeToCell(activeCell, 'import mitosheet\nmitosheet.sheet()');
        (_k = (_j = window.Jupyter) === null || _j === void 0 ? void 0 : _j.notebook) === null || _k === void 0 ? void 0 : _k.execute_cell_and_insert_below();
    }
};
//# sourceMappingURL=extensionUtils.js.map

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/harmony module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.hmd = (module) => {
/******/ 			module = Object.create(module);
/******/ 			if (!module.children) module.children = [];
/******/ 			Object.defineProperty(module, 'exports', {
/******/ 				enumerable: true,
/******/ 				set: () => {
/******/ 					throw new Error('ES Modules may not assign module.exports or exports.*, Use ESM export syntax, instead: ' + module.id);
/******/ 				}
/******/ 			});
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./lib/jupyter/notebook/extension.js");
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});;
//# sourceMappingURL=extension.js.map