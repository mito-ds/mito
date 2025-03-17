import { INotebookTracker, NotebookActions } from '@jupyterlab/notebook';
import { Cell, CodeCell } from '@jupyterlab/cells';
import { removeMarkdownCodeFormatting } from './strings';
import { AIOptimizedCell } from './websocket/models';

export const getActiveCell = (notebookTracker: INotebookTracker): Cell | undefined => {
    const notebook = notebookTracker.currentWidget?.content;
    const activeCell = notebook?.activeCell;
    return activeCell || undefined
}

export const getCellByID = (notebookTracker: INotebookTracker, cellID: string | undefined): Cell | undefined => {
    if (cellID === undefined) {
        return undefined
    }

    const notebook = notebookTracker.currentWidget?.content;
    return notebook?.widgets.find(cell => cell.model.id === cellID);
}

export const getActiveCellID = (notebookTracker: INotebookTracker): string | undefined => {
    return getActiveCell(notebookTracker)?.model.id
}

export const getActiveCellCode = (notebookTracker: INotebookTracker): string | undefined => {
    const activeCell = getActiveCell(notebookTracker)
    return activeCell?.model.sharedModel.source
}

export const getCellCodeByID = (notebookTracker: INotebookTracker, codeCellID: string | undefined): string | undefined => {
    const cell = getCellByID(notebookTracker, codeCellID)
    return cell?.model.sharedModel.source
}

export const getCellIndexByID = (notebookTracker: INotebookTracker, cellID: string | undefined): number | undefined => {
    const cellList = notebookTracker.currentWidget?.model?.cells

    if (cellList === undefined) {
        return undefined 
    }

    // In order to get the cell index, we need to iterate over the cells and call the `get` method
    // to see the cells in order. Otherwise, the cells are returned in a random order.
    for (let i = 0; i < cellList.length; i++) {
        const cellModel = cellList.get(i)

        if (cellModel.id == cellID) {
            return i
        }
    }

    return undefined 
}

export const setActiveCellByID = (notebookTracker: INotebookTracker, cellID: string | undefined): void => {
    const cellIndex = getCellIndexByID(notebookTracker, cellID)
    const notebookPanel = notebookTracker.currentWidget
    if (notebookPanel !== undefined && notebookPanel !== null && cellIndex !== undefined) {
        notebookPanel.content.activeCellIndex = cellIndex
    }
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

    console.log("codeMirrorValidCode", codeMirrorValidCode)
    console.log("cell", cell)
    
    if (cell) {
        cell.model.sharedModel.source = codeMirrorValidCode;
    }
}

export const getAIOptimizedCells = (
    notebookTracker: INotebookTracker
): AIOptimizedCell[] => {

    const cellList = notebookTracker.currentWidget?.model?.cells

    if (cellList == undefined) {
        return []
    }

    // In order to get the cell index, we need to iterate over the cells and call the `get` method
    // to see the cells in order. Otherwise, the cells are returned in a random order.
    const cells: AIOptimizedCell[] = []
    for (let i = 0; i < cellList.length; i++) {
        const cellModel = cellList.get(i)
        
        const cell: AIOptimizedCell = {
            id: cellModel.id,
            cell_type: cellModel.type,
            code: cellModel.sharedModel.source
        }

        cells.push(cell)
    }

    return cells
}

export function createCodeCellAtIndexAndActivate(notebookTracker: INotebookTracker, index: number): void {
    /* 
        Create a new code cell at index and make it the active cell.
    */

    const notebook = notebookTracker.currentWidget?.content
    if (notebook === undefined) {
        return;
    }

    if (index > 0) {
        notebook.activeCellIndex = index - 1;

        // insertBelow makes the new cell the active cell
        NotebookActions.insertBelow(notebook);
    } else {
        notebook.activeCellIndex = 0

        // insertAbove makes the new cell the active cell
        NotebookActions.insertAbove(notebook)
    }
}

export const didCellExecutionError = (cell: CodeCell): boolean => {
    /* 
        Check the cell's output for an error.
    */
    const outputs = cell?.model.outputs?.toJSON() || [];
    return outputs.some(output => output.output_type === "error");
}

export const getNotebookName = (notebookTracker: INotebookTracker): string => {
    const notebook = notebookTracker.currentWidget?.content;
    return notebook?.title.label || 'Untitled'
}

export const highlightCodeCell = (notebookTracker: INotebookTracker, codeCellID: string): void => {
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

export const highlightLineOfCodeInCodeCell = (notebookTracker: INotebookTracker, codeCellID: string, lineNumber: number): void => {
    /*
        Briefly highlights a specific line in a code cell, to draw the user's attention to it.
        
        Args:
            notebookTracker: The notebook tracker.
            codeCellID: The ID of the code cell.
            lineNumber: The 1-indexed line number to highlight.
    */
    // Get the cell with the given ID
    const cell = getCellByID(notebookTracker, codeCellID);
    if (!cell) {
        return;
    }
    
    // Get the cell's editor
    const editor = cell.editor;
    if (!editor) {
        return;
    }
    
    // Adjust line number to be within bounds (0-indexed for internal use)
    const lines = editor.model.sharedModel.source.split('\n');
    const targetLine = Math.min(Math.max(0, lineNumber - 1), lines.length - 1);
    
    // Find the line element in the DOM
    // The CodeMirror editor uses CSS classes like .cm-line for line elements
    const cmEditor = cell.node.querySelector('.jp-Editor');
    if (!cmEditor) {
        return;
    }
    
    // Find all line elements and get the one at the target index
    const lineElements = cmEditor.querySelectorAll('.cm-line');
    if (targetLine >= lineElements.length) {
        return;
    }
    
    const lineElement = lineElements[targetLine] as HTMLElement;
    if (!lineElement) {
        return;
    }
    
    // Store the original background color
    const originalBackground = lineElement.style.background;
    
    // Change the background color to highlight the line
    lineElement.style.background = 'var(--purple-400)';
    lineElement.style.transition = 'background 0.5s ease';
    
    // Reset the background color after a delay
    setTimeout(() => {
        lineElement.style.background = originalBackground;
    }, 500);
}

export const scrollToCellLine = (notebookTracker: INotebookTracker, cellID: string, lineNumber: number): void => {
    /*
        Scrolls to a specific line in a specific cell. 
        Steps:
        1. Set the active cell to the target cell
        2. Get the cell's editor
        3. Set the cursor position to the target line
        4. Make sure the cell is visible
    */
    // First activate the cell
    setActiveCellByID(notebookTracker, cellID);
    
    // Get the cell
    const cell = getCellByID(notebookTracker, cellID);
    if (!cell) {
        return;
    }
    
    // Get the cell's editor
    const editor = cell.editor;
    if (!editor) {
        return;
    }
    
    // Adjust line number to be within bounds (0-indexed)
    const lines = editor.model.sharedModel.source.split('\n');
    const targetLine = Math.min(Math.max(0, lineNumber - 1), lines.length - 1);
    
    // Set cursor to the target line
    const position = { line: targetLine, column: 0 };
    editor.setCursorPosition(position);
    
    // Make the cell node visible by scrolling to it
    const cellNode = cell.node;
    if (cellNode) {
        // First, make sure the notebook panel is activated to ensure DOM is fully initialized
        const notebookPanel = notebookTracker.currentWidget;
        if (notebookPanel) {
            // Activate the notebook panel to ensure it's in the foreground
            notebookPanel.activate();
            
            // Use a small delay to ensure the activation has completed before scrolling
            setTimeout(() => {
                // Try scrolling after a short delay
                cellNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Highlight the specific line of code
                highlightLineOfCodeInCodeCell(notebookTracker, cellID, lineNumber);
            }, 100);
        } else {
            // Fallback if no panel is available
            cellNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
            highlightLineOfCodeInCodeCell(notebookTracker, cellID, lineNumber);
        }
    } else {
        // Even if we can't scroll, still try to highlight the line
        highlightLineOfCodeInCodeCell(notebookTracker, cellID, lineNumber);
    }
    
}

