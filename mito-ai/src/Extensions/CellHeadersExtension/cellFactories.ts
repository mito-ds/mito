/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { Cell } from '@jupyterlab/cells';
import { NotebookPanel } from '@jupyterlab/notebook';
import { Message } from '@lumino/messaging';

/**
 * Enhances cells by copying data-windowed-list-index onto the built-in
 * .jp-Cell-header element so CSS can show "Cell N" without JS layout hacks.
 */

/**
 * Enhances a single cell to display numbered headers
 */
const enhanceCell = (cell: Cell): void => {
    // Avoid double-patching
    if ((cell as any)._mitoHeaderPatched) {
        return;
    }
    (cell as any)._mitoHeaderPatched = true;

    // Copies the index onto the header element so that 
    // in the css we can grab the index from the .jp-Cell-header element
    const copyIndexToHeader = (): void => {
        const hdr = cell.node.querySelector('.jp-Cell-header') as HTMLElement | null;
        if (hdr) {
            const idx = cell.node.getAttribute('data-windowed-list-index') ?? '';
            hdr.setAttribute('data-cell-number', idx);
        }
    };

    copyIndexToHeader(); // first time

    // Refresh whenever the widget is attached (virtualization re-attach)
    const originalAfter = (cell as any).onAfterAttach?.bind(cell);
    (cell as any).onAfterAttach = function (msg: Message): void {
        originalAfter?.(msg);
        copyIndexToHeader();
    };
};

/**
 * Enhance a NotebookPanel's content factory to add headers to all new cells
 */
const enhanceNotebookPanelFactory = (panel: NotebookPanel): void => {
    try {
        const notebook = panel.content;
        const contentFactory = notebook.contentFactory;

        // Wrap the content factory's create methods. This will now
        // first call the original create method, and then call enhanceCell on the result
        const wrap = <T extends Cell>(fn: (...a: any[]) => T) =>
            function (this: any, ...a: any[]): T {
                const cell = fn.call(this, ...a);
                enhanceCell(cell);
                return cell;
            };

        contentFactory.createCodeCell = wrap(contentFactory.createCodeCell.bind(contentFactory));
        contentFactory.createMarkdownCell = wrap(contentFactory.createMarkdownCell.bind(contentFactory));
        contentFactory.createRawCell = wrap(contentFactory.createRawCell.bind(contentFactory));

        // Enhance existing cells in the notebook
        notebook.widgets.forEach(enhanceCell);
    } catch (error) {
        console.warn('Failed to enhance notebook panel factory:', error);
    }
};

export { enhanceNotebookPanelFactory };