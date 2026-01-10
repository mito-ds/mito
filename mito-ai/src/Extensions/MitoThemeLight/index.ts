/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/**
 * @packageDocumentation
 * @module mito-theme-extension
 */

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IThemeManager } from '@jupyterlab/apputils';
import { ITranslator } from '@jupyterlab/translation';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { ReactWidget } from '@jupyterlab/ui-components';
import React from 'react';
import RunCellButton from '../../components/RunCellButton';
import { enableLineNumbersIfNeeded } from '../../utils/lineNumbers';
import '../../../style/RunCellButton.css';

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
 * Returns cleanup function to disconnect handlers.
 */
function setupCellNumbering(notebookPanel: NotebookPanel): (() => void) | null {
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

  // Return cleanup function
  return () => {
    notebook.model?.cells.changed.disconnect(handleCellsChanged);
    notebook.activeCellChanged.disconnect(handleActiveCellChanged);
    observer.disconnect();
    // Remove cell numbers from all cells
    notebook.widgets.forEach((cell) => {
      const header = cell.node.querySelector('.jp-Cell-header');
      if (header) {
        header.removeAttribute('data-cell-number');
      }
    });
  };
}

/**
 * A plugin for the Mito Light Theme.
 * 
 * The Run Cell Button, cell numbering, and hidden default toolbar buttons only apply
 * when the Mito Light theme is active.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'mito_ai:theme',
  description: 'Adds the Mito Light theme.',
  requires: [IThemeManager, ITranslator, INotebookTracker],
  activate: (
    app: JupyterFrontEnd,
    manager: IThemeManager,
    translator: ITranslator,
    notebookTracker: INotebookTracker
  ) => {
    const trans = translator.load('jupyterlab');
    const style = 'mito_ai/index.css';
    
    // Store connection for cleanup
    let widgetAddedConnection: ((sender: INotebookTracker, widget: NotebookPanel) => void) | null = null;
    
    // Store cell numbering cleanup functions for each notebook
    const cellNumberingCleanups = new Map<NotebookPanel, () => void>();

    // Add Run Cell button to notebook toolbar
    const addRunCellButton = (notebookPanel: NotebookPanel): void => {
      const toolbar = notebookPanel.toolbar;
      if (!toolbar) {
        return;
      }

      // Check if button already exists
      if (toolbar.node.querySelector('.mito-run-cell-button-widget')) {
        return;
      }

      // Create React widget with the specific notebook panel
      class RunCellButtonWidget extends ReactWidget {
        constructor(private panel: NotebookPanel) {
          super();
          this.addClass('mito-run-cell-button-widget');
        }

        render(): JSX.Element {
          return React.createElement(RunCellButton, { notebookPanel: this.panel });
        }
      }

      const runCellWidget = new RunCellButtonWidget(notebookPanel);
      
      // Add to the right side of the toolbar by inserting after spacer or at the end
      try {
        toolbar.insertAfter('spacer', 'mito-run-cell-button', runCellWidget);
      } catch {
        // If spacer doesn't exist, add at the end
        toolbar.addItem('mito-run-cell-button', runCellWidget);
      }
    };

    // Remove Run Cell button from notebook toolbar
    const removeRunCellButton = (notebookPanel: NotebookPanel): void => {
      const toolbar = notebookPanel.toolbar;
      if (!toolbar) {
        return;
      }

      // Find and remove the button widget by iterating toolbar items
      for (const name of toolbar.names()) {
        if (name === 'mito-run-cell-button') {
          // Hide the widget (disposal happens automatically when panel is disposed)
          const widget = Array.from(toolbar.children()).find(
            w => w.hasClass('mito-run-cell-button-widget')
          );
          if (widget) {
            widget.dispose();
          }
          break;
        }
      }
    };

    // Remove cell numbering from a notebook panel
    const removeCellNumbering = (notebookPanel: NotebookPanel): void => {
      const cleanup = cellNumberingCleanups.get(notebookPanel);
      if (cleanup) {
        cleanup();
        cellNumberingCleanups.delete(notebookPanel);
      }
    };

    // Add buttons and cell numbering to all notebooks
    const addButtonsToAllNotebooks = (): void => {
      notebookTracker.forEach(widget => {
        addRunCellButton(widget);
        // Enable line numbers if needed
        void enableLineNumbersIfNeeded(app, widget);
        // Setup cell numbering
        const cleanup = setupCellNumbering(widget);
        if (cleanup) {
          cellNumberingCleanups.set(widget, cleanup);
          // Also cleanup when notebook is disposed
          widget.disposed.connect(() => {
            cellNumberingCleanups.delete(widget);
          });
        }
      });

      // Connect to new notebooks
      widgetAddedConnection = (sender: INotebookTracker, widget: NotebookPanel): void => {
        setTimeout(() => {
          // Check if widget is still valid before proceeding
          if (widget.isDisposed) {
            return;
          }
          // Only add if Mito Light theme is still active
          if (manager.theme === 'Mito Light') {
            addRunCellButton(widget);
            // Enable line numbers if needed
            void enableLineNumbersIfNeeded(app, widget);
            // Setup cell numbering
            const cleanup = setupCellNumbering(widget);
            if (cleanup) {
              cellNumberingCleanups.set(widget, cleanup);
              // Also cleanup when notebook is disposed
              widget.disposed.connect(() => {
                cellNumberingCleanups.delete(widget);
              });
            }
          }
        }, 100);
      };
      notebookTracker.widgetAdded.connect(widgetAddedConnection);
    };

    // Remove buttons and cell numbering from all notebooks
    const removeButtonsFromAllNotebooks = (): void => {
      // Disconnect from new notebooks
      if (widgetAddedConnection) {
        notebookTracker.widgetAdded.disconnect(widgetAddedConnection);
        widgetAddedConnection = null;
      }

      // Remove from all existing notebooks
      notebookTracker.forEach(widget => {
        removeRunCellButton(widget);
        removeCellNumbering(widget);
      });
      
      // Clear all cleanup functions
      cellNumberingCleanups.clear();
    };

    manager.register({
      name: 'Mito Light',
      displayName: trans.__('Mito Light'),
      isLight: true,
      themeScrollbars: false,
      load: async () => {
        // Load theme CSS (hides default buttons)
        await manager.loadCSS(style);
        // Add Run Cell buttons to all notebooks and enable line numbers
        addButtonsToAllNotebooks();
      },
      unload: async () => {
        // Remove Run Cell buttons from all notebooks
        removeButtonsFromAllNotebooks();
      }
    });

    // Set Mito Light as default theme if user hasn't explicitly chosen a different theme
    // This runs after registration so the theme is available
    if (manager.theme === 'JupyterLab Light' || !manager.theme) {
      void manager.setTheme('Mito Light');
    }
  },
  autoStart: true
};

export default plugin;
