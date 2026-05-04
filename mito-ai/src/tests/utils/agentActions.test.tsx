/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { NotebookActions, NotebookPanel } from '@jupyterlab/notebook';
import { acceptAndRunCellUpdate } from '../../utils/agentActions';
import * as notebookUtils from '../../utils/notebook';

jest.mock('@jupyterlab/notebook', () => ({
    NotebookActions: {
        changeCellType: jest.fn(),
        run: jest.fn(() => Promise.resolve()),
    },
}));

jest.mock('../../utils/sleep', () => ({
    sleep: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../utils/notebook', () => ({
    createCodeCellAfterCellIDAndActivate: jest.fn(),
    didCellExecutionError: jest.fn(),
    getActiveCellIDInNotebookPanel: jest.fn(() => 'active-cell-id'),
    getCellIndexByIDInNotebookPanel: jest.fn(() => 0),
    setActiveCellByIDInNotebookPanel: jest.fn(),
    writeContentToCellByIDInNotebookPanel: jest.fn(),
    scrollToCell: jest.fn(),
}));

describe('acceptAndRunCellUpdate', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const createNotebookPanel = (): NotebookPanel =>
        ({
            content: {},
            context: {
                sessionContext: {},
            },
        } as unknown as NotebookPanel);

    test('passes markdown cell_type for markdown cell updates', async () => {
        const notebookPanel = createNotebookPanel();

        const result = await acceptAndRunCellUpdate(
            {
                type: 'new',
                after_cell_id: 'new cell',
                code: '# Title\n\n```python\nprint("x")\n```',
                cell_type: 'markdown',
            } as any,
            notebookPanel,
        );

        expect(result).toEqual({ success: true });
        expect(notebookUtils.writeContentToCellByIDInNotebookPanel).toHaveBeenCalledWith(
            notebookPanel,
            '# Title\n\n```python\nprint("x")\n```',
            'active-cell-id',
            'markdown',
        );
        expect(NotebookActions.changeCellType).toHaveBeenCalledWith(notebookPanel.content, 'markdown');
    });

    test('passes code cell_type for code cell updates', async () => {
        const notebookPanel = createNotebookPanel();

        const result = await acceptAndRunCellUpdate(
            {
                type: 'new',
                after_cell_id: 'new cell',
                code: '```python\nprint("x")\n```',
                cell_type: 'code',
            } as any,
            notebookPanel,
        );

        expect(result).toEqual({ success: true });
        expect(notebookUtils.writeContentToCellByIDInNotebookPanel).toHaveBeenCalledWith(
            notebookPanel,
            '```python\nprint("x")\n```',
            'active-cell-id',
            'code',
        );
        expect(NotebookActions.changeCellType).toHaveBeenCalledWith(notebookPanel.content, 'code');
    });
});
