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
    createCodeCellAtIndexAndActivate, 
    didCellExecutionError, 
    getActiveCellIDInNotebookPanel, 
    setActiveCellByIDInNotebookPanel, 
    writeCodeToCellByIDInNotebookPanel, 
    scrollToCell, 
} from "./notebook"
import { ChatHistoryManager } from "../Extensions/AiChat/ChatHistoryManager"
import { MutableRefObject } from "react"
import { CellUpdate } from "../websockets/completions/CompletionModels"

export const acceptAndRunCellUpdate = async (
    cellUpdate: CellUpdate,
    notebookPanel: NotebookPanel,
): Promise<void> => {

    // If the cellUpdate is creating a new code cell, insert it 
    // before previewing and accepting the code. It is safe to do this 
    // in the background agent because it does not effect the active cell 
    // in other notebooks.
    if (cellUpdate.type === 'new' ) {
        // makes the cell the active cell
        createCodeCellAtIndexAndActivate(notebookPanel, cellUpdate.index)
    } else {
        setActiveCellByIDInNotebookPanel(notebookPanel, cellUpdate.id)
    }

    const notebook = notebookPanel.content;
    const context = notebookPanel.context;

    if (notebook === undefined) {
        return;
    }

    const cellID = getActiveCellIDInNotebookPanel(notebookPanel)

    writeCodeToCellByIDInNotebookPanel(notebookPanel, cellUpdate.code, cellID)

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
}


export const retryIfExecutionError = async (
    notebookPanel: NotebookPanel, 
    app: JupyterFrontEnd,
    sendAgentSmartDebugMessage: (errorMessage: string) => Promise<void>,
    shouldContinueAgentExecution: MutableRefObject<boolean>,
    markAgentForStopping: () => Promise<void>,
    chatHistoryManagerRef: React.MutableRefObject<ChatHistoryManager>
): Promise<'success' | 'failure' | 'interupted'> => {

    const cell = notebookPanel.content.activeCell as CodeCell;

    // Note: If you update the max retries, update the message we display on each failure
    // attempt to ensure we don't say "third attempt" over and over again.
    const MAX_RETRIES = 3;
    let attempts = 0;
    let runAllCellsAttempts = 0;
    const MAX_RUN_ALL_CELLS_ATTEMPTS = 2; // Only allow two run_all_cells attempt per error cycle

    while (didCellExecutionError(cell) && attempts < MAX_RETRIES) {

        if (!shouldContinueAgentExecution.current) {
            await markAgentForStopping()
            return 'interupted';
        }

        // If the code cell has an error, we need to send the error to the AI
        // and get it to fix the error.
        const errorOutput = cell?.model.outputs?.toJSON().find(output => output.output_type === "error");
        if (!errorOutput) {
            return 'success'; // If no error output, we're done
        }
        const errorMessage = getFullErrorMessageFromTraceback(errorOutput.traceback as string[]);

        await sendAgentSmartDebugMessage(errorMessage)
        const aiDisplayOptimizedChatItem = chatHistoryManagerRef.current.getLastAIDisplayOptimizedChatItem();

        // Handle different response types from the agent when fixing errors
        const agentResponse = aiDisplayOptimizedChatItem?.agentResponse;
        
        if (!agentResponse) {
            return 'failure'
        }

        if (agentResponse.type === 'cell_update') {
            const cellUpdate = agentResponse.cell_update
            
            if (cellUpdate !== undefined && cellUpdate !== null) {
                await acceptAndRunCellUpdate(
                    cellUpdate, 
                    notebookPanel
                )
            }
        } else if (agentResponse.type === 'run_all_cells') {
            // Prevent infinite loops by limiting run_all_cells attempts
            if (runAllCellsAttempts >= MAX_RUN_ALL_CELLS_ATTEMPTS) {
                console.log('Maximum run_all_cells attempts reached, treating as failure');
                return 'failure';
            }
            
            runAllCellsAttempts++;
            // Execute runAllCells to fix NameError issues
            const result = await runAllCells(app, notebookPanel);
            if (!result.success) {
                // If run_all_cells resulted in an error, we should continue with error handling
                // The error will be caught in the main loop
                console.log('Error after running all cells:', result.errorMessage);
            }
        } else {
            // Agent responded with an unexpected type for error fixing
            return 'failure'
        }

        attempts++;

        // If this was the last attempt and it still failed
        if (attempts === MAX_RETRIES && didCellExecutionError(cell)) {
            return 'failure'
        }
    }

    return 'success'
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