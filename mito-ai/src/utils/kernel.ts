import { NotebookPanel } from "@jupyterlab/notebook";

export const getKernelID = (notebookPanel: NotebookPanel): string  => {
    return notebookPanel.context.sessionContext.session?.id || '';
}