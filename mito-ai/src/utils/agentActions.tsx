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
    getDuplicateChatHistoryManager: () => ChatHistoryManager,
    addAIMessageFromResponseAndUpdateState: (messageContent: string, promptType: PromptType, chatHistoryManager: ChatHistoryManager, mitoAIConnectionError?: boolean, mitoAIConnectionErrorType?: string | null) => void,
    sendDebugErrorMessage: (errorMessage: string) => Promise<void>,
    previewAICode: () => void,
    acceptAICode: () => void,
): Promise<boolean> => {
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

        const newChatHistoryManager = getDuplicateChatHistoryManager()

        addAIMessageFromResponseAndUpdateState(
            attempts === 0 
                ? "Hmm, looks like my first attempt didn't work. Let me try again."
                : `Looks like my ${attempts === 1 ? 'second' : 'third'} attempt didn't work. ${attempts === 1 ? 'Let me try again.': "Let me try one more time. If I cannot figure it out this time, I'll ask you for more information"}`,
            'agent:execution',
            newChatHistoryManager
        )
        await sendDebugErrorMessage(errorMessage)
        await acceptAndRunCode(app, previewAICode, acceptAICode)
        attempts++;

        // If this was the last attempt and it still failed
        if (attempts === MAX_RETRIES && didCellExecutionError(cell)) {
            return false
        }
    }

    return true
}