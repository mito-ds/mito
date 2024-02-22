import { PublicInterfaceVersion } from "../../mito";
import { MitoAPI } from "../../mito/api/api";
import { containsGeneratedCodeOfAnalysis, containsMitosheetCallWithAnyAnalysisToReplay, containsMitosheetCallWithSpecificAnalysisToReplay, getArgsFromMitosheetCallCode, getCodeString, isMitosheetCallCode, removeWhitespaceInPythonCode } from "../code";

type CellType = any;

export function getCellAtIndex(index: number): CellType | undefined {
    return (window as any).Jupyter?.notebook?.get_cell(index);
}

export function getCellText(cell: CellType | undefined): string {
    return cell?.get_text() || '';
}


/* 
    Returns True if the passed cell is empty.
    Returns False if the passed cells is either not empty or undefined 
*/
export function isEmptyCell(cell: CellType | undefined): boolean {
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
export function getCellCallingMitoshetWithAnalysis(analysisName: string): [CellType, number] | undefined  {
    const cells: CellType[] = (window as any).Jupyter?.notebook?.get_cells();

    if (cells === undefined) {
        return undefined;
    }

    let cellIndex = 0;
    for (const cell of cells) {
        if (containsMitosheetCallWithSpecificAnalysisToReplay(getCellText(cell), analysisName)) {
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
export function getMostLikelyMitosheetCallingCell(analysisName: string | undefined): [CellType, number] | undefined {

    // First, we check if this analysis name is in a mitosheet call, in which case things are easy
    if (analysisName) {
        const mitosheetCallCellAndIndex = getCellCallingMitoshetWithAnalysis(analysisName);
        if (mitosheetCallCellAndIndex !== undefined) {
            return mitosheetCallCellAndIndex;
        }
    }

    const cells = (window as any).Jupyter?.notebook?.get_cells();

    if (cells == undefined) {
        return;
    }

    const activeCell = (window as any).Jupyter?.notebook?.get_cell((window as any).Jupyter?.notebook?.get_anchor_index());
    const activeCellIndex = (window as any).Jupyter?.notebook?.get_anchor_index() || 0;

    const previousCell = getCellAtIndex(activeCellIndex - 1)

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
        const cell = getCellAtIndex(index)
        if (cell && isMitosheetCallCode(getCellText(cell)) && !containsMitosheetCallWithAnyAnalysisToReplay(getCellText(cell))) {
            return [cell, index];
        }
        index--;
    }

    return undefined;
}

export function writeToCell(cell: CellType | undefined, code: string): void {
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
export function tryOverwriteAnalysisToReplayParameter(cell: CellType | undefined, oldAnalysisName: string, newAnalysisName: string): boolean {
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
export function tryWriteAnalysisToReplayParameter(cell: CellType | undefined, analysisName: string): boolean {
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


export const notebookGetArgs = (analysisToReplayName: string | undefined): string[] => {
    const cellAndIndex = getMostLikelyMitosheetCallingCell(analysisToReplayName);
    if (cellAndIndex) {
        const [cell, ] = cellAndIndex;
        return getArgsFromMitosheetCallCode(getCellText(cell));
    } else {
        return [];
    }
}

export const notebookWriteAnalysisToReplayToMitosheetCall = (analysisName: string, mitoAPI: MitoAPI): void => {
    const cellAndIndex = getMostLikelyMitosheetCallingCell(analysisName);

    if (cellAndIndex) {
        const [cell, ] = cellAndIndex;
        const written = tryWriteAnalysisToReplayParameter(cell, analysisName);
        if (written) {
            return;
        }
    } 

    // Log if we are unable to write this param for any reason
    void mitoAPI.log('write_analysis_to_replay_to_mitosheet_call_failed');
}

export const notebookOverwriteAnalysisToReplayToMitosheetCall = (oldAnalysisName: string, newAnalysisName: string, mitoAPI: MitoAPI): void => {

    const mitosheetCallCellAndIndex = getCellCallingMitoshetWithAnalysis(oldAnalysisName);
    if (mitosheetCallCellAndIndex === undefined) {
        return;
    }

    const [mitosheetCallCell, ] = mitosheetCallCellAndIndex;

    const overwritten = tryOverwriteAnalysisToReplayParameter(mitosheetCallCell, oldAnalysisName, newAnalysisName);
    if (!overwritten) {
        void mitoAPI.log('overwrite_analysis_to_replay_to_mitosheet_call_failed');
    }
}

export const notebookWriteGeneratedCodeToCell = (analysisName: string, codeLines: string[], telemetryEnabled: boolean, publicInterfaceVersion: PublicInterfaceVersion, oldCode?: string[]): void => {
    const code = getCodeString(analysisName, codeLines, telemetryEnabled, publicInterfaceVersion);
        
    // Find the cell that made the mitosheet.sheet call, and if it does not exist, give
    // up immediately
    const mitosheetCallCellAndIndex = getCellCallingMitoshetWithAnalysis(analysisName);
    if (mitosheetCallCellAndIndex === undefined) {
        return;
    }

    const [, mitosheetCallIndex] = mitosheetCallCellAndIndex;

    const cells = (window as any).Jupyter?.notebook?.get_cells();

    if (cells === undefined) {
        return;
    }

    const activeCellIndex = (window as any).Jupyter?.notebook?.get_anchor_index() || 0;

    const codeCell = getCellAtIndex(mitosheetCallIndex + 1);


    // We're removing the first line of the old code and the cell code because
    // the cell code contains the analysis id and the old code does not
    const oldCodeWithoutFirstLine = oldCode?.slice(1).join('\n');
    const cellCodeWithoutFirstLine = getCellText(codeCell)?.split('\n').slice(1).join('\n');

    if (isEmptyCell(codeCell) || containsGeneratedCodeOfAnalysis(getCellText(codeCell), analysisName)) {
        if (!isEmptyCell(codeCell) && oldCodeWithoutFirstLine !== cellCodeWithoutFirstLine) {
            return;
        }
        writeToCell(codeCell, code)
    } else {
        // If we cannot write to the cell below, we have to go back a new cell below, 
        // which can eb a bit of an involve process
        if (mitosheetCallIndex !== activeCellIndex) {
            // We have to move our selection back up to the cell that we 
            // make the mitosheet call to 
            if (mitosheetCallIndex < activeCellIndex) {
                for (let i = 0; i < (activeCellIndex - mitosheetCallIndex); i++) {
                    (window as any).Jupyter?.notebook?.select_prev();
                }
            } else if (mitosheetCallIndex > activeCellIndex) {
                for (let i = 0; i < (mitosheetCallIndex - activeCellIndex); i++) {
                    (window as any).Jupyter?.notebook?.select_next();
                }
            }
        }
        // And then write to this new cell below, which is not the active cell but we
        // should make it the actice cell
        (window as any).Jupyter?.notebook?.insert_cell_below();
        (window as any).Jupyter?.notebook?.select_next();
        const activeCell = (window as any).Jupyter?.notebook?.get_cell((window as any).Jupyter?.notebook?.get_anchor_index());
        writeToCell(activeCell, code);
    }
}

export const notebookWriteCodeSnippetCell = (analysisName: string, code: string): void => {
        
    // Find the cell that made the mitosheet.sheet call, and if it does not exist, give
    // up immediately
    const mitosheetCallCellAndIndex = getCellCallingMitoshetWithAnalysis(analysisName);
    if (mitosheetCallCellAndIndex === undefined) {
        return;
    }

    const [, mitosheetCallIndex] = mitosheetCallCellAndIndex;

    const cells = (window as any).Jupyter?.notebook?.get_cells();

    if (cells === undefined) {
        return;
    }

    const codeCell = getCellAtIndex(mitosheetCallIndex + 1);

    if (isEmptyCell(codeCell)) {
        writeToCell(codeCell, code)
    } else {
        // Otherwise, we assume we have the mitosheet selected, so we select the next one, and then 
        // insert below so we have new cell below the generated code
        (window as any).Jupyter?.notebook?.select_next();
        (window as any).Jupyter?.notebook?.insert_cell_below();
        (window as any).Jupyter?.notebook?.select_next();
        const activeCell = (window as any).Jupyter?.notebook?.get_cell((window as any).Jupyter?.notebook?.get_anchor_index());
        writeToCell(activeCell, code);
    }
}





export const writeEmptyMitosheetCell = (): void => {
    // Create a new cell below the active code cell
    (window as any).Jupyter?.notebook?.insert_cell_below();
    (window as any).Jupyter?.notebook?.select_next();
    const activeCell = (window as any).Jupyter?.notebook?.get_cell((window as any).Jupyter?.notebook?.get_anchor_index());

    // Add mitosheet.sheet call to new code cell
    if (isEmptyCell(activeCell)) {
        writeToCell(activeCell, 'import mitosheet\nmitosheet.sheet()');
        (window as any).Jupyter?.notebook?.execute_cell_and_insert_below();
    }
}