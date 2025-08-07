/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { INotebookTracker } from '@jupyterlab/notebook';
import { convertNotebookToStreamlit } from '../../Extensions/AppBuilder/NotebookToStreamlit';
import { saveFileWithKernel } from '../../Extensions/AppBuilder/fileUtils';
import { checkAuthenticationAndRedirect, getJWTToken } from '../../Extensions/AppBuilder/auth';
import { deployAppNotification } from '../../Extensions/AppBuilder/DeployAppNotification';

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
    checkAuthenticationAndRedirect: jest.fn(),
    getJWTToken: jest.fn()
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

    test('should check authentication before proceeding', async () => {
        (checkAuthenticationAndRedirect as jest.Mock).mockResolvedValue(true);
        (getJWTToken as jest.Mock).mockReturnValue('test-jwt-token');

        await convertNotebookToStreamlit(mockNotebookTracker, mockAppBuilderService);

        expect(checkAuthenticationAndRedirect).toHaveBeenCalled();
    });

    test('should return early if user is not authenticated', async () => {
        (checkAuthenticationAndRedirect as jest.Mock).mockResolvedValue(false);

        await convertNotebookToStreamlit(mockNotebookTracker, mockAppBuilderService);

        expect(console.log).toHaveBeenCalledWith('User not authenticated, redirected to signup');
        expect(saveFileWithKernel).not.toHaveBeenCalled();
        expect(mockAppBuilderService.client.sendMessage).not.toHaveBeenCalled();
    });

    test('should handle case when no notebook is active', async () => {
        (checkAuthenticationAndRedirect as jest.Mock).mockResolvedValue(true);
        const mockNotebookTrackerNoWidget = {
            currentWidget: null
        } as any;

        await convertNotebookToStreamlit(mockNotebookTrackerNoWidget, mockAppBuilderService);

        expect(console.error).toHaveBeenCalledWith('No notebook is currently active');
    });

    test('should generate requirements.txt and deploy app when authenticated', async () => {
        (checkAuthenticationAndRedirect as jest.Mock).mockResolvedValue(true);
        (getJWTToken as jest.Mock).mockReturnValue('test-jwt-token');

        await convertNotebookToStreamlit(mockNotebookTracker, mockAppBuilderService);

        // Verify requirements.txt was generated and saved
        expect(saveFileWithKernel).toHaveBeenCalledWith(
            mockNotebookTracker,
            './requirements.txt',
            expect.any(String)
        );

        // Verify deployment request was sent
        expect(mockAppBuilderService.client.sendMessage).toHaveBeenCalledWith({
            type: 'build-app',
            message_id: 'test-uuid-123',
            notebook_path: 'test_notebook.ipynb',
            jwt_token: 'test-jwt-token'
        });

        // Verify deployment notification was shown
        expect(deployAppNotification).toHaveBeenCalledWith('https://test-app.streamlit.app');
    });

    test('should use server token as fallback when JWT token is not available', async () => {
        (checkAuthenticationAndRedirect as jest.Mock).mockResolvedValue(true);
        (getJWTToken as jest.Mock).mockReturnValue(null);

        await convertNotebookToStreamlit(mockNotebookTracker, mockAppBuilderService);

        expect(mockAppBuilderService.client.sendMessage).toHaveBeenCalledWith({
            type: 'build-app',
            message_id: 'test-uuid-123',
            notebook_path: 'test_notebook.ipynb',
            jwt_token: 'test-server-token'
        });
    });

    test('should handle deployment errors gracefully', async () => {
        (checkAuthenticationAndRedirect as jest.Mock).mockResolvedValue(true);
        (getJWTToken as jest.Mock).mockReturnValue('test-jwt-token');
        mockAppBuilderService.client.sendMessage.mockRejectedValue(new Error('Deployment failed'));

        await convertNotebookToStreamlit(mockNotebookTracker, mockAppBuilderService);

        expect(console.error).toHaveBeenCalledWith('Error deploying app:', expect.any(Error));
    });

    test('should warn when AppBuilderService is not provided', async () => {
        (checkAuthenticationAndRedirect as jest.Mock).mockResolvedValue(true);

        await convertNotebookToStreamlit(mockNotebookTracker);

        expect(console.warn).toHaveBeenCalledWith('AppBuilderService not provided - app will not be deployed');
        expect(saveFileWithKernel).toHaveBeenCalledWith(
            mockNotebookTracker,
            './requirements.txt',
            expect.any(String)
        );
    });

    test('should log notebook path and name information', async () => {
        (checkAuthenticationAndRedirect as jest.Mock).mockResolvedValue(true);
        (getJWTToken as jest.Mock).mockReturnValue('test-jwt-token');

        await convertNotebookToStreamlit(mockNotebookTracker, mockAppBuilderService);

        expect(console.log).toHaveBeenCalledWith('Notebook path:', 'test_notebook.ipynb');
        expect(console.log).toHaveBeenCalledWith('Notebook name:', 'test_notebook');
        expect(console.log).toHaveBeenCalledWith('Current working directory info:', mockNotebookPanel.context);
    });

    test('should log deployment process steps', async () => {
        (checkAuthenticationAndRedirect as jest.Mock).mockResolvedValue(true);
        (getJWTToken as jest.Mock).mockReturnValue('test-jwt-token');

        await convertNotebookToStreamlit(mockNotebookTracker, mockAppBuilderService);

        expect(console.debug).toHaveBeenCalledWith('Building requirements.txt file');
        expect(console.log).toHaveBeenCalledWith('Sending request to deploy the app');
        expect(console.log).toHaveBeenCalledWith('App deployment response:', {
            url: 'https://test-app.streamlit.app'
        });
    });

    test('should handle different notebook paths correctly', async () => {
        (checkAuthenticationAndRedirect as jest.Mock).mockResolvedValue(true);
        (getJWTToken as jest.Mock).mockReturnValue('test-jwt-token');
        
        // Test with a nested path
        mockNotebookPanel.context.path = 'folder/subfolder/my_notebook.ipynb';

        await convertNotebookToStreamlit(mockNotebookTracker, mockAppBuilderService);

        expect(mockAppBuilderService.client.sendMessage).toHaveBeenCalledWith({
            type: 'build-app',
            message_id: 'test-uuid-123',
            notebook_path: 'folder/subfolder/my_notebook.ipynb',
            jwt_token: 'test-jwt-token'
        });
    });
}); 