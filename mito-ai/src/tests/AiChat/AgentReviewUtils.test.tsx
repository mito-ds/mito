/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { NotebookPanel } from '@jupyterlab/notebook';
import {
    acceptAllCellEdits,
    acceptSingleCellEdit,
    rejectSingleCellEdit
} from '../../Extensions/AiChat/AgentReviewUtils';
import { ChangedCell } from '../../Extensions/AiChat/ChatTaskpane';
import * as notebookUtils from '../../utils/notebook';

jest.mock('../../utils/notebook', () => ({
    scrollToNextCellWithDiff: jest.fn(),
    writeContentToCellByIDInNotebookPanel: jest.fn(),
    deleteCellByIDInNotebookPanel: jest.fn(),
    runCellByIDInBackground: jest.fn(),
}));

jest.mock('../../utils/codeDiff', () => ({
    turnOffDiffsForCell: jest.fn(),
}));

describe('AgentReviewUtils markdown handling', () => {
    const notebookPanel = {} as NotebookPanel;
    const codeDiffStripesCompartments = { current: new Map<string, any>() };
    const setAgentReviewStatus = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('acceptSingleCellEdit preserves markdown content', () => {
        const changedCells: ChangedCell[] = [
            {
                cellId: 'cell-1',
                cellType: 'markdown',
                originalCode: '# old',
                currentCode: '# new',
                reviewed: false,
                isNewCell: false,
            },
        ];

        acceptSingleCellEdit(
            'cell-1',
            notebookPanel,
            [
                {
                    id: 'cell-1',
                    cell_type: 'markdown',
                    code: '# Header\n\n```python\nprint("x")\n```',
                },
            ],
            codeDiffStripesCompartments as any,
            changedCells,
            setAgentReviewStatus,
        );

        expect(notebookUtils.writeContentToCellByIDInNotebookPanel).toHaveBeenCalledWith(
            notebookPanel,
            '# Header\n\n```python\nprint("x")\n```',
            'cell-1',
            'markdown',
        );
    });

    test('acceptAllCellEdits preserves markdown content', () => {
        const changedCells: ChangedCell[] = [
            {
                cellId: 'cell-1',
                cellType: 'markdown',
                originalCode: '# old',
                currentCode: '# new',
                reviewed: false,
                isNewCell: false,
            },
        ];

        acceptAllCellEdits(
            notebookPanel,
            [
                {
                    id: 'cell-1',
                    cell_type: 'markdown',
                    code: '# Header\n\n```python\nprint("x")\n```',
                },
            ],
            codeDiffStripesCompartments as any,
            changedCells,
        );

        expect(notebookUtils.writeContentToCellByIDInNotebookPanel).toHaveBeenCalledWith(
            notebookPanel,
            '# Header\n\n```python\nprint("x")\n```',
            'cell-1',
            'markdown',
        );
    });

    test('rejectSingleCellEdit preserves markdown content when reverting', () => {
        const changedCells: ChangedCell[] = [
            {
                cellId: 'cell-1',
                cellType: 'markdown',
                originalCode: '# Header\n\n```python\nprint("old")\n```',
                currentCode: '# Header\n\n```python\nprint("new")\n```',
                reviewed: false,
                isNewCell: false,
            },
        ];

        rejectSingleCellEdit(
            'cell-1',
            notebookPanel,
            codeDiffStripesCompartments as any,
            changedCells,
            setAgentReviewStatus,
        );

        expect(notebookUtils.writeContentToCellByIDInNotebookPanel).toHaveBeenCalledWith(
            notebookPanel,
            '# Header\n\n```python\nprint("old")\n```',
            'cell-1',
            'markdown',
        );
    });
});
