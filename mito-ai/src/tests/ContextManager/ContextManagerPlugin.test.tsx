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

describe('ContextManager', () => {
    let contextManager: ContextManager;
    let mockApp: JupyterFrontEnd;
    let mockNotebookTracker: INotebookTracker;
    let mockSessionContext: any;
    let currentChangedCallback: any;

    beforeEach(() => {
        // Create mock session context
        mockSessionContext = {
            statusChanged: {
                connect: jest.fn()
            }
        };

        // Create mock notebook panel
        const mockNotebookPanel = {
            context: {
                sessionContext: mockSessionContext
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

        // Set initial variables
        contextManager.setVariables(MOCK_VARIABLES);

        // Trigger the currentChanged event to set up the kernel listener
        currentChangedCallback(mockNotebookTracker, mockNotebookPanel);
    });

    describe('Kernel Refresh', () => {
        it('clears variables when kernel is refreshed', () => {
            // Get the callback that was registered for status changes
            const statusChangedCallback = mockSessionContext.statusChanged.connect.mock.calls[0][0];

            // Verify that variables are not empty
            expect(contextManager.variables).toEqual(MOCK_VARIABLES);

            // Simulate kernel refresh by calling the callback with 'restarting' status
            statusChangedCallback({}, 'restarting');

            // Verify that variables were cleared
            expect(contextManager.variables).toEqual([]);
        });

        it('does not clear variables for other kernel status changes', () => {
            // Get the callback that was registered for status changes
            const statusChangedCallback = mockSessionContext.statusChanged.connect.mock.calls[0][0];

            // Simulate a different kernel status change
            statusChangedCallback({}, 'idle');

            // Verify that variables were not cleared
            expect(contextManager.variables).toEqual(MOCK_VARIABLES);
        });
    });
});
