/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { JupyterFrontEnd } from "@jupyterlab/application"
import { CodeCell } from "@jupyterlab/cells"
import { INotebookTracker } from "@jupyterlab/notebook"
import { getFullErrorMessageFromTraceback } from "../Extensions/ErrorMimeRenderer/errorUtils"
import { sleep } from "./sleep"
import { createCodeCellAtIndexAndActivate, didCellExecutionError, setActiveCellByID, getActiveCellID, scrollToCell } from "./notebook"
import { ChatHistoryManager, PromptType } from "../Extensions/AiChat/ChatHistoryManager"
import { MutableRefObject } from "react"
import { CellUpdate } from "../websockets/completions/CompletionModels"

export const acceptAndRunCellUpdate = async (
    cellUpdate: CellUpdate,
    notebookTracker: INotebookTracker,
    app: JupyterFrontEnd,
    previewAICodeToActiveCell: () => void,
    acceptAICode: () => void
): Promise<void> => {

    // If the cellUpdate is creating a new code cell, insert it 
    // before previewing and accepting the code. 
    if (cellUpdate.type === 'new' ) {
        // makes the cell the active cell
        createCodeCellAtIndexAndActivate(notebookTracker, cellUpdate.index)
    } else {
        setActiveCellByID(notebookTracker, cellUpdate.id)
    }

    // The target cell should now be the active cell
    await acceptAndRunCode(app, notebookTracker, previewAICodeToActiveCell, acceptAICode, cellUpdate.cell_type)
}

export const acceptAndRunCode = async (
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    previewAICodeToActiveCell: () => void,
    acceptAICode: () => void,
    cellType: 'code' | 'markdown'
): Promise<void> => {
    /* 
        PreviewAICode applies the code to the current active code cell, 
        so make sure that correct cell is active before calling 
        this function
    */
    previewAICodeToActiveCell()
    acceptAICode()

    // We always create code cells, and then convert to markdown if necessary.
    if (cellType === 'markdown') {
        await app.commands.execute("notebook:change-cell-to-markdown");
    } else if (cellType === 'code') {
        await app.commands.execute("notebook:change-cell-to-code");
    }
    
    // This awaits until after the execution is finished.
    // Note that it is important that we just run the cell and don't run and advance the cell. 
    // We rely on the active cell remaining the same after running the cell in order to get the output
    // of the cell to send to the agent. This is changeable in the future, but for now its an invariant we rely on.
    await app.commands.execute("notebook:run-cell");

    // Scroll to the bottom of the active cell to show the output
    const activeCellID = getActiveCellID(notebookTracker);
    if (activeCellID) {
        scrollToCell(notebookTracker, activeCellID, undefined, 'end');
    }

    // By sleeping here, we make sure that this function returns after the variable manager
    // has updated the state of the variables. This ensures that on the next Ai message
    // gets the most up to date data.
    await sleep(1000)
}

export const retryIfExecutionError = async (
    notebookTracker: INotebookTracker, 
    app: JupyterFrontEnd,
    getDuplicateChatHistoryManager: () => ChatHistoryManager,
    addAIMessageFromResponseAndUpdateState: (messageContent: string, promptType: PromptType, chatHistoryManager: ChatHistoryManager, mitoAIConnectionError?: boolean, mitoAIConnectionErrorType?: string | null) => void,
    sendAgentSmartDebugMessage: (errorMessage: string) => Promise<void>,
    previewAICodeToActiveCell: () => void,
    acceptAICode: () => void,
    shouldContinueAgentExecution: MutableRefObject<boolean>,
    finalizeAgentStop: () => void,
    chatHistoryManagerRef: React.MutableRefObject<ChatHistoryManager>
): Promise<'success' | 'failure' | 'interupted'> => {

    const cell = notebookTracker.currentWidget?.content?.activeCell as CodeCell;

    // Note: If you update the max retries, update the message we display on each failure
    // attempt to ensure we don't say "third attempt" over and over again.
    const MAX_RETRIES = 3;
    let attempts = 0;

    while (didCellExecutionError(cell) && attempts < MAX_RETRIES) {

        if (!shouldContinueAgentExecution.current) {
            finalizeAgentStop()
            return 'interupted';
        }

        // If the code cell has an error, we need to send the error to the AI
        // and get it to fix the error.
        const errorOutput = cell?.model.outputs?.toJSON().find(output => output.output_type === "error");
        if (!errorOutput) {
            return 'success'; // If no error output, we're done
        }
        const errorMessage = getFullErrorMessageFromTraceback(errorOutput.traceback as string[]);

        const newChatHistoryManager = getDuplicateChatHistoryManager()

        addAIMessageFromResponseAndUpdateState(
            attempts === 0 
                ? "Hmm, looks like my first attempt didn't work. Let me try again."
                : `Looks like my ${attempts === 1 ? 'second' : 'third'} attempt didn't work. ${attempts === 1 ? 'Let me try again.': "Let me try one more time. If I cannot figure it out this time, I'll ask you for more information"}`,
            'agent:execution',
            newChatHistoryManager
        )

        // Wait two seconds so the use can more easily see what is going on 
        await sleep(2000)

        await sendAgentSmartDebugMessage(errorMessage)
        const aiDisplayOptimizedChatItem = chatHistoryManagerRef.current.getLastAIDisplayOptimizedChatItem();

        // TODO: We expect that the agent responds with a cell_update if they are prompted to fix an error. 
        // But we are not enforcing that right now. We can fix this by setting the response_format for agent:smartDebug
        // to only allow cell_updates and then we can return the agentResponse from sendAgentSmartDebugMessage so 
        // typescript knows what type it is. 
        if (aiDisplayOptimizedChatItem?.agentResponse?.type !== 'cell_update' || aiDisplayOptimizedChatItem?.agentResponse?.cell_update === undefined) {
            return 'failure'
        }

        const cellUpdate = aiDisplayOptimizedChatItem.agentResponse.cell_update
        
        if (cellUpdate !== undefined && cellUpdate !== null) {
            await acceptAndRunCellUpdate(
                cellUpdate, 
                notebookTracker, 
                app,
                previewAICodeToActiveCell, 
                acceptAICode
            )
        }

        attempts++;

        // If this was the last attempt and it still failed
        if (attempts === MAX_RETRIES && didCellExecutionError(cell)) {
            return 'failure'
        }
    }

    return 'success'
}

