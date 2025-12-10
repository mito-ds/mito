/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { NotebookPanel } from '@jupyterlab/notebook';
import { getCellIDByIndexInNotebookPanel } from './notebook';

/**
 * Represents a cell reference in a chat message.
 * Cell numbers are 1-indexed (Cell 1, Cell 2, etc.) for user display.
 */
export interface CellReference {
  cellNumber: number; // 1-indexed cell number
  cellId: string; // The actual cell ID used by JupyterLab
  startIndex: number; // Start position in the message text
  endIndex: number; // End position in the message text
}

/**
 * Parses cell references from a message text.
 * Matches patterns like "@Cell 1", "@Cell 2", "@cell 5", etc.
 * 
 * @param messageText - The message text to parse
 * @param notebookPanel - The notebook panel to resolve cell IDs
 * @returns Array of cell references found in the message
 */
export function parseCellReferences(
  messageText: string,
  notebookPanel: NotebookPanel | null
): CellReference[] {
  const references: CellReference[] = [];
  
  if (!notebookPanel) {
    return references;
  }

  // Match @CellN or @cellN (case insensitive, no space)
  const cellReferenceRegex = /@[Cc]ell(\d+)/g;
  let match;

  while ((match = cellReferenceRegex.exec(messageText)) !== null) {
    if (!match[1]) {
      continue;
    }
    const cellNumber = parseInt(match[1], 10);
    const startIndex = match.index;
    const endIndex = startIndex + match[0].length;

    // Convert 1-indexed cell number to 0-indexed for lookup
    const cellIndex = cellNumber - 1;
    const cellId = getCellIDByIndexInNotebookPanel(notebookPanel, cellIndex);

    if (cellId) {
      references.push({
        cellNumber,
        cellId,
        startIndex,
        endIndex
      });
    }
  }

  return references;
}

/**
 * Converts @Cell N references in a message to [MITO_CELL_REF:cell_id] format.
 * This ensures cell references are stable even if cells are reordered.
 * 
 * @param messageText - The original message text containing @Cell N references
 * @param notebookPanel - The notebook panel to resolve cell IDs
 * @returns The message with @Cell N replaced by [MITO_CELL_REF:cell_id]
 */
export function convertCellReferencesToStableFormat(
  messageText: string,
  notebookPanel: NotebookPanel | null
): string {
  if (!notebookPanel) {
    return messageText;
  }

  // Find all @Cell N references
  const references = parseCellReferences(messageText, notebookPanel);
  
  if (references.length === 0) {
    return messageText;
  }

  // Replace from end to start to preserve indices
  let processedMessage = messageText;
  for (let i = references.length - 1; i >= 0; i--) {
    const ref = references[i];
    if (!ref) continue;
    const before = processedMessage.substring(0, ref.startIndex);
    const after = processedMessage.substring(ref.endIndex);
    processedMessage = before + `[MITO_CELL_REF:${ref.cellId}]` + after;
  }

  return processedMessage;
}

/**
 * Gets the current cell number for a given cell ID.
 * 
 * @param cellId - The cell ID to look up
 * @param notebookPanel - The notebook panel
 * @returns The 1-indexed cell number, or undefined if not found
 */
export function getCellNumberById(
  cellId: string,
  notebookPanel: NotebookPanel | null
): number | undefined {
  if (!notebookPanel) {
    return undefined;
  }

  const notebook = notebookPanel.content;
  const cellIndex = notebook.widgets.findIndex(cell => cell.model.id === cellId);
  
  if (cellIndex === -1) {
    return undefined;
  }

  // Return 1-indexed cell number
  return cellIndex + 1;
}

/**
 * Gets all available cells with their numbers and IDs.
 * Useful for populating dropdowns or autocomplete.
 * 
 * @param notebookPanel - The notebook panel
 * @returns Array of { cellNumber, cellId, cellType } objects
 */
export function getAllCellReferences(
  notebookPanel: NotebookPanel | null
): Array<{ cellNumber: number; cellId: string; cellType: string }> {
  if (!notebookPanel) {
    return [];
  }

  const notebook = notebookPanel.content;
  const cells: Array<{ cellNumber: number; cellId: string; cellType: string }> = [];

  notebook.widgets.forEach((cell, index) => {
    cells.push({
      cellNumber: index + 1, // 1-indexed
      cellId: cell.model.id,
      cellType: cell.model.type
    });
  });

  return cells;
}

