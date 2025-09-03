import { NotebookPanel } from "@jupyterlab/notebook";

export const getKernelID = (notebookPanel: NotebookPanel): string  => {
    console.log('Kernel ID: ', notebookPanel.context.sessionContext.session?.id)
    return notebookPanel.context.sessionContext.session?.id || '';
}