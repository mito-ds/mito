/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { ContextManager } from '../../Extensions/ContextManager/ContextManagerPlugin';
import { fetchVariablesAndUpdateState, Variable } from '../../Extensions/ContextManager/VariableInspector';
import { KernelMessage } from '@jupyterlab/services';

// Mock data for testing
const MOCK_VARIABLES: Variable[] = [
    { variable_name: 'x', type: "<class 'int'>", value: 42 },
    { variable_name: 'y', type: "<class 'float'>", value: 3.14 }
];

jest.mock('../../Extensions/ContextManager/FileInspector', () => ({
    getFiles: jest.fn().mockResolvedValue([])
}));

jest.mock('../../Extensions/ContextManager/VariableInspector', () => ({
    fetchVariablesAndUpdateState: jest.fn()
}));

describe('ContextManager', () => {
    let contextManager: ContextManager;
    let mockApp: JupyterFrontEnd;
    let mockNotebookTracker: INotebookTracker;
    let mockSessionContext: any;
    let currentChangedCallback: any;
    const mockNotebookId = '/test/notebook.ipynb';
    const flushPromises = async (): Promise<void> => {
        await Promise.resolve();
        await Promise.resolve();
    };

    beforeEach(async () => {
        // Create mock session context with session ID
        mockSessionContext = {
            statusChanged: {
                connect: jest.fn()
            },
            iopubMessage: {
                connect: jest.fn()
            }
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
        await flushPromises();
    });

    afterEach(() => {
        jest.clearAllMocks();
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

            // Simulate a different kernel status change. The notebook has not been marked
            // dirty by an execute_input, so 'idle' should not trigger a refresh either.
            statusChangedCallback({}, 'idle');

            // Verify that variables were not cleared
            const context = contextManager.getNotebookContext(mockNotebookId);
            expect(context?.variables).toEqual(MOCK_VARIABLES);
        });
    });

    describe('Deferred variable fetching', () => {
        it('does not fetch variables on execute_input — defers until kernel idle', () => {
            const iopubMessageCallback = mockSessionContext.iopubMessage.connect.mock.calls[0][0];
            const executeInputMessage = {
                header: { msg_type: 'execute_input' }
            } as KernelMessage.IMessage;

            iopubMessageCallback({}, executeInputMessage);

            expect(fetchVariablesAndUpdateState).not.toHaveBeenCalled();
        });

        it('fetches variables once when the kernel returns to idle after one or more execute_inputs', () => {
            const iopubMessageCallback = mockSessionContext.iopubMessage.connect.mock.calls[0][0];
            const statusChangedCallback = mockSessionContext.statusChanged.connect.mock.calls[0][0];
            const executeInputMessage = {
                header: { msg_type: 'execute_input' }
            } as KernelMessage.IMessage;

            // Simulate "Run All": multiple execute_inputs arrive before the kernel goes idle.
            iopubMessageCallback({}, executeInputMessage);
            iopubMessageCallback({}, executeInputMessage);
            iopubMessageCallback({}, executeInputMessage);

            expect(fetchVariablesAndUpdateState).not.toHaveBeenCalled();

            // Once the kernel goes idle, exactly one fetch should fire for the batch.
            statusChangedCallback({}, 'idle');

            expect(fetchVariablesAndUpdateState).toHaveBeenCalledTimes(1);
            expect(fetchVariablesAndUpdateState).toHaveBeenCalledWith(
                mockNotebookTracker.currentWidget,
                expect.any(Function)
            );
        });

        it('does not fetch on idle when the notebook is not dirty', () => {
            const statusChangedCallback = mockSessionContext.statusChanged.connect.mock.calls[0][0];

            // No execute_input has marked the notebook dirty, so idle alone is a no-op.
            statusChangedCallback({}, 'idle');

            expect(fetchVariablesAndUpdateState).not.toHaveBeenCalled();
        });

        it('clears the dirty flag after fetching, so a subsequent idle without new execute_input does nothing', () => {
            const iopubMessageCallback = mockSessionContext.iopubMessage.connect.mock.calls[0][0];
            const statusChangedCallback = mockSessionContext.statusChanged.connect.mock.calls[0][0];
            const executeInputMessage = {
                header: { msg_type: 'execute_input' }
            } as KernelMessage.IMessage;

            iopubMessageCallback({}, executeInputMessage);
            statusChangedCallback({}, 'idle');
            expect(fetchVariablesAndUpdateState).toHaveBeenCalledTimes(1);

            // A second idle with no intervening execute_input should not trigger a second fetch.
            statusChangedCallback({}, 'idle');
            expect(fetchVariablesAndUpdateState).toHaveBeenCalledTimes(1);
        });
    });

    describe('Kernel Listener Registration', () => {
        it('only registers one set of listeners for the same notebook panel', async () => {
            expect(mockSessionContext.statusChanged.connect).toHaveBeenCalledTimes(1);
            expect(mockSessionContext.iopubMessage.connect).toHaveBeenCalledTimes(1);

            const mockNotebookPanel = mockNotebookTracker.currentWidget;
            currentChangedCallback(mockNotebookTracker, mockNotebookPanel);
            await flushPromises();

            expect(mockSessionContext.statusChanged.connect).toHaveBeenCalledTimes(1);
            expect(mockSessionContext.iopubMessage.connect).toHaveBeenCalledTimes(1);
        });

        it('fetches variables once per execute_input/idle cycle even after re-activating the same notebook', async () => {
            const mockNotebookPanel = mockNotebookTracker.currentWidget;
            currentChangedCallback(mockNotebookTracker, mockNotebookPanel);
            await flushPromises();

            // Only one set of listeners should be registered, so there is still only one
            // iopub callback and one statusChanged callback to drive.
            const iopubMessageCallback = mockSessionContext.iopubMessage.connect.mock.calls[0][0];
            const statusChangedCallback = mockSessionContext.statusChanged.connect.mock.calls[0][0];
            const executeInputMessage = {
                header: {
                    msg_type: 'execute_input'
                }
            } as KernelMessage.IMessage;

            iopubMessageCallback({}, executeInputMessage);
            statusChangedCallback({}, 'idle');

            expect(fetchVariablesAndUpdateState).toHaveBeenCalledTimes(1);
            expect(fetchVariablesAndUpdateState).toHaveBeenCalledWith(
                mockNotebookPanel,
                expect.any(Function)
            );
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
