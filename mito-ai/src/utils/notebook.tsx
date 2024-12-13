import { INotebookTracker, NotebookPanel, Notebook, NotebookActions } from '@jupyterlab/notebook';
import { Cell, ICellModel } from '@jupyterlab/cells';
import { removeMarkdownCodeFormatting } from './strings';
import { requestAPI } from './handler';
import { ServerError, TimeoutError, ConnectionError, UnknownError, OpenAIError } from './errors';

const LOADING_MARKDOWN = '> *`⏳ Generating documentation... please wait`*';

export const getActiveCell = (notebookTracker: INotebookTracker): Cell | undefined => {
    const notebook = notebookTracker.currentWidget?.content;
    const activeCell = notebook?.activeCell;
    return activeCell || undefined
}

export const getActiveCellID = (notebookTracker: INotebookTracker): string | undefined => {
    return getActiveCell(notebookTracker)?.model.id
}

export const getActiveCellCode = (notebookTracker: INotebookTracker): string | undefined => {
    const activeCell = getActiveCell(notebookTracker)
    return activeCell?.model.sharedModel.source
}

export const getCellCodeByID = (notebookTracker: INotebookTracker, codeCellID: string | undefined): string | undefined => {
    if (codeCellID === undefined) {
        return undefined
    }

    const notebook = notebookTracker.currentWidget?.content;
    const cell = notebook?.widgets.find(cell => cell.model.id === codeCellID);
    return cell?.model.sharedModel.source
}

export const writeCodeToCellByID = (
    notebookTracker: INotebookTracker, 
    code: string | undefined, 
    codeCellID: string,
): void => {
    if (code === undefined) {
        return;
    }

    const codeMirrorValidCode = removeMarkdownCodeFormatting(code);
    const notebook = notebookTracker.currentWidget?.content;
    const cell = notebook?.widgets.find(cell => cell.model.id === codeCellID);
    
    if (cell) {
        cell.model.sharedModel.source = codeMirrorValidCode;
    }
}

export const getNotebookName = (notebookTracker: INotebookTracker): string => {
    const notebook = notebookTracker.currentWidget?.content;
    return notebook?.title.label || 'Untitled'
}

export const highlightCodeCell = (notebookTracker: INotebookTracker, codeCellID: string) => {
    /*
        Briefly highlights a code cell, to draw the user's attention to it.
    */
    const notebook = notebookTracker.currentWidget?.content;
    const cell = notebook?.widgets.find(cell => cell.model.id === codeCellID);
    if (cell) {
        const cellElement = cell.node;
        const originalBackground = cellElement.style.background;
        
        // Add a yellow highlight
        cellElement.style.background = 'var(--purple-400)';
        
        // Remove highlight after 500ms
        cellElement.style.transition = 'background 0.5s ease';
        setTimeout(() => {
            cellElement.style.background = originalBackground;
        }, 500);
    }
}

/**
 * Get indices of all selected code cells in a Jupyter Notebook.
 * @param notebookModel - The notebook model containing the cells.
 * @returns An array of indices of selected code cells.
 */
/**
 * Get indices of all selected code cells in a Jupyter Notebook.
 * @param notebookTracker - The notebook tracker to find the current notebook.
 * @returns An array of indices of selected code cells.
 */
export const getSelectedCodeCellIds = (notebookTracker: INotebookTracker): string[] => {
    const selectedCodeCellIds: string[] = [];
    const notebook = notebookTracker.currentWidget?.content; // Get the current notebook widget's content

    if (notebook) {
        // Iterate over all cells in the notebook
        notebook.widgets.forEach((cell, index) => {
            // Check if the cell is selected and is a code cell
            if (notebook.isSelectedOrActive(cell) && cell.model.type === 'code') {
                selectedCodeCellIds.push(cell.model.id);
            }
        });
    }
    return selectedCodeCellIds;
};

/**
 * Find the index of a cell with a specific metadata ID.
 * @param {NotebookPanel} notebook - The active notebook panel.
 * @param {string} targetCellId - The target cell ID to search for.
 * @returns {number} The index of the target cell, or -1 if not found.
 */
function findCellIndexById(notebook: Notebook, targetCellId: string): number {
    if (!notebook || !notebook.widgets || !targetCellId) {
      return -1;
    }
  
    for (let index = 0; index < notebook.widgets.length; index++) {
      const cell = notebook.widgets[index];
      if (cell && cell.model && cell.model.id === targetCellId) {
        return index;
      }
    }
  
    return -1;
}

export function writeToCell(cell: ICellModel | undefined, code: string): void {
    if (cell == undefined) {
        return;
    }
    cell.sharedModel.source = code
}

/**
 * Insert a Markdown cell before a specific cell by ID.
 * @param {NotebookPanel} notebook - The active notebook panel.
 * @param {string} targetCellId - The ID of the target cell.
 */
function insertMarkdownBeforeCell(notebook: NotebookPanel, targetCellId: string, aiMessage: string) {
  const targetIndex = findCellIndexById(notebook.content, targetCellId);
  if (targetIndex === -1) return;

  // Set the active cell index to the target index
  notebook.content.activeCellIndex = targetIndex;

  // Insert a new cell above the target index
  NotebookActions.insertAbove(notebook.content);
  NotebookActions.changeCellType(notebook.content, 'markdown');

  // Get the newly inserted cell
  const newCell = notebook.content.widgets[targetIndex];

  // Change the cell type to Markdown and write content
  if (newCell) {
    console.log("New cell ID >> ", newCell.model.id);
    writeToCell(newCell.model, aiMessage);
    NotebookActions.renderAllMarkdown(notebook.content);
  } else {
    console.error("New cell not found");
  }
}


// Function to get combined code from selected cells
export const getMarkdownDocumentation = async (notebookTracker: INotebookTracker): Promise<void> => {
    const selectedCellIndices = getSelectedCodeCellIds(notebookTracker);
    
    if (selectedCellIndices.length === 0) {
        return;
    }

    // Get the current notebook early
    const currentNotebook: NotebookPanel | null = notebookTracker.currentWidget;
    if (!currentNotebook) {
        console.error('No active notebook found.');
        return;
    }

    // Create loading cell first
    insertMarkdownBeforeCell(currentNotebook, selectedCellIndices[0], LOADING_MARKDOWN);
    // Store the ID of the newly created cell (it will be at targetIndex)
    const loadingCellIndex = findCellIndexById(currentNotebook.content, selectedCellIndices[0]) - 1;
    const loadingCell = currentNotebook.content.widgets[loadingCellIndex];
    
    let combinedCode = '';
    selectedCellIndices.forEach(cellIndex => {
        const cellCode = getCellCodeByID(notebookTracker, cellIndex);
        if (cellCode) {
            combinedCode += cellCode + '\n';
        }
    });
    
    try {
        // Add timeout to the request
        const timeoutDuration = 30000; // 30 seconds
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timed out')), timeoutDuration);
        });

        const fetchPromise = requestAPI('mito_ai/completion', {
            method: 'POST',
            body: JSON.stringify({
                messages: [{role: 'user', content: "Write markdown documentation for the following code:\n" + combinedCode}]
            })
        });

        const apiResponse: any = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (apiResponse.type === 'success') {
            const aiMessage = apiResponse.response.content || '';
            if (loadingCell) {
                writeToCell(loadingCell.model, aiMessage);
                NotebookActions.renderAllMarkdown(currentNotebook.content);
            }
        } else {
            throw new OpenAIError();
        }
    } catch (error: any) {
        console.error('Error calling API:', error);
        
        let errorMessage = new UnknownError().message;
        
        if (error instanceof TimeoutError) {
            errorMessage = new TimeoutError().message;
        } else if (error.response?.status === 500) {
            errorMessage = new ServerError().message;
        } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
            errorMessage = new ConnectionError().message;
        } else if (error instanceof OpenAIError) {
            errorMessage = new OpenAIError().message;
        }

        // Add error details for debugging (only in development)
        const errorDetails = process.env.NODE_ENV === 'development' 
            ? `\n\n<details><summary>Error Details</summary>\n\n\`\`\`\n${error.toString()}\n\`\`\`\n</details>`
            : '';

        if (loadingCell) {
            writeToCell(
                loadingCell.model, 
                errorMessage + errorDetails
            );
            NotebookActions.renderAllMarkdown(currentNotebook.content);
        }
    }
}



