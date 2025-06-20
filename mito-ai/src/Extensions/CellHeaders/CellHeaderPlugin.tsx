/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTracker, Notebook } from '@jupyterlab/notebook';
import React from 'react';
import ReactDOM from 'react-dom';
import CellHeader from './CellHeader';

const CellNumberingPlugin: JupyterFrontEndPlugin<void> = {
  id: 'mito-ai:cell-numbering',
  description: 'Adds cell numbers above each cell in Jupyter notebooks',
  autoStart: true,
  requires: [INotebookTracker],
  activate: (app: JupyterFrontEnd, notebookTracker: INotebookTracker) => {

    /* 
      This plugin adds cell numbers above each cell in Jupyter notebooks.

      It does this by:
      1. Adding a new div with the class "mito-cell-number" to the top of each cell.
      2. Observing the DOM for changes and updating the cell numbers when cells are added or removed.
    */
    
    const addCellNumbers = (notebook: Notebook): void => {
      const cells = notebook.node.querySelectorAll('.jp-Cell');
      
      cells.forEach((cell, index) => {
        const existingNumber = cell.querySelector('.mito-cell-number');
        if (existingNumber) {
          ReactDOM.render(React.createElement(CellHeader, { number: index + 1 }), existingNumber);
        } else {
          const numberDiv = document.createElement('div');
          numberDiv.className = 'mito-cell-number';
          
          ReactDOM.render(React.createElement(CellHeader, { number: index + 1 }), numberDiv);
          
          cell.insertBefore(numberDiv, cell.firstChild);
        }
      });
    };

    const setupNotebook = (notebook: Notebook): void => {
      let timeoutId: NodeJS.Timeout | null = null;
      
      const debouncedAddCellNumbers = (): void => {
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
          // Mutations are triggered whenever the DOM changes. That means every keystroke in a cell,
          // for example. So we need to be careful to not put expensive logic here! 
          if (mutation.type === 'childList') {

            // We only need to update the cell numbers if cells were added or removed.
            // This ends up supporting moving cells around as well.
            const addedAndRemovedNodes = [...mutation.addedNodes, ...mutation.removedNodes];
            for (const node of addedAndRemovedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE && 
                  ((node as Element).classList.contains('jp-Cell') || 
                   (node as Element).querySelector('.jp-Cell'))) {
                shouldUpdate = true;
                break;
              }
            }

            if (shouldUpdate) break;
          }
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