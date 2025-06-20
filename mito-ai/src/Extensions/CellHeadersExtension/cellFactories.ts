/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { CodeCell, MarkdownCell, RawCell, Cell } from '@jupyterlab/cells';
import { NotebookPanel } from '@jupyterlab/notebook';
import { Message } from '@lumino/messaging';

/**
 * Enhances a cell instance with header functionality while preserving original type
 */
export function addHeaderFunctionality(cell: Cell): void {
  try {
    // Add header-related properties
    (cell as any)._mitoHeaderNode = null;
    (cell as any)._mitoCellNumber = 0;
    (cell as any)._mitoHeaderCreated = false;

    // Add setCellNumber method
    (cell as any).setCellNumber = function(cellNumber: number): void {
      try {
        this._mitoCellNumber = cellNumber;
        if (this._mitoHeaderNode) {
          this._mitoUpdateHeaderText();
        }
      } catch (error) {
        console.warn('Failed to set cell number:', error);
      }
    };

    // Add getCellNumber method
    (cell as any).getCellNumber = function(): number {
      return this._mitoCellNumber || 0;
    };

    // Add _mitoUpdateHeaderText method
    (cell as any)._mitoUpdateHeaderText = function(): void {
      if (this._mitoHeaderNode && this._mitoCellNumber > 0) {
        this._mitoHeaderNode.textContent = `Cell ${this._mitoCellNumber}`;
      }
    };

    // Add _mitoCreateHeaderIfNeeded method
    (cell as any)._mitoCreateHeaderIfNeeded = function(): void {
      try {
        console.log('this', this)
        // Only create header once and when DOM is ready
        if (this._mitoHeaderCreated || !this.node.isConnected) return;
        
        this._mitoHeaderNode = document.createElement('div');
        this._mitoHeaderNode.className = 'mito-jp-cell-header';
        this._mitoHeaderNode.style.cssText = `
          height: 32px;
          line-height: 32px;
          padding-left: 8px;
          font-size: 14px;
          color: var(--jp-ui-font-color2);
          border-bottom: 1px solid var(--jp-border-color2);
          margin-bottom: 4px;
        `;
        
        // Insert at the very top of the cell
        this.node.insertBefore(this._mitoHeaderNode, this.node.firstChild);
        this._mitoHeaderCreated = true;
        
        // Update header text if we already have a number
        if (this._mitoCellNumber > 0) {
          this._mitoUpdateHeaderText();
        }
      } catch (error) {
        console.warn('Failed to create cell header during DOM update:', error);
        this._mitoHeaderNode = null;
        this._mitoHeaderCreated = false;
      }
    };

    // Add _mitoCleanupHeader method (for safety, though header persists with cell)
    (cell as any)._mitoCleanupHeader = function(): void {
      if (this._mitoHeaderNode && this._mitoHeaderNode.parentNode) {
        this._mitoHeaderNode.parentNode.removeChild(this._mitoHeaderNode);
        this._mitoHeaderNode = null;
        this._mitoHeaderCreated = false;
      }
    };

    // Override onUpdateRequest to create header when DOM is ready but before attachment
    const originalOnUpdateRequest = (cell as any).onUpdateRequest;
    (cell as any).onUpdateRequest = function(msg: Message): void {
      try {
        // Call original method first
        if (originalOnUpdateRequest) {
          originalOnUpdateRequest.call(this, msg);
        }
        // Create header after DOM structure is ready
        this._mitoCreateHeaderIfNeeded();
      } catch (error) {
        console.warn('Failed to update cell with header:', error);
      }
    };

    // Override onBeforeDetach for cleanup (though header typically persists)
    const originalOnBeforeDetach = (cell as any).onBeforeDetach;
    (cell as any).onBeforeDetach = function(msg: Message): void {
      try {
        // Call original method first
        if (originalOnBeforeDetach) {
          originalOnBeforeDetach.call(this, msg);
        }
        // Note: We don't clean up the header here as it should persist with the cell
        // The header is part of the cell's structure and will be reattached with the cell
      } catch (error) {
        console.warn('Failed to detach cell with header:', error);
      }
    };

    // Trigger an update request to ensure header gets created for cells already in DOM
    setTimeout(() => {
      try {
        cell.update();
      } catch (error) {
        console.warn('Failed to trigger initial update for cell header:', error);
      }
    }, 0);

  } catch (error) {
    console.warn('Failed to add header functionality to cell:', error);
  }
}

/**
 * Enhance a NotebookPanel's content factory to add headers to all new cells
 */
export function enhanceNotebookPanelFactory(panel: NotebookPanel): void {
  try {
    const notebook = panel.content;
    const contentFactory = notebook.contentFactory;

    // Store original factory methods
    const originalCreateCodeCell = contentFactory.createCodeCell.bind(contentFactory);
    const originalCreateMarkdownCell = contentFactory.createMarkdownCell.bind(contentFactory);
    const originalCreateRawCell = contentFactory.createRawCell.bind(contentFactory);

    // Override factory methods to add header functionality
    contentFactory.createCodeCell = function(options: CodeCell.IOptions): CodeCell {
      try {
        const cell = originalCreateCodeCell(options);
        addHeaderFunctionality(cell);
        return cell;
      } catch (error) {
        console.warn('Failed to create enhanced code cell, falling back:', error);
        return originalCreateCodeCell(options);
      }
    };

    contentFactory.createMarkdownCell = function(options: MarkdownCell.IOptions): MarkdownCell {
      try {
        const cell = originalCreateMarkdownCell(options);
        addHeaderFunctionality(cell);
        return cell;
      } catch (error) {
        console.warn('Failed to create enhanced markdown cell, falling back:', error);
        return originalCreateMarkdownCell(options);
      }
    };

    contentFactory.createRawCell = function(options: RawCell.IOptions): RawCell {
      try {
        const cell = originalCreateRawCell(options);
        addHeaderFunctionality(cell);
        return cell;
      } catch (error) {
        console.warn('Failed to create enhanced raw cell, falling back:', error);
        return originalCreateRawCell(options);
      }
    };

    // Also enhance existing cells
    for (const cell of notebook.widgets) {
      if (!isEnhancedCell(cell)) {
        addHeaderFunctionality(cell);
      }
    }

  } catch (error) {
    console.warn('Failed to enhance notebook panel factory:', error);
  }
}

// Type guard function
export function isEnhancedCell(cell: any): boolean {
  return cell && typeof cell.setCellNumber === 'function';
}