/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import '@testing-library/jest-dom';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';

// Mock the getAIOptimizedCells function which is used by getNotebookStateHash
jest.mock('../../utils/notebook', () => ({
    getAIOptimizedCells: jest.fn()
}));

// Import the real functions to test
import { restoreCheckpoint } from '../../utils/checkpoint';
import { getAIOptimizedCells } from '../../utils/notebook';

describe('restoreCheckpoint Function', () => {
    let mockApp: JupyterFrontEnd;
    let mockNotebookTracker: INotebookTracker;
    let mockSetHasCheckpoint: jest.Mock;
    let mockExecute: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create mock execute function
        mockExecute = jest.fn().mockResolvedValue(undefined);

        // Create mock app with commands.execute
        mockApp = {
            commands: {
                execute: mockExecute
            }
        } as any;

        // Create mock notebook tracker
        mockNotebookTracker = {} as INotebookTracker;

        // Create mock functions
        mockSetHasCheckpoint = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('when user cancels restoration', () => {
        it('should not update any state when notebook state hash remains the same', async () => {
            // Mock getAIOptimizedCells to return the same cells both times (user canceled)
            const mockCells = [
                { id: 'cell1', cell_type: 'code', code: 'print("hello")' },
                { id: 'cell2', cell_type: 'code', code: 'x = 1' }
            ];
            (getAIOptimizedCells as jest.Mock).mockReturnValue(mockCells);

            await restoreCheckpoint(
                mockApp,
                mockNotebookTracker,
                mockSetHasCheckpoint,
            );

            // Verify that the docmanager:restore-checkpoint command was executed
            expect(mockExecute).toHaveBeenCalledWith("docmanager:restore-checkpoint");
            expect(mockExecute).toHaveBeenCalledTimes(1);

            // Verify that getAIOptimizedCells was called twice
            expect(getAIOptimizedCells).toHaveBeenCalledTimes(2);
            expect(getAIOptimizedCells).toHaveBeenCalledWith(mockNotebookTracker);

            // Verify that no state updates occurred (user canceled)
            expect(mockSetHasCheckpoint).not.toHaveBeenCalled();

            // Verify that restart-run-all was not executed
            expect(mockExecute).not.toHaveBeenCalledWith("notebook:restart-run-all");
        });
    });

    describe('when user confirms restoration', () => {
        it('should update all state when notebook state hash changes', async () => {
            // Mock getAIOptimizedCells to return different cells (user confirmed)
            const cellsBefore = [
                { id: 'cell1', cell_type: 'code', code: 'print("hello")' },
                { id: 'cell2', cell_type: 'code', code: 'x = 1' }
            ];
            const cellsAfter = [
                { id: 'cell1', cell_type: 'code', code: 'print("restored")' },
                { id: 'cell2', cell_type: 'code', code: 'x = 2' }
            ];

            (getAIOptimizedCells as jest.Mock)
                .mockReturnValueOnce(cellsBefore)
                .mockReturnValueOnce(cellsAfter);

            await restoreCheckpoint(
                mockApp,
                mockNotebookTracker,
                mockSetHasCheckpoint,
            );

            // Verify that the docmanager:restore-checkpoint command was executed
            expect(mockExecute).toHaveBeenCalledWith("docmanager:restore-checkpoint");

            // Verify that getAIOptimizedCells was called twice
            expect(getAIOptimizedCells).toHaveBeenCalledTimes(2);
            expect(getAIOptimizedCells).toHaveBeenCalledWith(mockNotebookTracker);

            // Verify that state updates occurred (user confirmed)
            expect(mockSetHasCheckpoint).toHaveBeenCalledWith(false);
            expect(mockSetHasCheckpoint).toHaveBeenCalledTimes(1);

            // Verify that restart-run-all was executed
            expect(mockExecute).toHaveBeenCalledWith("notebook:restart-run-all");
            expect(mockExecute).toHaveBeenCalledTimes(2);
        });

        it('should call commands in the correct order', async () => {
            // Mock getAIOptimizedCells to return different values
            const cellsBefore = [{ id: 'cell1', cell_type: 'code', code: 'before' }];
            const cellsAfter = [{ id: 'cell1', cell_type: 'code', code: 'after' }];

            (getAIOptimizedCells as jest.Mock)
                .mockReturnValueOnce(cellsBefore)
                .mockReturnValueOnce(cellsAfter);

            await restoreCheckpoint(
                mockApp,
                mockNotebookTracker,
                mockSetHasCheckpoint,
            );

            // Verify the order of command executions
            expect(mockExecute).toHaveBeenNthCalledWith(1, "docmanager:restore-checkpoint");
            expect(mockExecute).toHaveBeenNthCalledWith(2, "notebook:restart-run-all");
        });
    });

    describe('error handling', () => {
        it('should handle errors from docmanager:restore-checkpoint command', async () => {
            const mockError = new Error('Restore checkpoint failed');
            mockExecute.mockRejectedValueOnce(mockError);

            // Mock getAIOptimizedCells for the first call before the error
            (getAIOptimizedCells as jest.Mock).mockReturnValue([
                { id: 'cell1', cell_type: 'code', code: 'test' }
            ]);

            await expect(restoreCheckpoint(
                mockApp,
                mockNotebookTracker,
                mockSetHasCheckpoint,
            )).rejects.toThrow('Restore checkpoint failed');

            // Verify that getAIOptimizedCells was called once before the error
            expect(getAIOptimizedCells).toHaveBeenCalledTimes(1);

            // Verify that no state updates occurred due to the error
            expect(mockSetHasCheckpoint).not.toHaveBeenCalled();
        });

        it('should handle errors from notebook:restart-run-all command', async () => {
            // Mock successful restoration but failed restart
            const cellsBefore = [{ id: 'cell1', cell_type: 'code', code: 'before' }];
            const cellsAfter = [{ id: 'cell1', cell_type: 'code', code: 'after' }];

            (getAIOptimizedCells as jest.Mock)
                .mockReturnValueOnce(cellsBefore)
                .mockReturnValueOnce(cellsAfter);

            mockExecute
                .mockResolvedValueOnce(undefined) // First call succeeds
                .mockRejectedValueOnce(new Error('Restart failed')); // Second call fails

            await expect(restoreCheckpoint(
                mockApp,
                mockNotebookTracker,
                mockSetHasCheckpoint,
            )).rejects.toThrow('Restart failed');

            // Verify that restoration state updates still occurred
            expect(mockSetHasCheckpoint).toHaveBeenCalledWith(false);
        });
    });
});
