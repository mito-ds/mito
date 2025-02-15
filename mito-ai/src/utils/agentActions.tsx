import { JupyterFrontEnd } from "@jupyterlab/application"
import { CodeCell } from "@jupyterlab/cells"
import { INotebookTracker } from "@jupyterlab/notebook"
import { getFullErrorMessageFromTraceback } from "../Extensions/ErrorMimeRenderer/errorUtils"
import { sleep } from "./sleep"
import { didCellExecutionError } from "./notebook"
import { ChatHistoryManager, PromptType } from "../Extensions/AiChat/ChatHistoryManager"

export const acceptAndRunCode = async (
    app: JupyterFrontEnd,
    previewAICode: () => void,
    acceptAICode: () => void,
) => {
    previewAICode()
    acceptAICode()
    await app.commands.execute("notebook:run-cell");
}

export const retryIfExecutionError = async (
    notebookTracker: INotebookTracker, 
    app: JupyterFrontEnd,
    chatHistoryManager: ChatHistoryManager,
    addAIMessageFromResponseAndUpdateState: (messageContent: string, promptType: PromptType, chatHistoryManager: ChatHistoryManager, mitoAIConnectionError?: boolean, mitoAIConnectionErrorType?: string | null) => void,
    sendDebugErrorMessage: (errorMessage: string) => Promise<void>,
    previewAICode: () => void,
    acceptAICode: () => void,
): Promise<void> => {
    console.log('checking for error')
    const cell = notebookTracker.currentWidget?.content?.activeCell as CodeCell;
    const MAX_RETRIES = 3;
    let attempts = 0;

    while (didCellExecutionError(cell) && attempts < MAX_RETRIES) {
        console.log(`Error found - Attempt ${attempts + 1} of ${MAX_RETRIES}`)

        await sleep(5000)

        // If the code cell has an error, we need to send the error to the AI
        // and get it to fix the error.
        const errorTraceback = cell?.model.outputs?.toJSON()[0].traceback as string[]
        const errorMessage = getFullErrorMessageFromTraceback(errorTraceback)

        console.log('sending error to AI')

        addAIMessageFromResponseAndUpdateState(
            attempts === 0 
                ? "Hmm it looks like my first attempt failed. Let me try to fix my error."
                : `My attempt ${attempts + 1} failed. Let me try again.`,
            'agent:execution',
            chatHistoryManager
        )
        await sendDebugErrorMessage(errorMessage)
        await acceptAndRunCode(app, previewAICode, acceptAICode)
        attempts++;

        // If this was the last attempt and it still failed, inform the user
        if (attempts === MAX_RETRIES && didCellExecutionError(cell)) {
            addAIMessageFromResponseAndUpdateState(
                "I apologize, but I was unable to fix the error after 3 attempts. You may want to try rephrasing your request or providing more context.",
                'agent:execution',
                chatHistoryManager
            )
        }
    }
}