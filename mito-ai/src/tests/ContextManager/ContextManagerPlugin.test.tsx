/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { ContextManager } from '../../Extensions/ContextManager/ContextManagerPlugin';
import { Variable } from '../../Extensions/ContextManager/VariableInspector';

// Mock data for testing
const MOCK_VARIABLES: Variable[] = [
    { variable_name: 'x', type: "<class 'int'>", value: 42 },
    { variable_name: 'y', type: "<class 'float'>", value: 3.14 }
];

jest.mock('../../Extensions/ContextManager/FileInspector', () => ({
    getFiles: jest.fn().mockResolvedValue([])
}));

describe('ContextManager', () => {
    let contextManager: ContextManager;
    let mockApp: JupyterFrontEnd;
    let mockNotebookTracker: INotebookTracker;
    let mockSessionContext: any;
    let currentChangedCallback: any;
    const mockNotebookId = '/test/notebook.ipynb';

    beforeEach(() => {
        // Create mock session context with session ID
        mockSessionContext = {
            statusChanged: {
                connect: jest.fn()
            },
        };

        // Create mock notebook panel
        const mockNotebookPanel = {
            id: mockNotebookId,
            context: {
                sessionContext: mockSessionContext,
                path: mockNotebookId
            }
        };

        // Create mock notebook tracker
        mockNotebookTracker = {
            currentChanged: {
                connect: jest.fn((callback) => {
                    currentChangedCallback = callback;
                    return { disconnect: jest.fn() };
                })
            },
            currentWidget: mockNotebookPanel
        } as unknown as INotebookTracker;

        // Create mock app
        mockApp = {} as JupyterFrontEnd;

        // Create context manager instance
        contextManager = new ContextManager(mockApp, mockNotebookTracker);

        // Set initial variables for the test notebook using kernel ID
        contextManager.updateNotebookVariables(mockNotebookId, MOCK_VARIABLES);

        // Trigger the currentChanged event to set up the kernel listener
        currentChangedCallback(mockNotebookTracker, mockNotebookPanel);
    });

    describe('Kernel Refresh', () => {
        it('clears variables when kernel is restarting', () => {
            // Get the callback that was registered for status changes
            const statusChangedCallback = mockSessionContext.statusChanged.connect.mock.calls[0][0];

            // Verify that variables are not empty
            const context = contextManager.getNotebookContext(mockNotebookId);
            expect(context?.variables).toEqual(MOCK_VARIABLES);

            // Simulate kernel refresh by calling the callback with 'restarting' status
            statusChangedCallback({}, 'restarting');

            // Verify that variables were cleared
            const updatedContext = contextManager.getNotebookContext(mockNotebookId);
            expect(updatedContext?.variables).toEqual([]);
        });

        it('clears variables when kernel is terminating', () => {
            // Get the callback that was registered for status changes
            const statusChangedCallback = mockSessionContext.statusChanged.connect.mock.calls[0][0];

            // Verify that variables are not empty
            const context = contextManager.getNotebookContext(mockNotebookId);
            expect(context?.variables).toEqual(MOCK_VARIABLES);

            // Simulate kernel refresh by calling the callback with 'terminating' status
            statusChangedCallback({}, 'terminating');

            // Verify that variables were cleared
            const updatedContext = contextManager.getNotebookContext(mockNotebookId);
            expect(updatedContext?.variables).toEqual([]);
        });

        it('clears variables when kernel is unknown', () => {
            // Get the callback that was registered for status changes
            const statusChangedCallback = mockSessionContext.statusChanged.connect.mock.calls[0][0];

            // Verify that variables are not empty
            const context = contextManager.getNotebookContext(mockNotebookId);
            expect(context?.variables).toEqual(MOCK_VARIABLES);

            // Simulate kernel refresh by calling the callback with 'unknown' status
            statusChangedCallback({}, 'unknown');

            // Verify that variables were cleared
            const updatedContext = contextManager.getNotebookContext(mockNotebookId);
            expect(updatedContext?.variables).toEqual([]);
        });

        it('does not clear variables for other kernel status changes', () => {
            // Get the callback that was registered for status changes
            const statusChangedCallback = mockSessionContext.statusChanged.connect.mock.calls[0][0];

            // Simulate a different kernel status change
            statusChangedCallback({}, 'idle');

            // Verify that variables were not cleared
            const context = contextManager.getNotebookContext(mockNotebookId);
            expect(context?.variables).toEqual(MOCK_VARIABLES);
        });
    });

    describe('Notebook Context Management', () => {
        it('can get context for a specific notebook', () => {
            const context = contextManager.getNotebookContext(mockNotebookId);
            expect(context).toBeDefined();
            expect(context?.variables).toEqual(MOCK_VARIABLES);
        });

        it('returns undefined for non-existent notebook', () => {
            const context = contextManager.getNotebookContext('non-existent-kernel-id');
            expect(context).toBeUndefined();
        });

        it('can update variables for a specific notebook', () => {
            const newVariables: Variable[] = [{ variable_name: 'z', type: "<class 'str'>", value: 'test' }];
            contextManager.updateNotebookVariables(mockNotebookId, newVariables);
            
            const context = contextManager.getNotebookContext(mockNotebookId);
            expect(context?.variables).toEqual(newVariables);
        });

        it('can get active notebook context', () => {
            const activeContext = contextManager.getActiveNotebookContext();
            expect(activeContext).toBeDefined();
            expect(activeContext?.variables).toEqual(MOCK_VARIABLES);
        });
    });
});
