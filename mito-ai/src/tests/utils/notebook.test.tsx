/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { NotebookPanel } from '@jupyterlab/notebook';
import { writeContentToCellByIDInNotebookPanel } from '../../utils/notebook';

describe('writeContentToCellByIDInNotebookPanel', () => {
    const cellId = 'cell-1';

    const createMockNotebookPanel = () => {
        const cell = {
            model: {
                id: cellId,
                sharedModel: {
                    source: '',
                },
            },
        };

        const notebookPanel = {
            content: {
                widgets: [cell],
            },
        } as unknown as NotebookPanel;

        return { notebookPanel, cell };
    };

    test('strips markdown code fences for code cells', () => {
        const { notebookPanel, cell } = createMockNotebookPanel();

        writeContentToCellByIDInNotebookPanel(
            notebookPanel,
            "```python\nprint('hello')\n```",
            cellId,
            'code',
        );

        expect(cell.model.sharedModel.source).toBe("print('hello')");
    });

    test('preserves full markdown content for markdown cells', () => {
        const { notebookPanel, cell } = createMockNotebookPanel();
        const markdown = `# Header

Some text before code.

\`\`\`python
print('hello')
\`\`\`

Some text after code.`;

        writeContentToCellByIDInNotebookPanel(notebookPanel, markdown, cellId, 'markdown');

        expect(cell.model.sharedModel.source).toBe(markdown);
    });
});
