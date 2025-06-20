/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { CodeCell, MarkdownCell, RawCell, Cell } from '@jupyterlab/cells';
import { NotebookPanel } from '@jupyterlab/notebook';
import { Message } from '@lumino/messaging';

/**
 * Enhances cells by copying data-windowed-list-index onto the built-in
 * .jp-Cell-header element so CSS can show "Cell N" without JS layout hacks.
 */

/**
 * Minimal enhancement for future extensibility
 */
export function addHeaderFunctionality(cell: Cell): void {
  try {
    // Add a marker to identify enhanced cells (for future extensions)
    (cell as any)._mitoHeadersEnabled = true;
    
    // Utility to copy the windowed-list index onto the header element
    const updateHeaderNumber = (): void => {
      try {
        const headerEl = cell.node.querySelector('.jp-Cell-header') as HTMLElement | null;
        if (!headerEl) {
          return;
        }
        const idx = cell.node.getAttribute('data-windowed-list-index');
        if (idx !== null) {
          headerEl.setAttribute('data-cell-number', idx);
        }
      } catch (err) {
        console.warn('Failed to update cell header number:', err);
      }
    };

    // Initial update
    updateHeaderNumber();

    // Patch onUpdateRequest so header number stays in sync (covers virtualization re-attach)
    const originalOnUpdateRequest = (cell as any).onUpdateRequest?.bind(cell);
    (cell as any).onUpdateRequest = function(msg: Message): void {
      if (originalOnUpdateRequest) {
        originalOnUpdateRequest(msg);
      }
      updateHeaderNumber();
    };

    // Lightweight API compatibility helpers
    (cell as any).setCellNumber = function(_cellNumber: number): void {
      updateHeaderNumber();
    };

    (cell as any).getCellNumber = function(): number {
      const headerEl = cell.node.querySelector('.jp-Cell-header');
      const val = headerEl?.getAttribute('data-cell-number');
      return val ? parseInt(val, 10) : 0;
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
  return cell && cell._mitoHeadersEnabled === true;
}