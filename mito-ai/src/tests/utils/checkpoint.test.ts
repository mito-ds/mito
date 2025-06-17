/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import {
    createNotebookCheckpoint,
    restoreFromCheckpoint,
    createAndSaveCheckpoint,
    INotebookCheckpoint
} from '../../utils/checkpoint';

// Mock JupyterLab notebook structure
const mockNotebookModel = {
    cells: { length: 1 },
    sharedModel: {
        deleteCell: jest.fn(),
        insertCell: jest.fn(),
        setMetadata: jest.fn()
    },
    metadata: { kernelspec: { name: 'python3' } }
};

const mockNotebook = {
    model: mockNotebookModel,
    widgets: [{
        model: {
            id: 'cell-1',
            type: 'code',
            sharedModel: { getSource: jest.fn(() => 'print("hello")') },
            metadata: {},
            outputs: { toJSON: jest.fn(() => []) },
            executionCount: 1
        }
    }]
};

const mockNotebookTracker = {
    currentWidget: {
        content: mockNotebook,
        context: { path: 'test.ipynb' }
    }
} as any;

describe('Checkpoint Utils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('creates checkpoint with correct data', () => {
        const checkpoint = createNotebookCheckpoint(mockNotebookTracker);

        expect(checkpoint).toBeTruthy();
        expect(checkpoint!.checkpointId).toBeTruthy();
        expect(checkpoint!.cells).toHaveLength(1);
        expect(checkpoint!.cells[0]!.source).toBe('print("hello")');
    });

    it('returns null for empty notebook tracker', () => {
        const checkpoint = createNotebookCheckpoint({ currentWidget: null } as any);
        expect(checkpoint).toBeNull();
    });

    it('restores notebook from checkpoint', () => {
        const testCheckpoint: INotebookCheckpoint = {
            checkpointId: 'test',
            timestamp: new Date(),
            notebookPath: 'test.ipynb',
            cells: [{
                id: 'new-cell',
                cellType: 'code',
                source: 'restored_code = True',
                metadata: {}
            }],
            metadata: {}
        };

        const result = restoreFromCheckpoint(mockNotebookTracker, testCheckpoint);

        expect(result).toBe(true);
        expect(mockNotebookModel.sharedModel.deleteCell).toHaveBeenCalled();
        expect(mockNotebookModel.sharedModel.insertCell).toHaveBeenCalledWith(0, {
            cell_type: 'code',
            source: 'restored_code = True',
            metadata: {},
            execution_count: undefined,
            outputs: []
        });
    });

    it('creates and saves checkpoint', () => {
        const checkpoint = createAndSaveCheckpoint(mockNotebookTracker);
        expect(checkpoint).toBeTruthy();
    });
});