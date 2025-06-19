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
    const addCellNumbers = (notebook: Notebook): void => {
      const cells = notebook.node.querySelectorAll('.jp-Cell');
      
      cells.forEach((cell, index) => {
        const existingNumber = cell.querySelector('.cell-number');
        if (existingNumber) {
          ReactDOM.render(React.createElement(CellHeader, { number: index + 1 }), existingNumber);
        } else {
          const numberDiv = document.createElement('div');
          numberDiv.className = 'cell-number';
          
          ReactDOM.render(React.createElement(CellHeader, { number: index + 1 }), numberDiv);
          
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