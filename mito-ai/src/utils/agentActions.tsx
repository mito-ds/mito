import { JupyterFrontEnd } from "@jupyterlab/application"
import { CodeCell } from "@jupyterlab/cells"
import { INotebookTracker } from "@jupyterlab/notebook"
import { getFullErrorMessageFromTraceback } from "../Extensions/ErrorMimeRenderer/errorUtils"
import { sleep } from "./sleep"
import { didCellExecutionError } from "./notebook"

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
    sendDebugErrorMessage: (errorMessage: string) => Promise<void>,
    previewAICode: () => void,
    acceptAICode: () => void,
): Promise<void> => {
    console.log('checking for error')
    const cell = notebookTracker.currentWidget?.content?.activeCell as CodeCell;

    if (didCellExecutionError(cell)) {
        console.log('error found')

        await sleep(5000)

        console.log('Error found')
        // If the code cell has an error, we need to send the error to the AI
        // and get it to fix the error.
        const errorTraceback = cell?.model.outputs?.toJSON()[0].traceback as string[]
        const errorMessage = getFullErrorMessageFromTraceback(errorTraceback)

        console.log('sending error to AI')

        await sendDebugErrorMessage(errorMessage)
        await acceptAndRunCode(app, previewAICode, acceptAICode)
    }
}