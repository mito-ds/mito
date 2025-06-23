import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { notebookChangeEmitter } from './notebookChangeEmitter';

export const notifyCellListChanged = () => {
  console.log("Change detected");
  notebookChangeEmitter.emitCellListChanged();
}

const setupCellEventListeners = (notebookPanel: NotebookPanel): void => {
  const notebook = notebookPanel.content;
  const model = notebook.model;

  if (!model) {
    return;
  }

  model.cells.changed.connect(() => {
    notifyCellListChanged()
  });
}

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

    /************************************************
     * EVENT 1: Notebook switching and loading
    *************************************************/

    notebookTracker.currentChanged.connect((tracker, notebookPanel) => {
      if (notebookPanel) {

        notifyCellListChanged()
        
        // Set up cell-level event listeners for this notebook
        setupCellEventListeners(notebookPanel);
      } else {
        console.log('NotebookChangeTracker: No active notebook');
      }
    });

    /************************************************
     * EVENT 1: Notebook is added 
     * Todo: Do we need this one?
    *************************************************/
    notebookTracker.widgetAdded.connect((sender, notebookPanel) => {
      notifyCellListChanged()
      
      // Set up cell-level event listeners for this new notebook
      setupCellEventListeners(notebookPanel);
    });

    /************************************************
     * For any notebooks that are already open, we add 
     * the cell-level event listeners
    *************************************************/
    // Set up listeners for any already-open notebooks
    notebookTracker.forEach(notebookPanel => {
      setupCellEventListeners(notebookPanel);
    });
  }
};

export default notebookChangeTrackerPlugin;