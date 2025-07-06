/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

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
    
    // Wait for attachment
    if (!notebook.content.isAttached) {
         await new Promise<void>(resolve => {
            const checkAttached = (): void => {
                if (notebook.content.isAttached) {
                    resolve();
                } else {
                    setTimeout(checkAttached, 100);
                }
            };
            checkAttached();
        });
    }

    // Wait for all cells to be created and ready
    await new Promise<void>(resolve => {
        const checkCellsReady = (): void => {
            const cells = notebook.content.widgets;

            // In large notebooks, not all of the cells are attatched I think. 
            // So instead we just wait for any cell to be ready and then give it 
            // another 500ms to be ready.
            const anyCellReady = cells.some(cell => cell.isAttached && cell.model);
            
            if (anyCellReady && cells.length > 0) {
                resolve();
            } else {
                setTimeout(checkCellsReady, 100);
            }
        };
        checkCellsReady();
    });

    // Small buffer for final initialization
    await new Promise(resolve => setTimeout(resolve, 500));
};