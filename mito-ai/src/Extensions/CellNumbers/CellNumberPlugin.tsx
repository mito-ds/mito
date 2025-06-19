/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTracker, Notebook } from '@jupyterlab/notebook';

const CellNumberingPlugin: JupyterFrontEndPlugin<void> = {
  id: 'mito-ai:cell-numbering',
  description: 'Adds cell numbers above each cell in Jupyter notebooks',
  autoStart: true,
  requires: [INotebookTracker],
  activate: (app: JupyterFrontEnd, notebookTracker: INotebookTracker) => {
    const addCellNumbers = (notebook: Notebook): void => {
      const cells = notebook.node.querySelectorAll('.jp-Cell');
      
      cells.forEach((cell, index) => {
        const existingNumber = cell.querySelector('.cell-number');
        if (existingNumber) {
          existingNumber.textContent = `Cell ${index + 1}`;
        } else {
          const numberDiv = document.createElement('div');
          numberDiv.className = 'cell-number';
          numberDiv.textContent = `Cell ${index + 1}`;
          numberDiv.style.cssText = `
            font-size: 12px;
            color: #666;
            background: #f5f5f5;
            padding: 2px 8px;
            border-radius: 3px;
            margin-bottom: 4px;
            font-family: monospace;
            border: 1px solid #ddd;
          `;
          
          cell.insertBefore(numberDiv, cell.firstChild);
        }
      });
    };

    const setupNotebook = (notebook: Notebook): void => {
      let timeoutId: NodeJS.Timeout | null = null;
      
      const debouncedAddCellNumbers = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
          addCellNumbers(notebook);
        }, 100);
      };

      const observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            for (const node of Array.from(mutation.addedNodes)) {
              if (node.nodeType === Node.ELEMENT_NODE && 
                  ((node as Element).classList.contains('jp-Cell') || 
                   (node as Element).querySelector('.jp-Cell'))) {
                shouldUpdate = true;
                break;
              }
            }
            for (const node of Array.from(mutation.removedNodes)) {
              if (node.nodeType === Node.ELEMENT_NODE && 
                  ((node as Element).classList.contains('jp-Cell') || 
                   (node as Element).querySelector('.jp-Cell'))) {
                shouldUpdate = true;
                break;
              }
            }
          }
          if (shouldUpdate) break;
        }
        
        if (shouldUpdate) {
          debouncedAddCellNumbers();
        }
      });

      observer.observe(notebook.node, {
        childList: true,
        subtree: true
      });
      
      addCellNumbers(notebook);
      
      notebook.disposed.connect(() => {
        observer.disconnect();
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      });
    };

    notebookTracker.forEach(widget => {
      setupNotebook(widget.content);
    });

    notebookTracker.widgetAdded.connect((sender, widget) => {
      setTimeout(() => {
        setupNotebook(widget.content);
      }, 100);
    });

    console.log("mito-ai: CellNumberingPlugin activated");
  }
};

export default CellNumberingPlugin;