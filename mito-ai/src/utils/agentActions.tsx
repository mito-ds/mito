/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { JupyterFrontEnd } from "@jupyterlab/application"
import { CodeCell } from "@jupyterlab/cells"
import { NotebookActions, NotebookPanel } from "@jupyterlab/notebook"
import { getFullErrorMessageFromTraceback } from "../Extensions/ErrorMimeRenderer/errorUtils"
import { sleep } from "./sleep"
import { 
    createCodeCellAfterCellIDAndActivate,
    didCellExecutionError, 
    getActiveCellIDInNotebookPanel, 
    getCellIndexByIDInNotebookPanel,
    setActiveCellByIDInNotebookPanel, 
    writeCodeToCellByIDInNotebookPanel, 
    scrollToCell, 
} from "./notebook"
import { CellUpdate } from "../websockets/completions/CompletionModels"

export interface ICellUpdateApplyResult {
    success: boolean;
    errorMessage?: string;
}

export const acceptAndRunCellUpdate = async (
    cellUpdate: CellUpdate,
    notebookPanel: NotebookPanel,
): Promise<ICellUpdateApplyResult> => {

    // If the cellUpdate is creating a new code cell, insert it 
    // before previewing and accepting the code. It is safe to do this 
    // in the background agent because it does not effect the active cell 
    // in other notebooks.
    if (cellUpdate.type === 'new' ) {
        // makes the cell the active cell
        if (cellUpdate.after_cell_id === undefined || cellUpdate.after_cell_id === null) {
            return {
                success: false,
                errorMessage: 'CELL_UPDATE failed: `after_cell_id` is required for new cell creation.',
            };
        }
        if (
            cellUpdate.after_cell_id !== 'new cell' &&
            getCellIndexByIDInNotebookPanel(notebookPanel, cellUpdate.after_cell_id) === undefined
        ) {
            return {
                success: false,
                errorMessage: `CELL_UPDATE failed: after_cell_id '${cellUpdate.after_cell_id}' was not found in the current notebook.`,
            };
        }
        createCodeCellAfterCellIDAndActivate(notebookPanel, cellUpdate.after_cell_id)
    } else {
        if (!cellUpdate.id) {
            return {
                success: false,
                errorMessage: 'CELL_UPDATE failed: `id` is required for modification updates.',
            };
        }
        if (getCellIndexByIDInNotebookPanel(notebookPanel, cellUpdate.id) === undefined) {
            return {
                success: false,
                errorMessage: `CELL_UPDATE failed: target cell id '${cellUpdate.id}' was not found in the current notebook.`,
            };
        }
        setActiveCellByIDInNotebookPanel(notebookPanel, cellUpdate.id)
    }

    const notebook = notebookPanel.content;
    const context = notebookPanel.context;

    if (notebook === undefined) {
        return {
            success: false,
            errorMessage: 'CELL_UPDATE failed: notebook is unavailable.',
        };
    }

    const cellID = getActiveCellIDInNotebookPanel(notebookPanel)
    if (!cellID) {
        return {
            success: false,
            errorMessage: 'CELL_UPDATE failed: no active cell could be resolved for writing.',
        };
    }

    writeCodeToCellByIDInNotebookPanel(
        notebookPanel,
        cellUpdate.code,
        cellID,
        cellUpdate.cell_type !== 'markdown',
    )

    // We always create code cells, and then convert to markdown if necessary.
    if (cellUpdate.cell_type === 'markdown') {
        NotebookActions.changeCellType(notebook, 'markdown');
    } else if (cellUpdate.cell_type === 'code') {
        NotebookActions.changeCellType(notebook, 'code');
    }
    
    // This awaits until after the execution is finished.
    // Note that it is important that we just run the cell and don't run and advance the cell. 
    // We rely on the active cell remaining the same after running the cell in order to get the output
    // of the cell to send to the agent. This is changeable in the future, but for now its an invariant we rely on.
    await NotebookActions.run(notebook, context?.sessionContext);
    
    // Scroll to the bottom of the active cell to show the output
    // as long as we are not operating in background agent mode.
    const activeCellID = getActiveCellIDInNotebookPanel(notebookPanel);
    if (activeCellID) {
        scrollToCell(notebookPanel, activeCellID, undefined, 'end');
    }

    // By sleeping here, we make sure that this function returns after the variable manager
    // has updated the state of the variables. This ensures that on the next Ai message
    // gets the most up to date data.
    await sleep(1000)
    return { success: true };
}

export const runAllCells = async (
    app: JupyterFrontEnd,
    notebookPanel: NotebookPanel
): Promise<{ success: boolean; errorMessage?: string; errorCellId?: string }> => {
    const notebook = notebookPanel.content;
    const sessionContext = notebookPanel.context?.sessionContext;
    await NotebookActions.runAll(notebook, sessionContext);
    
    // Give the execution some time to complete and update variables
    // This ensures that the variable manager has time to update the state
    await sleep(2000);
    
    // Iterate through all cells to find any with errors
    for (let i = 0; i < notebook.widgets.length; i++) {
        const cell = notebook.widgets[i];
        if (cell && cell.model.type === 'code') {
            const codeCell = cell as CodeCell;
            if (didCellExecutionError(codeCell)) {
                const errorOutput = codeCell.model.outputs?.toJSON().find(output => output.output_type === "error");
                if (errorOutput) {
                    const errorMessage = getFullErrorMessageFromTraceback(errorOutput.traceback as string[]);
                    return { 
                        success: false, 
                        errorMessage: errorMessage,
                        errorCellId: codeCell.model.id
                    };
                }
            }
        }
    }
    
    return { success: true };
}