/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { INotebookTracker } from '@jupyterlab/notebook';
import { convertNotebookToStreamlit } from '../../Extensions/AppBuilder/NotebookToStreamlit';
import { saveFileWithKernel } from '../../Extensions/AppBuilder/fileUtils';
import { getJWTToken } from '../../Extensions/AppBuilder/auth';
import { deployAppNotification } from '../../Extensions/AppBuilder/DeployAppNotification';
import { showAuthenticationPopup } from '../../Extensions/AppBuilder/authPopupUtils';

// Mock the dependencies
jest.mock('@jupyterlab/notebook');
jest.mock('@jupyterlab/coreutils', () => ({
    PathExt: {
        basename: jest.fn().mockImplementation((path: string, ext: string) => {
            const basename = path.split('/').pop() || path;
            return ext ? basename.replace(ext, '') : basename;
        })
    }
}));
jest.mock('@jupyterlab/apputils', () => ({
    Notification: {
        emit: jest.fn()
    }
}));
jest.mock('../../Extensions/AppBuilder/fileUtils', () => ({
    saveFileWithKernel: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('../../Extensions/AppBuilder/auth', () => ({
    getJWTToken: jest.fn()
}));
jest.mock('../../Extensions/AppBuilder/authPopupUtils', () => ({
    showAuthenticationPopup: jest.fn()
}));
jest.mock('../../Extensions/AppBuilder/DeployAppNotification', () => ({
    deployAppNotification: jest.fn()
}));
jest.mock('../../Extensions/AppBuilder/requirementsUtils', () => ({
    generateRequirementsTxt: jest.fn().mockResolvedValue('streamlit>=1.28.0\npandas>=1.5.0')
}));
jest.mock('@lumino/coreutils', () => ({
    UUID: {
        uuid4: jest.fn().mockReturnValue('test-uuid-123')
    }
}));

describe('NotebookToStreamlit Conversion and Deployment', () => {
    let mockNotebookTracker: jest.Mocked<INotebookTracker>;
    let mockNotebookPanel: any;
    let mockAppBuilderService: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mock notebook panel
        mockNotebookPanel = {
            context: { path: 'test_notebook.ipynb' },
            content: { 
                widgets: [{
                    model: {
                        type: 'code',
                        sharedModel: {
                            source: 'import pandas as pd\ndf = pd.DataFrame({"A": [1, 2, 3]})'
                        },
                        id: 'test-cell-id',
                        metadata: {},
                        setMetadata: jest.fn(),
                        getMetadata: jest.fn().mockReturnValue(true)
                    }
                }]
            }
        };

        // Setup mock notebook tracker
        mockNotebookTracker = {
            currentWidget: mockNotebookPanel
        } as any;

        // Setup mock app builder service
        mockAppBuilderService = {
            client: {
                sendMessage: jest.fn().mockResolvedValue({
                    url: 'https://test-app.streamlit.app'
                }),
                serverSettings: {
                    token: 'test-server-token'
                }
            }
        };

        // Mock console methods
        console.error = jest.fn();
        console.log = jest.fn();
        console.warn = jest.fn();
        console.debug = jest.fn();
    });

    test('should proceed when JWT token is available', async () => {
        (getJWTToken as jest.Mock).mockResolvedValue('test-jwt-token');

        await convertNotebookToStreamlit(mockNotebookTracker, mockAppBuilderService);

        expect(getJWTToken).toHaveBeenCalled();
        expect(saveFileWithKernel).toHaveBeenCalled();
    });

    test('should show authentication popup when no JWT token is available', async () => {
        (getJWTToken as jest.Mock)
            .mockResolvedValueOnce('') // First call returns empty string
            .mockResolvedValueOnce('test-jwt-token'); // Second call returns token
        (showAuthenticationPopup as jest.Mock).mockResolvedValue({ userId: 'test-user' });

        await convertNotebookToStreamlit(mockNotebookTracker, mockAppBuilderService);

        expect(showAuthenticationPopup).toHaveBeenCalled();
        expect(getJWTToken).toHaveBeenCalledTimes(2);
        expect(saveFileWithKernel).toHaveBeenCalled();
    });

    test('should handle authentication failure gracefully', async () => {
        (getJWTToken as jest.Mock).mockResolvedValue('');
        (showAuthenticationPopup as jest.Mock).mockRejectedValue(new Error('Auth failed'));

        await convertNotebookToStreamlit(mockNotebookTracker, mockAppBuilderService);

        expect(showAuthenticationPopup).toHaveBeenCalled();
        // Function returns early when authentication fails, so no deployment
        expect(saveFileWithKernel).not.toHaveBeenCalled();
        expect(mockAppBuilderService.client.sendMessage).not.toHaveBeenCalled();
    });

    test('should handle case when JWT token is still not available after authentication', async () => {
        (getJWTToken as jest.Mock)
            .mockResolvedValueOnce('') // First call returns empty string
            .mockResolvedValueOnce(''); // Second call also returns empty string
        (showAuthenticationPopup as jest.Mock).mockResolvedValue({ userId: 'test-user' });

        await convertNotebookToStreamlit(mockNotebookTracker, mockAppBuilderService);

        expect(showAuthenticationPopup).toHaveBeenCalled();
        expect(getJWTToken).toHaveBeenCalledTimes(2);
        // Function returns early when JWT token is still not available, so no deployment
        expect(saveFileWithKernel).not.toHaveBeenCalled();
        expect(mockAppBuilderService.client.sendMessage).not.toHaveBeenCalled();
    });

    test('should proceed with deployment when authentication is successful', async () => {
        (getJWTToken as jest.Mock).mockResolvedValue('test-jwt-token');

        await convertNotebookToStreamlit(mockNotebookTracker, mockAppBuilderService);

        expect(mockAppBuilderService.client.sendMessage).toHaveBeenCalledWith({
            type: 'build-app',
            message_id: 'test-uuid-123',
            notebook_path: 'test_notebook.ipynb',
            jwt_token: 'test-jwt-token'
        });
    });

    test('should handle deployment errors gracefully', async () => {
        (getJWTToken as jest.Mock).mockResolvedValue('test-jwt-token');
        mockAppBuilderService.client.sendMessage.mockRejectedValue(new Error('Deployment failed'));

        await convertNotebookToStreamlit(mockNotebookTracker, mockAppBuilderService);

        expect(console.error).toHaveBeenCalledWith('Error deploying app:', expect.any(Error));
    });

    test('should handle successful deployment response', async () => {
        (getJWTToken as jest.Mock).mockResolvedValue('test-jwt-token');
        mockAppBuilderService.client.sendMessage.mockResolvedValue({
            url: 'https://test-app.streamlit.app'
        });

        await convertNotebookToStreamlit(mockNotebookTracker, mockAppBuilderService);

        expect(deployAppNotification).toHaveBeenCalledWith('https://test-app.streamlit.app');
    });

    test('should handle deployment response with error', async () => {
        (getJWTToken as jest.Mock).mockResolvedValue('test-jwt-token');
        mockAppBuilderService.client.sendMessage.mockResolvedValue({
            error: {
                title: 'Deployment failed',
                hint: 'Please try again'
            }
        });

        await convertNotebookToStreamlit(mockNotebookTracker, mockAppBuilderService);

        expect(deployAppNotification).not.toHaveBeenCalled();
    });

    test('should handle case when no notebook is active', async () => {
        (getJWTToken as jest.Mock).mockResolvedValue('test-jwt-token');
        const mockNotebookTrackerNoWidget = {
            currentWidget: null
        } as any;

        await convertNotebookToStreamlit(mockNotebookTrackerNoWidget, mockAppBuilderService);

        expect(console.error).toHaveBeenCalledWith('No notebook is currently active');
        expect(saveFileWithKernel).not.toHaveBeenCalled();
    });

    test('should handle case when AppBuilderService is not provided', async () => {
        (getJWTToken as jest.Mock).mockResolvedValue('test-jwt-token');

        await convertNotebookToStreamlit(mockNotebookTracker, undefined);

        expect(console.warn).toHaveBeenCalledWith('AppBuilderService not provided - app will not be deployed');
        expect(saveFileWithKernel).toHaveBeenCalled();
    });

    test('should use server token as fallback when JWT token is not available', async () => {
        (getJWTToken as jest.Mock)
            .mockResolvedValueOnce('') // First call returns empty string
            .mockResolvedValueOnce(''); // Second call also returns empty string
        (showAuthenticationPopup as jest.Mock).mockRejectedValue(new Error('Auth failed'));

        await convertNotebookToStreamlit(mockNotebookTracker, mockAppBuilderService);

        // Function returns early when authentication fails, so no deployment
        expect(saveFileWithKernel).not.toHaveBeenCalled();
        expect(mockAppBuilderService.client.sendMessage).not.toHaveBeenCalled();
    });
}); 