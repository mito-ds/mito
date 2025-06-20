/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { CodeCell, MarkdownCell, RawCell, Cell } from '@jupyterlab/cells';
import { NotebookPanel } from '@jupyterlab/notebook';

/**
 * CSS-based cell headers using CSS counters.
 * No complex DOM manipulation needed - CSS handles everything!
 */

/**
 * Minimal enhancement for future extensibility
 */
export function addHeaderFunctionality(cell: Cell): void {
  try {
    // Add a marker to identify enhanced cells (for future extensions)
    (cell as any)._mitoHeadersEnabled = true;
    
    // Add methods for API compatibility (though CSS handles the numbering)
    (cell as any).setCellNumber = function(_cellNumber: number): void {
      // CSS counters handle numbering automatically - this is just for API compatibility
    };

    (cell as any).getCellNumber = function(): number {
      // CSS counters handle numbering - this would need to be implemented if needed
      return 0;
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