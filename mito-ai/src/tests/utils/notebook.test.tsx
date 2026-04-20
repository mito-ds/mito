/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { NotebookPanel } from '@jupyterlab/notebook';
import { writeCodeToCellByIDInNotebookPanel } from '../../utils/notebook';

describe('writeCodeToCellByIDInNotebookPanel', () => {
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

    test('strips markdown code fences by default', () => {
        const { notebookPanel, cell } = createMockNotebookPanel();

        writeCodeToCellByIDInNotebookPanel(
            notebookPanel,
            "```python\nprint('hello')\n```",
            cellId,
        );

        expect(cell.model.sharedModel.source).toBe("print('hello')");
    });

    test('preserves full markdown content when removeCodeFormatting is false', () => {
        const { notebookPanel, cell } = createMockNotebookPanel();
        const markdown = `# Header

Some text before code.

\`\`\`python
print('hello')
\`\`\`

Some text after code.`;

        writeCodeToCellByIDInNotebookPanel(notebookPanel, markdown, cellId, false);

        expect(cell.model.sharedModel.source).toBe(markdown);
    });
});
