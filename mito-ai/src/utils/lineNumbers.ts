/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { JupyterFrontEnd } from '@jupyterlab/application';
import { NotebookPanel } from '@jupyterlab/notebook';

/**
 * Check if line numbers are currently enabled in a notebook panel.
 * Returns true if at least one code cell has line numbers visible.
 */
export const areLineNumbersEnabled = (notebookPanel: NotebookPanel): boolean => {
  const notebook = notebookPanel.content;
  
  // Check if any code cell has line numbers visible
  for (const cell of notebook.widgets) {
    if (cell.model.type === 'code' && cell.editor) {
      // Check if line numbers gutter exists in the DOM
      const editorNode = cell.node.querySelector('.jp-Editor');
      if (editorNode) {
        // In CodeMirror 6, line numbers are in a gutter with class 'cm-lineNumbers'
        const lineNumbersGutter = editorNode.querySelector('.cm-lineNumbers');
        if (lineNumbersGutter) {
          return true;
        }
      }
    }
  }
  
  return false;
};

/**
 * Enable line numbers for a notebook panel if they're not already enabled.
 */
export const enableLineNumbersIfNeeded = async (
  app: JupyterFrontEnd,
  notebookPanel: NotebookPanel
): Promise<void> => {
  // Check if line numbers are already enabled
  if (areLineNumbersEnabled(notebookPanel)) {
    return;
  }

  // If not enabled, toggle them on
  try {
    await app.commands.execute('notebook:toggle-all-cell-line-numbers');
  } catch (error) {
    console.warn('Failed to enable line numbers:', error);
  }
};

