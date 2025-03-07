import { JupyterFrontEnd } from "@jupyterlab/application"
import { CodeCell } from "@jupyterlab/cells"
import { INotebookTracker } from "@jupyterlab/notebook"
import { getFullErrorMessageFromTraceback } from "../Extensions/ErrorMimeRenderer/errorUtils"
import { sleep } from "./sleep"
import { createCodeCellAtIndexAndActivate, didCellExecutionError, setActiveCellByID } from "./notebook"
import { ChatHistoryManager, PromptType } from "../Extensions/AiChat/ChatHistoryManager"
import { MutableRefObject } from "react"
import { CellUpdate } from "./websocket/models"

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
    await acceptAndRunCode(app, previewAICodeToActiveCell, acceptAICode)
}

export const acceptAndRunCode = async (
    app: JupyterFrontEnd,
    previewAICodeToActiveCell: () => void,
    acceptAICode: () => void,
):Promise<void> => {
    /* 
        PreviewAICode applies the code to the current active code cell, 
        so make sure that correct cell is active before calling 
        this function
    */
    previewAICodeToActiveCell()
    acceptAICode()
    await app.commands.execute("notebook:run-cell");
}

export const retryIfExecutionError = async (
    notebookTracker: INotebookTracker, 
    app: JupyterFrontEnd,
    getDuplicateChatHistoryManager: () => ChatHistoryManager,
    addAIMessageFromResponseAndUpdateState: (messageContent: string, promptType: PromptType, chatHistoryManager: ChatHistoryManager, mitoAIConnectionError?: boolean, mitoAIConnectionErrorType?: string | null) => void,
    sendDebugErrorMessage: (errorMessage: string, agent?: boolean) => Promise<void>,
    previewAICode: () => void,
    acceptAICode: () => void,
    shouldContinueAgentExecution: MutableRefObject<boolean>,
    finalizeAgentStop: () => void,
): Promise<'success' | 'failure' | 'interupted'> => {

    console.log("retry if execution error")

    const cell = notebookTracker.currentWidget?.content?.activeCell as CodeCell;

    // Note: If you update the max retries, update the message we display on each failure
    // attempt to ensure we don't say "third attempt" over and over again.
    const MAX_RETRIES = 3;
    let attempts = 0;

    while (didCellExecutionError(cell) && attempts < MAX_RETRIES) {
        console.log("code errored")

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

        console.log('sending debug error')
        await sendDebugErrorMessage(errorMessage, true)
        console.log('sente error debug')
        await acceptAndRunCode(app, previewAICode, acceptAICode)
        console.log("accepted and retrying")
        attempts++;

        // If this was the last attempt and it still failed
        if (attempts === MAX_RETRIES && didCellExecutionError(cell)) {
            return 'failure'
        }
    }

    return 'success'
}