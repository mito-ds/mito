/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import '../../../style/CellNumbering.css';

/**
 * Updates cell numbers for all cells in a notebook.
 * Uses notebook.widgets which is always in the correct order.
 */
function updateAllCellNumbers(notebookPanel: NotebookPanel): void {
  const notebook = notebookPanel.content;
  notebook.widgets.forEach((cell, index) => {
    const header = cell.node.querySelector('.jp-Cell-header');
    if (header) {
      // 1-indexed for display (Cell 1, Cell 2, etc.)
      header.setAttribute('data-cell-number', String(index + 1));
    }
  });
}

/**
 * Sets up cell numbering for a notebook panel.
 */
function setupCellNumbering(notebookPanel: NotebookPanel): void {
  const notebook = notebookPanel.content;

  // Store handler references so they can be disconnected on cleanup
  const handleCellsChanged = (): void => {
    updateAllCellNumbers(notebookPanel);
  };

  const handleActiveCellChanged = (): void => {
    updateAllCellNumbers(notebookPanel);
  };

  // Update when cells are added, removed, or moved
  notebook.model?.cells.changed.connect(handleCellsChanged);

  // Update when active cell changes (often happens when scrolling)
  notebook.activeCellChanged.connect(handleActiveCellChanged);

  // Use MutationObserver to handle virtualization (cells being attached/detached)
  const observer = new MutationObserver(() => {
    updateAllCellNumbers(notebookPanel);
  });
  observer.observe(notebook.node, { childList: true, subtree: true });

  // Cleanup all handlers when notebook is disposed
  notebookPanel.disposed.connect(() => {
    notebook.model?.cells.changed.disconnect(handleCellsChanged);
    notebook.activeCellChanged.disconnect(handleActiveCellChanged);
    observer.disconnect();
  });

  // Initial update
  updateAllCellNumbers(notebookPanel);
}

/**
 * Plugin to add cell numbering to notebook cells.
 */
const CellNumberingPlugin: JupyterFrontEndPlugin<void> = {
  id: 'mito-ai:cell-numbering',
  description: 'Add cell numbers to notebook cells',
  autoStart: true,
  requires: [INotebookTracker],
  activate: (app: JupyterFrontEnd, notebookTracker: INotebookTracker): void => {
    console.log('mito-ai: CellNumberingPlugin activated');

    // Setup for all existing notebooks
    notebookTracker.forEach((notebookPanel: NotebookPanel) => {
      setupCellNumbering(notebookPanel);
    });

    // Setup for newly opened notebooks
    notebookTracker.widgetAdded.connect((sender, notebookPanel: NotebookPanel) => {
      setupCellNumbering(notebookPanel);
    });
  }
};

export default CellNumberingPlugin;
