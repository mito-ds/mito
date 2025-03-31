/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito
import { ICellModel } from "@jupyterlab/cells";
import { CellList, INotebookTracker, Notebook, NotebookActions } from '@jupyterlab/notebook';
import { containsMitosheetCallWithAnyAnalysisToReplay, containsMitosheetCallWithSpecificAnalysisToReplay, isMitosheetCallCode, removeWhitespaceInPythonCode } from "./code";


export function getParentMitoContainer(): Element | null {
    // NOTE: This only works if the active element in the document is a child of Mito
    // First, get the mito container that this element is a part of
    let currentElement = document.activeElement;
    while (currentElement !== null) {
        if (currentElement.classList.contains('mito-container')) {
            break;
        }
        currentElement = currentElement.parentElement;
    }

    return currentElement;
}


export function getCellAtIndex(cells: CellList | undefined, index: number): ICellModel | undefined {
    if (cells == undefined) {
        return undefined;
    }

    // If the index is out of bounds, it will return undefined
    const cell = cells.get(index)
    return cell
}

export function getCellIndexByExecutionCount(cells: CellList | undefined, executionCount: number | undefined): number | undefined {
    if (cells == undefined || executionCount == undefined) {
        return undefined;
    }

    // In order to get the cell index, we need to iterate over the cells and call the `get` method
    // to see the cells in order. Otherwise, the cells are returned in a random order.
    for (let i = 0; i < cells.length; i++) {
        const cell = cells.get(i)
        // TODO: This doesn't work with SharedCells. 
        if (cell.type === 'code' && 'execution_count' in cell.sharedModel) {
            const executionCountEntry = cell.sharedModel.execution_count
            if (executionCountEntry === executionCount) {
                return i
            }
        }
    }

    return undefined
}

export function getCellText(cell: ICellModel| undefined): string {
    if (cell == undefined) return ''; 

    return cell.sharedModel.source
}

export function createCodeCellAtIndex(index: number, notebook: Notebook | undefined): ICellModel | undefined {

    if (notebook === undefined) {
        return undefined;
    }

    notebook.activeCellIndex = index - 1;
    NotebookActions.insertBelow(notebook);
    return getCellAtIndex(notebook.model?.cells, index);
}

export function writeToCodeCellAtIndex(index: number, notebook: Notebook | undefined, code: string): void {

    if (notebook === undefined) {
        return undefined;
    }

    const cells = notebook.model?.cells;
    const codeCell = getCellAtIndex(cells, index);
    if (codeCell) {
        writeToCell(codeCell, code);
    }
}


/* 
    Returns True if the passed cell is empty or undefined.
    Returns False if the passed cells is not empty
*/
export function isEmptyCell(cell: ICellModel | undefined): boolean {
    if (cell === undefined) {
        return true;
    }
    const currentCode = getCellText(cell);
    return currentCode.trim() === '';
}

/**
 * Returns the cell that has the mitosheet.sheet(analysis_to_replay={analysisName}) in it,
 * or undefined if no such cell exists
 */
export function getCellCallingMitoshetWithAnalysis(tracker: INotebookTracker, analysisName: string): [ICellModel, number] | undefined  {
    const notebook = tracker.currentWidget?.content;
    const cells = notebook?.model?.cells;

    if (cells === undefined) {
        return undefined;
    }

    for (let i = 0; i < cells.length; i++) {
        const cell = getCellAtIndex(cells, i)

        if (cell == undefined) {
            continue;
        }

        if (containsMitosheetCallWithSpecificAnalysisToReplay(getCellText(cell), analysisName)) {
            return [cell, i];
        }
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
export function getMostLikelyMitosheetCallingCell(tracker: INotebookTracker, analysisName: string | undefined): [ICellModel, number] | undefined {
    
    // First, we check if this analysis name is in a mitosheet call, in which case things are easy
    if (analysisName) {
        const mitosheetCallCellAndIndex = getCellCallingMitoshetWithAnalysis(tracker, analysisName);
        if (mitosheetCallCellAndIndex !== undefined) {
            return mitosheetCallCellAndIndex;
        }
    }

    const notebook = tracker.currentWidget?.content;
    const cells = notebook?.model?.cells;

    if (notebook == undefined || cells == undefined) {
        return;
    }

    const activeCell = notebook.activeCell?.model;
    const activeCellIndex = notebook.activeCellIndex;

    const previousCell = getCellAtIndex(cells, activeCellIndex - 1)

    // As the most common way for a user to run a cell for the first time is to run and advanced, this 
    // means that the active cell will most likely be one below the mitosheet.sheet() call we want to 
    // write to, so we check this first
    if (previousCell && isMitosheetCallCode(getCellText(previousCell)) && !containsMitosheetCallWithAnyAnalysisToReplay(getCellText(previousCell))) {
        return [previousCell, activeCellIndex - 1];
    } 

    // The next case we check is if they did a run and not advance, which means that the currently
    // selected cell is the mitosheet.sheet call
    if (activeCell && isMitosheetCallCode(getCellText(activeCell)) && !containsMitosheetCallWithAnyAnalysisToReplay(getCellText(activeCell))) {
        return [activeCell, activeCellIndex];
    }

    // The last case is that the user did some sort of run all, in which case we cross our fingers
    // that there is only one cell that does not have a mitosheet call with an analysis_to_replay, 
    // and go looking for it
    let index = activeCellIndex;
    while (index >= 0) {
        const cell = getCellAtIndex(cells, index)
        if (cell && isMitosheetCallCode(getCellText(cell)) && !containsMitosheetCallWithAnyAnalysisToReplay(getCellText(cell))) {
            return [cell, index];
        }
        index--;
    }

    return undefined;
}

export function writeToCell(cell: ICellModel | undefined, code: string): void {
    if (cell == undefined) {
        return;
    }
    cell.sharedModel.source = code
}


/**
 * Given a cell, will check if it has a mitosheet.sheet() call with the old
 * analysis to replay, and if so will replace it with the new analysis to 
 * replay
 */
export function tryOverwriteAnalysisToReplayParameter(cell: ICellModel | undefined, oldAnalysisName: string, newAnalysisName: string): boolean {
    if (isMitosheetCallCode(getCellText(cell)) && containsMitosheetCallWithSpecificAnalysisToReplay(getCellText(cell), oldAnalysisName)) {
        const currentCode = getCellText(cell);

        const newCode = currentCode.replace(
            RegExp(`analysis_to_replay\\s*=\\s*"${oldAnalysisName}"`),
            `analysis_to_replay="${newAnalysisName}"`
        )
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
export function tryWriteAnalysisToReplayParameter(cell: ICellModel | undefined, analysisName: string): boolean {
    const currentCode = getCellText(cell);
    if (isMitosheetCallCode(currentCode) && !containsMitosheetCallWithAnyAnalysisToReplay(currentCode)) {

        const currentCodeCleaned = removeWhitespaceInPythonCode(currentCode)

        // We know the mitosheet.sheet() call is the last thing in the cell, so we 
        // just replace the last closing paren
        const lastIndex = currentCode.lastIndexOf(')');
        let replacement = ``;
        if (currentCodeCleaned.includes('sheet()')) {
            replacement = `analysis_to_replay="${analysisName}")`;
        } else {
            replacement = `, analysis_to_replay="${analysisName}")`;
        }
        const newCode = currentCode.substring(0, lastIndex) + replacement + currentCode.substring(lastIndex + 1);
        writeToCell(cell, newCode);
        return true;
    } 

    return false;
}