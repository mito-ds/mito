/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { INotebookTracker } from '@jupyterlab/notebook';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { JupyterFrontEnd } from '@jupyterlab/application';

/**
 * Creates a mock notebook tracker with minimal required properties
 */
export const createMockNotebookTracker = () => ({
    currentWidget: {
        content: {
            activeCellIndex: 0,
            widgets: [{
                model: {
                    id: 'test-cell-id'
                }
            }]
        }
    },
    // Add the required activeCellChanged signal
    activeCellChanged: {
        connect: jest.fn(),
        disconnect: jest.fn()
    }
}) as unknown as INotebookTracker;

/**
 * Creates a mock render mime registry with minimal implementation
 */
export const createMockRenderMimeRegistry = () => ({
    createRenderer: jest.fn(() => ({
        renderModel: jest.fn(),
        node: document.createElement('div')
    }))
}) as unknown as IRenderMimeRegistry;

/**
 * Creates a mock JupyterFrontEnd app
 */
export const createMockJupyterApp = () => ({
    commands: { 
        execute: jest.fn() 
    }
}) as unknown as JupyterFrontEnd; 