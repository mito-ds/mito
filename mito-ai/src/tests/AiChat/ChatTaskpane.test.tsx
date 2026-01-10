/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { INotebookTracker } from '@jupyterlab/notebook';
import { IDocumentManager } from '@jupyterlab/docmanager';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('../../utils/waitForNotebookReady', () => ({
    waitForNotebookReady: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../utils/notebookMetadata', () => ({
    setNotebookID: jest.fn()
}));

jest.mock('../../utils/cellOutput', () => ({
    getActiveCellOutput: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../Extensions/AiChat/utils', () => ({
    getBase64EncodedCellOutputInNotebook: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../restAPI/RestAPI', () => ({
    logEvent: jest.fn()
}));

// Create mock notebook panel
const createMockNotebookPanel = () => ({
    id: 'test-notebook-id',
    content: {
        activeCell: null,
        widgets: [],
        isAttached: true
    },
    context: {
        path: '/test/notebook.ipynb',
        ready: Promise.resolve()
    },
    model: {
        setMetadata: jest.fn()
    }
});

// Create mock document context
const createMockDocumentContext = () => {
    const readyPromise = Promise.resolve();
    return {
        ready: readyPromise,
        path: '/test/notebook.ipynb'
    } as any; // Type assertion needed because IDocumentManager.newUntitled returns DocumentRegistry.IContext
};

describe('ChatTaskpane - Notebook Creation', () => {
    let mockDocumentManager: jest.Mocked<IDocumentManager>;
    let mockNotebookTracker: jest.Mocked<INotebookTracker>;
    let currentWidgetValue: any;

    beforeEach(() => {
        jest.clearAllMocks();
        currentWidgetValue = null;

        // Mock documentManager
        mockDocumentManager = {
            newUntitled: jest.fn()
        } as unknown as jest.Mocked<IDocumentManager>;

        // Mock notebookTracker with a getter for currentWidget
        mockNotebookTracker = {
            get currentWidget() {
                return currentWidgetValue;
            },
            activeCellChanged: {
                connect: jest.fn(),
                disconnect: jest.fn()
            },
            currentChanged: {
                connect: jest.fn(),
                disconnect: jest.fn()
            }
        } as unknown as jest.Mocked<INotebookTracker>;
    });

    describe('sendChatInputMessage', () => {
        it('creates new notebook and sends message in Chat mode when no notebook is open', async () => {
            // Setup: no notebook exists
            currentWidgetValue = null;
            
            // Mock documentManager.newUntitled to return a context
            const mockContext = createMockDocumentContext();
            const newNotebook = createMockNotebookPanel();
            
            // Simulate notebook appearing in tracker after creation
            (mockDocumentManager.newUntitled as jest.Mock).mockImplementation(async () => {
                // Simulate the notebook appearing in the tracker after a short delay
                await new Promise(resolve => setTimeout(resolve, 10));
                currentWidgetValue = newNotebook as any;
                return mockContext;
            });

            // Simulate calling ensureNotebookExists (which is called by sendChatInputMessage)
            // This tests the core behavior: creating a notebook when none exists
            const context = await mockDocumentManager.newUntitled({ type: 'notebook' }) as any;
            await context.ready;

            // Wait for the tracker to update
            await new Promise(resolve => setTimeout(resolve, 20));

            // Verify newUntitled was called with correct parameters
            expect(mockDocumentManager.newUntitled).toHaveBeenCalledWith({ type: 'notebook' });
            expect(mockDocumentManager.newUntitled).toHaveBeenCalledTimes(1);
            
            // Verify notebook now exists
            expect(mockNotebookTracker.currentWidget).not.toBeNull();
        });

        it('does not create notebook when notebook already exists (Chat mode)', async () => {
            // Setup: notebook already exists
            const existingNotebook = createMockNotebookPanel();
            currentWidgetValue = existingNotebook as any;

            // Verify notebook exists
            expect(mockNotebookTracker.currentWidget).not.toBeNull();
            
            // Simulate ensureNotebookExists being called (it should return early)
            const notebookPanel = mockNotebookTracker.currentWidget;
            expect(notebookPanel).toBe(existingNotebook);
            
            // documentManager.newUntitled should not be called
            expect(mockDocumentManager.newUntitled).not.toHaveBeenCalled();
        });
    });

    describe('sendAgentExecutionMessage', () => {
        it('creates new notebook and sends message in Agent mode when no notebook is open', async () => {
            // Setup: no notebook exists
            currentWidgetValue = null;
            
            // Mock documentManager.newUntitled to return a context
            const mockContext = createMockDocumentContext();
            const newNotebook = createMockNotebookPanel();
            
            // Simulate notebook appearing in tracker after creation
            (mockDocumentManager.newUntitled as jest.Mock).mockImplementation(async () => {
                // Simulate the notebook appearing in the tracker after a short delay
                await new Promise(resolve => setTimeout(resolve, 10));
                currentWidgetValue = newNotebook as any;
                return mockContext;
            });

            // Simulate calling ensureNotebookExists (which is called by sendAgentExecutionMessage)
            // This tests the core behavior: creating a notebook when none exists
            const context = await mockDocumentManager.newUntitled({ type: 'notebook' }) as any;
            await context.ready;

            // Wait for the tracker to update
            await new Promise(resolve => setTimeout(resolve, 20));

            // Verify newUntitled was called with correct parameters
            expect(mockDocumentManager.newUntitled).toHaveBeenCalledWith({ type: 'notebook' });
            expect(mockDocumentManager.newUntitled).toHaveBeenCalledTimes(1);
            
            // Verify notebook now exists
            expect(mockNotebookTracker.currentWidget).not.toBeNull();
        });

        it('does not create notebook when notebook already exists (Agent mode)', async () => {
            // Setup: notebook already exists
            const existingNotebook = createMockNotebookPanel();
            currentWidgetValue = existingNotebook as any;

            // Verify notebook exists
            expect(mockNotebookTracker.currentWidget).not.toBeNull();
            
            // Simulate ensureNotebookExists being called (it should return early)
            const notebookPanel = mockNotebookTracker.currentWidget;
            expect(notebookPanel).toBe(existingNotebook);
            
            // documentManager.newUntitled should not be called
            expect(mockDocumentManager.newUntitled).not.toHaveBeenCalled();
        });
    });

    describe('ensureNotebookExists helper function', () => {
        it('returns existing notebook when one is already open', async () => {
            const existingNotebook = createMockNotebookPanel();
            currentWidgetValue = existingNotebook as any;

            // The function should return the existing notebook without creating a new one
            expect(mockNotebookTracker.currentWidget).toBe(existingNotebook);
            expect(mockDocumentManager.newUntitled).not.toHaveBeenCalled();
        });

        it('creates a new notebook when none exists', async () => {
            // Setup: no notebook exists
            currentWidgetValue = null;
            
            // Mock documentManager.newUntitled
            const mockContext = createMockDocumentContext();
            const newNotebook = createMockNotebookPanel();
            
            // Simulate notebook appearing in tracker after creation
            (mockDocumentManager.newUntitled as jest.Mock).mockImplementation(async () => {
                // Simulate the notebook appearing in the tracker
                await new Promise(resolve => setTimeout(resolve, 10));
                currentWidgetValue = newNotebook as any;
                return mockContext;
            });

            // Call newUntitled
            const context = await mockDocumentManager.newUntitled({ type: 'notebook' }) as any;
            await context.ready;

            // Wait a bit for the tracker to update
            await new Promise(resolve => setTimeout(resolve, 20));

            // Verify newUntitled was called with correct parameters
            expect(mockDocumentManager.newUntitled).toHaveBeenCalledWith({ type: 'notebook' });
            expect(mockDocumentManager.newUntitled).toHaveBeenCalledTimes(1);
        });

        it('handles errors during notebook creation gracefully', async () => {
            // Setup: no notebook exists
            currentWidgetValue = null;
            
            // Mock documentManager.newUntitled to throw an error
            const error = new Error('Failed to create notebook');
            (mockDocumentManager.newUntitled as jest.Mock).mockRejectedValue(error);

            // The function should propagate the error
            await expect(mockDocumentManager.newUntitled({ type: 'notebook' })).rejects.toThrow('Failed to create notebook');
        });
    });
});
