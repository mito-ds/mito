/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { deployStreamlitApp } from '../../Extensions/AppDeploy/DeployStreamlitApp';
import { saveFileWithKernel } from '../../Extensions/AppDeploy/fileUtils';
import { getJWTToken } from '../../Extensions/AppDeploy/auth';
import { deployAppNotification } from '../../Extensions/AppDeploy/DeployAppNotification';
import { showAuthenticationPopup } from '../../Extensions/AppDeploy/authPopupUtils';

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
        emit: jest.fn().mockReturnValue('test-notification-id'),
        update: jest.fn()
    }
}));
jest.mock('../../Extensions/AppDeploy/fileUtils', () => ({
    saveFileWithKernel: jest.fn().mockResolvedValue(undefined)
}));
jest.mock('../../Extensions/AppDeploy/auth', () => ({
    getJWTToken: jest.fn()
}));
jest.mock('../../Extensions/AppDeploy/authPopupUtils', () => ({
    showAuthenticationPopup: jest.fn()
}));
jest.mock('../../Extensions/AppDeploy/DeployAppNotification', () => ({
    deployAppNotification: jest.fn()
}));
jest.mock('../../Extensions/AppDeploy/requirementsUtils', () => ({
    generateRequirementsTxt: jest.fn().mockResolvedValue('streamlit>=1.28.0\npandas>=1.5.0')
}));
jest.mock('@lumino/coreutils', () => ({
    UUID: {
        uuid4: jest.fn().mockReturnValue('test-uuid-123')
    }
}));

// Mock the DeployFilesSelector component to prevent fetch calls
jest.mock('../../Extensions/AppDeploy/DeployFilesSelector', () => ({
    FileUploadPopup: jest.fn().mockImplementation(({ onSubmit, onClose }) => {
        // Simulate user selecting default files
        const mockSelectedFiles = ['app.py', 'requirements.txt'];
        
        // Simulate the component behavior - call onSubmit with selected files
        React.useEffect(() => {
            // Use setTimeout to simulate async behavior
            const timer = setTimeout(() => {
                onSubmit(mockSelectedFiles);
            }, 0);
            
            return () => clearTimeout(timer);
        }, [onSubmit]);
        
        return React.createElement('div', { 
            'data-testid': 'file-upload-popup',
            onClick: () => onSubmit(mockSelectedFiles)
        }, 'Mock File Upload Popup');
    })
}));

// Mock the fileSelectorPopup function to return the expected files
jest.mock('../../Extensions/AppDeploy/FilesSelectorUtils', () => ({
    fileSelectorPopup: jest.fn().mockResolvedValue(['app.py', 'requirements.txt'])
}));

// Mock Notification.emit to return a predictable ID
jest.mock('@jupyterlab/apputils', () => ({
    Notification: {
        emit: jest.fn().mockReturnValue('test-notification-id'),
        update: jest.fn(),
        dismiss: jest.fn()
    }
}));

describe('NotebookToStreamlit Conversion and Deployment', () => {
    let mockNotebookPanel: any;
    let mockAppDeployService: any;
    let mockAppManagerService: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mock notebook panel
        mockNotebookPanel = {
            context: { 
                path: 'test_notebook.ipynb',
                save: jest.fn(),
            },
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

        // Setup mock app builder service
        mockAppDeployService = {
            client: {
                sendMessage: jest.fn().mockResolvedValue({
                    url: 'https://test-app.streamlit.app'
                }),
                serverSettings: {
                    token: 'test-server-token'
                }
            }
        };

        // Setup mock app manager service
        mockAppManagerService = {
            client: {
                sendMessage: jest.fn().mockResolvedValue({
                    is_accessible: true
                })
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

        await deployStreamlitApp(mockNotebookPanel, mockAppDeployService, mockAppManagerService);

        expect(getJWTToken).toHaveBeenCalled();
        expect(saveFileWithKernel).toHaveBeenCalled();
    });

    test('should show authentication popup when no JWT token is available', async () => {
        (getJWTToken as jest.Mock)
            .mockResolvedValueOnce('') // First call returns empty string
            .mockResolvedValueOnce('test-jwt-token'); // Second call returns token
        (showAuthenticationPopup as jest.Mock).mockResolvedValue({ userId: 'test-user' });

        await deployStreamlitApp(mockNotebookPanel, mockAppDeployService, mockAppManagerService);

        expect(showAuthenticationPopup).toHaveBeenCalled();
        expect(getJWTToken).toHaveBeenCalledTimes(2);
        expect(saveFileWithKernel).toHaveBeenCalled();
    });

    test('should handle authentication failure gracefully', async () => {
        (getJWTToken as jest.Mock).mockResolvedValue('');
        (showAuthenticationPopup as jest.Mock).mockRejectedValue(new Error('Auth failed'));

        await deployStreamlitApp(mockNotebookPanel, mockAppDeployService, mockAppManagerService);

        expect(showAuthenticationPopup).toHaveBeenCalled();
        // Function returns early when authentication fails, so no deployment
        expect(saveFileWithKernel).not.toHaveBeenCalled();
        expect(mockAppDeployService.client.sendMessage).not.toHaveBeenCalled();
    });

    test('should handle case when JWT token is still not available after authentication', async () => {
        (getJWTToken as jest.Mock)
            .mockResolvedValueOnce('') // First call returns empty string
            .mockResolvedValueOnce(''); // Second call also returns empty string
        (showAuthenticationPopup as jest.Mock).mockResolvedValue({ userId: 'test-user' });

        await deployStreamlitApp(mockNotebookPanel, mockAppDeployService, mockAppManagerService);

        expect(showAuthenticationPopup).toHaveBeenCalled();
        expect(getJWTToken).toHaveBeenCalledTimes(2);
        // Function returns early when JWT token is still not available, so no deployment
        expect(saveFileWithKernel).not.toHaveBeenCalled();
        expect(mockAppDeployService.client.sendMessage).not.toHaveBeenCalled();
    });

    test('should proceed with deployment when authentication is successful', async () => {
        (getJWTToken as jest.Mock).mockResolvedValue('test-jwt-token');

        await deployStreamlitApp(mockNotebookPanel, mockAppDeployService, mockAppManagerService);

        expect(mockAppDeployService.client.sendMessage).toHaveBeenCalledWith({
            type: 'deploy_app',
            message_id: 'test-uuid-123',
            notebook_path: 'test_notebook.ipynb',
            jwt_token: 'test-jwt-token',
            selected_files: [
              "app.py",
              "requirements.txt",
            ]
        });
    });

    test('should handle deployment errors gracefully', async () => {
        (getJWTToken as jest.Mock).mockResolvedValue('test-jwt-token');
        mockAppDeployService.client.sendMessage.mockRejectedValue(new Error('Deployment failed'));

        await deployStreamlitApp(mockNotebookPanel, mockAppDeployService, mockAppManagerService);

        expect(console.error).toHaveBeenCalledWith('Error deploying app:', expect.any(Error));
    });

    test('should handle successful deployment response', async () => {
        (getJWTToken as jest.Mock).mockResolvedValue('test-jwt-token');
        mockAppDeployService.client.sendMessage.mockResolvedValue({
            url: 'https://test-app.streamlit.app'
        });

        await deployStreamlitApp(mockNotebookPanel, mockAppDeployService, mockAppManagerService);

        expect(deployAppNotification).toHaveBeenCalledWith('https://test-app.streamlit.app', mockAppManagerService, 'test-notification-id');
    });

    test('should handle deployment response with error', async () => {
        (getJWTToken as jest.Mock).mockResolvedValue('test-jwt-token');
        mockAppDeployService.client.sendMessage.mockResolvedValue({
            error: {
                title: 'Deployment failed',
                hint: 'Please try again'
            }
        });

        await deployStreamlitApp(mockNotebookPanel, mockAppDeployService, mockAppManagerService);

        expect(deployAppNotification).not.toHaveBeenCalled();
    });

    test('should use server token as fallback when JWT token is not available', async () => {
        (getJWTToken as jest.Mock)
            .mockResolvedValueOnce('') // First call returns empty string
            .mockResolvedValueOnce(''); // Second call also returns empty string
        (showAuthenticationPopup as jest.Mock).mockRejectedValue(new Error('Auth failed'));

        await deployStreamlitApp(mockNotebookPanel, mockAppDeployService, mockAppManagerService);

        // Function returns early when authentication fails, so no deployment
        expect(saveFileWithKernel).not.toHaveBeenCalled();
        expect(mockAppDeployService.client.sendMessage).not.toHaveBeenCalled();
    });
}); 