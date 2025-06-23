import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';

/**
 * Plugin to track notebook changes including cell insertion/deletion,
 * cell reordering, notebook switching, and notebook loading.
 */
const notebookChangeTrackerPlugin: JupyterFrontEndPlugin<void> = {
  id: 'mito-ai:notebook-change-tracker',
  autoStart: true,
  requires: [INotebookTracker],
  activate: (app: JupyterFrontEnd, notebookTracker: INotebookTracker) => {
    console.log('NotebookChangeTracker: Plugin activated');

    // Track notebook switching and loading
    notebookTracker.currentChanged.connect((tracker, notebookPanel) => {
      if (notebookPanel) {
        console.log('NotebookChangeTracker: Notebook switched/loaded', {
          notebookPath: notebookPanel.context.path,
          notebookName: notebookPanel.title.label
        });
        notifyCellListChanged()
        
        // Set up cell-level event listeners for this notebook
        setupCellEventListeners(notebookPanel);
      } else {
        console.log('NotebookChangeTracker: No active notebook');
      }
    });

    // Track when new notebook widgets are added (notebook loading)
    notebookTracker.widgetAdded.connect((sender, notebookPanel) => {
      notifyCellListChanged()
      console.log('NotebookChangeTracker: New notebook widget added', {
        notebookPath: notebookPanel.context.path,
        notebookName: notebookPanel.title.label
      });
      
      // Set up cell-level event listeners for this new notebook
      setupCellEventListeners(notebookPanel);
    });

    // Set up listeners for any already-open notebooks
    notebookTracker.forEach(notebookPanel => {
      setupCellEventListeners(notebookPanel);
    });
  }
};

export const notifyCellListChanged = () => {
  console.log("Change detected")
}

/**
 * Set up event listeners for cell-level changes in a notebook
 */
function setupCellEventListeners(notebookPanel: NotebookPanel): void {
  const notebook = notebookPanel.content;
  const model = notebook.model;

  if (!model) {
    return;
  }

  model.cells.changed.connect(() => {
    notifyCellListChanged()
  });
}

export default notebookChangeTrackerPlugin;