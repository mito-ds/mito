import { JupyterFrontEnd } from "@jupyterlab/application"
import { CodeCell } from "@jupyterlab/cells"
import { INotebookTracker } from "@jupyterlab/notebook"
import { getFullErrorMessageFromTraceback } from "../Extensions/ErrorMimeRenderer/errorUtils"
import { sleep } from "./sleep"
import { COMMAND_MITO_AI_SEND_DEBUG_ERROR_MESSAGE } from "../commands"
import { didCellExecutionError } from "./notebook"

export const acceptAndRunCode = async (app: JupyterFrontEnd) => {
    console.log('accepting code')

    await app.commands.execute("notebook:preview-code")
    await app.commands.execute("notebook:accept-code")
    await app.commands.execute("notebook:run-cell");
}

export const retryIfExecutionError = async (notebookTracker: INotebookTracker, app: JupyterFrontEnd) => {
    const cell = notebookTracker.currentWidget?.content?.activeCell as CodeCell;

    if (didCellExecutionError(cell)) {

        sleep(5000)

        console.log('Error found')
        // If the code cell has an error, we need to send the error to the AI
        // and get it to fix the error.
        const errorTraceback = cell?.model.outputs?.toJSON()[0].traceback as string[]
        const errorMessage = getFullErrorMessageFromTraceback(errorTraceback)

        app.commands.execute(COMMAND_MITO_AI_SEND_DEBUG_ERROR_MESSAGE, { input: errorMessage });

        await acceptAndRunCode(app)
    }
}