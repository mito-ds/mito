import { INotebookTracker } from "@jupyterlab/notebook";

/*
    Wait for the notebook to be ready and attached.
    This is used to wait for the notebook to be ready before sending the first message.
*/
export const waitForNotebookReady = async (notebookTracker: INotebookTracker): Promise<void> => {
    const notebook = notebookTracker.currentWidget;
    if (!notebook) {
        console.warn('No active notebook found');
        return;
    }

    // Wait for notebook to be ready and attached
    await notebook.context.ready;
    
    // Wait a bit more for cells to be fully initialized
    if (!notebook.content.isAttached) {
        await new Promise(resolve => {
            const checkAttached = () => {
                if (notebook.content.isAttached) {
                    resolve(true);
                } else {
                    setTimeout(checkAttached, 100);
                }
            };
            checkAttached();
        });
    }
};