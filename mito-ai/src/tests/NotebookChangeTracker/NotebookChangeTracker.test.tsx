/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Import the plugin function - we need to test the activation logic
import { NotebookActions } from '@jupyterlab/notebook';
import notebookChangeTrackerPlugin from '../../Extensions/NotebookChangeTracker';

describe('NotebookChangeTracker Plugin', () => {
    let mockApp: any;
    let mockNotebookTracker: any;
    let mockNotebookPanel: any;
    let consoleSpy: jest.SpyInstance;
    let currentChangedCallback: any;
    let cellChangedCallback: any;

    beforeEach(() => {
        jest.resetModules();
        // Spy on console.log to detect notifyCellListChanged output
        consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        // Mock cell list
        const mockCellList = {
            changed: {
                connect: jest.fn((cb) => {
                    cellChangedCallback = cb;
                })
            }
        };

        // Mock model
        const mockModel = {
            cells: mockCellList
        };

        // Mock notebook content
        const mockNotebookContent = {
            model: mockModel
        };

        // Mock context
        const mockContext = {
            path: '/test/notebook.ipynb',
        };

        // Mock notebook panel
        mockNotebookPanel = {
            context: mockContext,
            content: mockNotebookContent,
            title: { label: 'test-notebook.ipynb' },
        };

        // Mock notebook tracker
        mockNotebookTracker = {
            currentChanged: {
                connect: jest.fn((cb) => {
                    currentChangedCallback = cb;
                })
            },
            widgetAdded: {
                connect: jest.fn()
            },
            forEach: jest.fn((cb) => {
                cb(mockNotebookPanel);
            })
        };

        // Mock app
        mockApp = {};
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    it('should log change detected when a cell is added', () => {
        notebookChangeTrackerPlugin.activate(mockApp, mockNotebookTracker);
        currentChangedCallback(mockNotebookTracker, mockNotebookPanel);
        // Simulate cell add event
        cellChangedCallback({}, { type: 'add' });
        expect(consoleSpy).toHaveBeenCalledWith('Change detected');
    });

    it('should log change detected when a cell is added, jupyter api', () => {
        notebookChangeTrackerPlugin.activate(mockApp, mockNotebookTracker);
        currentChangedCallback(mockNotebookTracker, mockNotebookPanel);
        // Simulate cell remove event
        NotebookActions.insertBelow(mockNotebookPanel)
        expect(consoleSpy).toHaveBeenCalledWith('Change detected');
    });

    it('should log change detected when a cell is removed', () => {
        notebookChangeTrackerPlugin.activate(mockApp, mockNotebookTracker);
        currentChangedCallback(mockNotebookTracker, mockNotebookPanel);
        // Simulate cell remove event
        cellChangedCallback({}, { type: 'remove' });
        expect(consoleSpy).toHaveBeenCalledWith('Change detected');
    });

    it('should log change detected when a cell is removed, jupyter api', () => {
        notebookChangeTrackerPlugin.activate(mockApp, mockNotebookTracker);
        currentChangedCallback(mockNotebookTracker, mockNotebookPanel);
        // Simulate cell remove event
        NotebookActions.selectAll(mockNotebookPanel)
        NotebookActions.deleteCells(mockNotebookPanel)
        expect(consoleSpy).toHaveBeenCalledWith('Change detected');
    });

    it('should log change detected when a cell is moved', () => {
        notebookChangeTrackerPlugin.activate(mockApp, mockNotebookTracker);
        currentChangedCallback(mockNotebookTracker, mockNotebookPanel);
        // Simulate cell move event
        cellChangedCallback({}, { type: 'move' });
        expect(consoleSpy).toHaveBeenCalledWith('Change detected');
    });

    it('should log change detected when a cell is moved, jupyter api', () => {
        notebookChangeTrackerPlugin.activate(mockApp, mockNotebookTracker);
        currentChangedCallback(mockNotebookTracker, mockNotebookPanel);
        // Simulate cell move event
        NotebookActions.moveUp(mockNotebookPanel)
        expect(consoleSpy).toHaveBeenCalledWith('Change detected');
    });
});
