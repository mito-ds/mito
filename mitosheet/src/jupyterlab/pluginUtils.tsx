// Copyright (c) Mito
import { ICellModel } from "@jupyterlab/cells";
import { INotebookTracker } from '@jupyterlab/notebook';
import {
    IObservableString,
    IObservableUndoableList
} from '@jupyterlab/observables';



export function getCellAtIndex(cells: IObservableUndoableList<ICellModel> | undefined, index: number): ICellModel | undefined {
    if (cells == undefined) {
        return undefined;
    }

    const cellsIterator = cells.iter();
    let cell = cellsIterator.next();
    let i = 0;
    while (cell) {
        if (i == index) {
            return cell;
        }

        i++;
        cell = cellsIterator.next();
    }

  
    return undefined;
}

export function getParentMitoContainer(): Element | null {
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


export function getCellText(cell: ICellModel| undefined): string {
    if (cell == undefined) return ''; 
    const value = cell.modelDB.get('value') as IObservableString;
    return value.text;
}

// Returns true iff a the given cell ends with a mitosheet.sheet call
export function isMitosheetCallCell(cell: ICellModel | undefined): boolean {
    const currentCode = getCellText(cell);

    // Take all the non-empty lines from the cell
    const lines = currentCode.split('\n').filter(line => {return line.length > 0});
    if (lines.length == 0) {
        return false;
    }

    const lastLine = lines[lines.length - 1];
    /* 
        We check if the last line contains a mitosheet.sheet call, which can happen in a few ways
        
        1. `import mitosheet` -> mitosheet.sheet()
        2. `import mitosheet as {THING}` -> {THING}.sheet(
        3. `from mitosheet import sheet` -> sheet(

        We detect all three by checking if the line contains `sheet(`!
    */

    return lastLine.indexOf('sheet(') !== -1;
}

// Returns true iff a the given cell is a cell containing the generated code
function isMitoAnalysisCell(cell: ICellModel | undefined): boolean {
    const currentCode = getCellText(cell);
    // Handle the old and new Mito boilerplate code
    return currentCode.startsWith('# MITO CODE START') 
        || currentCode.startsWith('from mitosheet import *; register_analysis(')
        || currentCode.startsWith('from mitosheet import *; # Analysis:')
}

/* 
    Returns True if the passed cell is empty.
    Returns False if the passed cells is either not empty or undefined 
*/
export function isEmptyCell(cell: ICellModel | undefined): boolean {
    if (cell === undefined) {
        return false;
    }
    const currentCode = getCellText(cell);
    return currentCode.trim() === '';
}

export function writeToCell(cell: ICellModel | undefined, code: string): void {
    if (cell == undefined) {
        return;
    }
    const value = cell.modelDB.get('value') as IObservableString;
    value.text = code;
}

export function getLastNonEmptyLine(cell: ICellModel | undefined): string | undefined {
    if (cell === undefined) {
        return undefined
    }
    const activeCellText = getCellText(cell)
    const filteredActiveText = activeCellText.split(/\r?\n/).filter(line => line.trim().length > 0)
    return filteredActiveText.length > 0 ? filteredActiveText.pop() : undefined
}

/* 
    Returns true if the cell contains a mitosheet.sheet(analysis_to_replay={analysisName})
*/
export function containsMitosheetCallWithSpecificAnalysisToReplay(cell: ICellModel | undefined, analysisName: string): boolean {
    const currentCode = getCellText(cell);
    return currentCode.includes('sheet(') && currentCode.includes(`analysis_to_replay="${analysisName}"`)
}

/* 
    Returns true if the cell contains a mitosheet.sheet(analysis_to_replay={analysisName})
*/
export function containsMitosheetCallWithAnyAnalysisToReplay(cell: ICellModel | undefined): boolean {
    const currentCode = getCellText(cell);
    return isMitosheetCallCell(cell) && currentCode.includes(`analysis_to_replay=`)
}

/* 
    Returns true if the cell contains the code generated for a specific analysis name
*/
export function containsGeneratedCodeOfAnalysis(cell: ICellModel | undefined, analysisName: string): boolean {
    const currentCode = getCellText(cell);
    return isMitoAnalysisCell(cell) && currentCode.includes(analysisName);
}


export const getArgsFromMitosheetCallCell = (mitosheetCallCell: ICellModel | undefined): string[] => {
    const content = getCellText(mitosheetCallCell);

    let nameString = content.split('mitosheet.sheet(')[1].split(')')[0];

    // If there is a tutorial mode parameter passed, we ignore it
    if (nameString.includes('tutorial_mode')) {
        nameString = nameString.split('tutorial_mode')[0].trim();
    }

    // If there is a (old) analysis name parameter passed, we ignore it
    if (nameString.includes('saved_analysis_name')) {
        nameString = nameString.split('saved_analysis_name')[0].trim();
    }

    // If there is a (new) analysis name parameter passed, we ignore it
    if (nameString.includes('analysis_to_replay')) {
        nameString = nameString.split('analysis_to_replay')[0].trim();
    }

    // If there is a view_df name parameter, we ignore it
    if (nameString.includes('view_df')) {
        nameString = nameString.split('view_df')[0].trim();
    }

    // Get the args and trim them up
    let args = nameString.split(',').map(dfName => dfName.trim());
    
    // Remove any names that are empty. Note that some of these names
    // may be strings, which we turn into valid df_names on the backend!
    args = args.filter(dfName => {return dfName.length > 0});

    return args;
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

    const cellsIterator = cells.iter();
    let cell = cellsIterator.next();
    let cellIndex = 0;
    while (cell) {
        if (containsMitosheetCallWithSpecificAnalysisToReplay(cell, analysisName)) {
            return [cell, cellIndex];
        }

        cellIndex++;
        cell = cellsIterator.next();
    }

    return undefined;
}

/**
 * Given a cell, will check if it has a mitosheet.sheet() call with the old
 * analysis to replay, and if so will replace it with the new analysis to 
 * replay
 */
export function tryOverwriteAnalysisToReplayParameter(cell: ICellModel | undefined, oldAnalysisName: string, newAnalysisName: string): boolean {
    if (isMitosheetCallCell(cell) && containsMitosheetCallWithSpecificAnalysisToReplay(cell, oldAnalysisName)) {
        const currentCode = getCellText(cell);

        const newCode = currentCode.replace(
            `analysis_to_replay="${oldAnalysisName}")`,
            `analysis_to_replay="${newAnalysisName}")`
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
    if (isMitosheetCallCell(cell) && !containsMitosheetCallWithAnyAnalysisToReplay(cell)) {
        const currentCode = getCellText(cell);

        // We know the mitosheet.sheet() call is the last thing in the cell, so we 
        // just replace the last closing paren
        const lastIndex = currentCode.lastIndexOf(')');
        let replacement = ``;
        if (currentCode.includes('sheet()')) {
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

/**
 * A function that returns the [cell, index] pair of the mitosheet.sheet() call that contains
 * the analysis name. 
 * 
 * If no mitosheet.sheet() call contains this analysis name, then we assume it hasen't been 
 * written yet, and take our best guess at which sheet this is
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
    if (previousCell && isMitosheetCallCell(previousCell) && !containsMitosheetCallWithAnyAnalysisToReplay(previousCell)) {
        return [previousCell, activeCellIndex - 1];
    } 

    // The next case we check is if they did a run and not advance, which means that the currently
    // selected cell is the mitosheet.sheet call
    if (activeCell && isMitosheetCallCell(activeCell) && !containsMitosheetCallWithAnyAnalysisToReplay(activeCell)) {
        return [activeCell, activeCellIndex];
    }

    // The last case is that the user did some sort of run all, in which case we cross our fingers
    // that there is only one cell that does not have a mitosheet call, and go looking for it
    let index = activeCellIndex;
    while (index >= 0) {
        const cell = getCellAtIndex(cells, index)
        if (cell && isMitosheetCallCell(cell) && !containsMitosheetCallWithAnyAnalysisToReplay(cell)) {
            return [cell, index];
        }
        index--;
    }

    return undefined;
}