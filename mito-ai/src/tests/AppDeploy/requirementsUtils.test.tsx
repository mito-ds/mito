/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { generateRequirementsTxt } from '../../Extensions/AppDeploy/requirementsUtils';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Mock the dependencies
jest.mock('@jupyterlab/notebook');

describe('requirementsUtils', () => {
    let mockNotebookPanel: any;
    let mockKernel: any;
    let mockSession: any;
    let testDir: string;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create a temporary directory for testing
        testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mito-test-'));

        // Setup mock kernel
        mockKernel = {
            requestExecute: jest.fn()
        };

        // Setup mock session
        mockSession = {
            kernel: mockKernel
        };

        // Setup mock notebook panel
        mockNotebookPanel = {
            context: { path: 'test_notebook.ipynb' },
            content: { 
                widgets: []
            },
            sessionContext: { session: mockSession }
        };

        // Mock console.error
        console.error = jest.fn();
    });

    afterEach(() => {
        // Clean up test directory
        if (testDir && fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
        
        // Clean up app.py file if it exists
        const appPyPath = path.join(process.cwd(), 'app.py');
        if (fs.existsSync(appPyPath)) {
            fs.unlinkSync(appPyPath);
        }
    });

    // Helper function to create mock app.py files in the current working directory
    const createMockAppPy = (content: string): string => {
        const appPyPath = path.join(process.cwd(), 'app.py');
        fs.writeFileSync(appPyPath, content);
        return appPyPath;
    };

    // Helper function to mock kernel execution that simulates pipreqs
    const mockKernelExecution = (expectedOutput: string, shouldError = false) => {
        let ioHandler: any = null;

        const mockFuture = {
            set onIOPub(handler: any) {
                ioHandler = handler;
            },
            get onIOPub() {
                return ioHandler;
            },
            done: shouldError 
                ? Promise.reject(new Error('Kernel execution failed'))
                : Promise.resolve().then(() => {
                    if (ioHandler) {
                        ioHandler({
                            header: { msg_type: 'stream' },
                            content: { name: 'stdout', text: expectedOutput }
                        });
                    }
                })
        };

        mockKernel.requestExecute.mockReturnValue(mockFuture);
    };

    describe('Simple app.py scenarios', () => {
        test('should verify app.py file exists before running pipreqs', async () => {
            // Don't create app.py file - test the file existence check
            mockKernelExecution('Log: Error: app.py not found at app.py');

            const result = await generateRequirementsTxt(mockNotebookPanel);

            // Should return fallback when app.py doesn't exist
            expect(result).toBe('streamlit>=1.28.0');
            
            // Verify the Python code checks for app.py existence
            expect(mockKernel.requestExecute).toHaveBeenCalledWith({
                code: expect.stringContaining('os.path.exists(app_py_path)'),
                silent: false
            });
        });

        test('should include required packages even if not detected by pipreqs', async () => {
            // Create a mock app.py file with minimal imports
            const appPyContent = `
import requests

response = requests.get("https://api.example.com")
return response.json()

`;
            createMockAppPy(appPyContent);

            // Mock kernel execution with minimal pipreqs output
            const pipreqsOutput = 'requests==2.31.0\n';
            mockKernelExecution(pipreqsOutput);

            const result = await generateRequirementsTxt(mockNotebookPanel);

            // Should include required packages (streamlit) even if not in pipreqs output
            expect(result).toContain('streamlit');
            expect(result).toContain('requests==2.31.0');
        });
    });


    describe('Fallback behavior', () => {
        test('should return fallback requirements when kernel is null', async () => {
            // Set kernel to null
            mockSession.kernel = null;

            const result = await generateRequirementsTxt(mockNotebookPanel);

            expect(result).toBe('streamlit>=1.28.0');
            expect(console.error).toHaveBeenCalledWith('No kernel found');
        });

        test('should return fallback requirements when kernel execution fails', async () => {
            // Create a mock app.py file
            const appPyContent = `
import pandas as pd

df = pd.DataFrame({"A": [1, 2, 3]})
return df

`;
            createMockAppPy(appPyContent);

            // Mock kernel execution that throws an error
            mockKernelExecution('', true);

            const result = await generateRequirementsTxt(mockNotebookPanel);

            expect(result).toBe('streamlit>=1.28.0');
            expect(console.error).toHaveBeenCalledWith('Error generating requirements.txt:', expect.any(Error));
        });

        test('should return fallback requirements when pipreqs execution fails', async () => {
            // Create a mock app.py file
            const appPyContent = `
import pandas as pd
df = pd.DataFrame({"A": [1, 2, 3]})
df
`;
            createMockAppPy(appPyContent);

            // Mock kernel execution that returns empty result
            mockKernelExecution('');

            const result = await generateRequirementsTxt(mockNotebookPanel);

            expect(result).toBe('streamlit>=1.28.0');
        });

        test('should return fallback requirements when session is null', async () => {
            // Set session to null
            mockNotebookPanel.sessionContext.session = null;

            const result = await generateRequirementsTxt(mockNotebookPanel);

            expect(result).toBe('streamlit>=1.28.0');
        });
    });

    describe('Error handling and edge cases', () => {
        test('should handle app.py file not found', async () => {
            // Don't create app.py file - simulate it not existing
            // Mock kernel execution that simulates app.py not found
            mockKernelExecution('Log: Error: app.py not found at app.py');

            const result = await generateRequirementsTxt(mockNotebookPanel);

            expect(result).toBe('streamlit>=1.28.0');
        });

        test('should handle stderr output from pipreqs', async () => {
            // Create a mock app.py file
            const appPyContent = `
import pandas as pd

df = pd.DataFrame({"A": [1, 2, 3]})
df
`;
            createMockAppPy(appPyContent);

            // Mock kernel execution with stderr and stdout output
            let ioHandler: any = null;

            const mockFuture = {
                set onIOPub(handler: any) {
                    ioHandler = handler;
                },
                get onIOPub() {
                    return ioHandler;
                },
                done: Promise.resolve().then(() => {
                    if (ioHandler) {
                        // First call with stderr
                        ioHandler({
                            header: { msg_type: 'stream' },
                            content: { name: 'stdout', text: 'Log: pipreqs warning: some packages not found' }
                        });
                        // Second call with actual output
                        ioHandler({
                            header: { msg_type: 'stream' },
                            content: { name: 'stdout', text: 'pandas==2.0.3\n' }
                        });
                    }
                })
            };

            mockKernel.requestExecute.mockReturnValue(mockFuture);

            const result = await generateRequirementsTxt(mockNotebookPanel);

            expect(result).toContain('pandas==2.0.3');
            expect(result).toContain('streamlit');
        });
    });
}); 