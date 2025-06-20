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
    (cell as any)._headerNode = null;
    (cell as any)._cellNumber = 0;

    // Add setCellNumber method
    (cell as any).setCellNumber = function(cellNumber: number): void {
      try {
        this._cellNumber = cellNumber;
        if (this._headerNode) {
          this._updateHeaderText();
        }
      } catch (error) {
        console.warn('Failed to set cell number:', error);
      }
    };

    // Add getCellNumber method
    (cell as any).getCellNumber = function(): number {
      return this._cellNumber || 0;
    };

    // Add _createHeader method
    (cell as any)._createHeader = function(): void {
      try {
        if (this._headerNode) return; // Already created

        this._headerNode = document.createElement('div');
        this._headerNode.className = 'jp-cell-header';
        this._headerNode.style.cssText = `
          height: 32px;
          line-height: 32px;
          padding-left: 8px;
          font-size: 14px;
          color: var(--jp-ui-font-color2);
          border-bottom: 1px solid var(--jp-border-color2);
          margin-bottom: 4px;
        `;
        
        // Insert at the very top of the cell
        this.node.insertBefore(this._headerNode, this.node.firstChild);
        
        // Update header text if we already have a number
        if (this._cellNumber > 0) {
          this._updateHeaderText();
        }
      } catch (error) {
        console.warn('Failed to create cell header:', error);
        this._headerNode = null;
      }
    };

    // Add _cleanupHeader method
    (cell as any)._cleanupHeader = function(): void {
      if (this._headerNode && this._headerNode.parentNode) {
        this._headerNode.parentNode.removeChild(this._headerNode);
        this._headerNode = null;
      }
    };

    // Add _updateHeaderText method
    (cell as any)._updateHeaderText = function(): void {
      if (this._headerNode && this._cellNumber > 0) {
        this._headerNode.textContent = `Cell ${this._cellNumber}`;
      }
    };

    // Override lifecycle methods by storing original and replacing with enhanced versions
    const originalOnAfterAttach = (cell as any).onAfterAttach;
    (cell as any).onAfterAttach = function(msg: Message): void {
      try {
        // Call original method first
        if (originalOnAfterAttach) {
          originalOnAfterAttach.call(this, msg);
        }
        this._createHeader();
      } catch (error) {
        console.warn('Failed to attach cell with header:', error);
        // Continue without header
      }
    };

    const originalOnBeforeDetach = (cell as any).onBeforeDetach;
    (cell as any).onBeforeDetach = function(msg: Message): void {
      try {
        this._cleanupHeader();
        // Call original method last
        if (originalOnBeforeDetach) {
          originalOnBeforeDetach.call(this, msg);
        }
      } catch (error) {
        console.warn('Failed to detach cell with header:', error);
      }
    };

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