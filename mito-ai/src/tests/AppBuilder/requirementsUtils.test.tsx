/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { INotebookTracker } from '@jupyterlab/notebook';
import { generateRequirementsTxt } from '../../Extensions/AppBuilder/requirementsUtils';

// Mock the dependencies
jest.mock('@jupyterlab/notebook');

describe('requirementsUtils', () => {
    let mockNotebookTracker: jest.Mocked<INotebookTracker>;
    let mockNotebookPanel: any;
    let mockKernel: any;
    let mockSession: any;

    beforeEach(() => {
        jest.clearAllMocks();

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

        // Setup mock notebook tracker
        mockNotebookTracker = {
            currentWidget: mockNotebookPanel
        } as any;

        // Mock console.error
        console.error = jest.fn();
    });

    describe('Simple code scenarios', () => {
        test('should generate requirements.txt for simple pandas and numpy imports', async () => {
            // Create mock code cells with simple imports
            const mockCodeCell1 = {
                model: {
                    type: 'code',
                    sharedModel: {
                        source: 'import pandas as pd\nimport numpy as np\ndf = pd.DataFrame({"A": [1, 2, 3]})'
                    }
                }
            };

            const mockCodeCell2 = {
                model: {
                    type: 'code',
                    sharedModel: {
                        source: 'import matplotlib.pyplot as plt\nplt.plot([1, 2, 3])'
                    }
                }
            };

            mockNotebookPanel.content.widgets = [mockCodeCell1, mockCodeCell2];

            // Simulate successful pipreqs output
            const expectedOutput = 'pandas==2.0.3\nnumpy==1.24.3\nmatplotlib==3.7.1';

            // Mock the future object with proper async behavior
            let ioHandler: any = null;

            const mockFuture = {
                set onIOPub(handler: any) {
                    ioHandler = handler;
                },
                get onIOPub() {
                    return ioHandler;
                },
                done: Promise.resolve().then(() => {
                    // Simulate the stdout message AFTER future.done resolves
                    if (ioHandler) {
                        ioHandler({
                            header: { msg_type: 'stream' },
                            content: { name: 'stdout', text: expectedOutput }
                        });
                    }
                })
            };

            mockKernel.requestExecute.mockReturnValue(mockFuture);

            const result = await generateRequirementsTxt(mockNotebookTracker);

            // The result should contain the pipreqs output plus the required streamlit package
            expect(result).toContain('pandas==2.0.3');
            expect(result).toContain('numpy==1.24.3');
            expect(result).toContain('matplotlib==3.7.1');
            expect(result).toContain('streamlit');

            expect(mockKernel.requestExecute).toHaveBeenCalledWith({
                code: expect.stringContaining('pipreqs'),
                silent: false
            });
        });

        test('should include required packages even if not detected by pipreqs', async () => {
            // Create mock code cell with only basic code (no imports)
            const mockCodeCell = {
                model: {
                    type: 'code',
                    sharedModel: {
                        source: 'x = 42\nprint("Hello World")'
                    }
                }
            };

            mockNotebookPanel.content.widgets = [mockCodeCell];

            // Mock successful kernel execution with minimal output
            const mockFuture = {
                onIOPub: jest.fn(),
                done: Promise.resolve()
            };

            mockKernel.requestExecute.mockReturnValue(mockFuture);

            // Simulate pipreqs output with only basic packages
            const pipreqsOutput = 'requests==2.31.0';

            mockFuture.onIOPub.mockImplementation((handler) => {
                handler({
                    header: { msg_type: 'stream' },
                    content: { name: 'stdout', text: pipreqsOutput }
                });
            });

            const result = await generateRequirementsTxt(mockNotebookTracker);

            // Should include required packages (streamlit)
            expect(result).toContain('streamlit');
        });
    });

    describe('Shell commands filtering', () => {
        test('should filter out !pip install commands', async () => {
            // Create mock code cell with shell commands
            const mockCodeCell = {
                model: {
                    type: 'code',
                    sharedModel: {
                        source: '!pip install pandas\n!pip install numpy\nimport pandas as pd\nimport numpy as np\ndf = pd.DataFrame({"A": [1, 2, 3]})'
                    }
                }
            };

            mockNotebookPanel.content.widgets = [mockCodeCell];

            // Mock successful kernel execution
            const mockFuture = {
                onIOPub: jest.fn(),
                done: Promise.resolve()
            };

            mockKernel.requestExecute.mockReturnValue(mockFuture);

            // Simulate pipreqs output
            const expectedOutput = 'pandas==2.0.3\nnumpy==1.24.3';
            
            mockFuture.onIOPub.mockImplementation((handler) => {
                handler({
                    header: { msg_type: 'stream' },
                    content: { name: 'stdout', text: expectedOutput }
                });
            });

            await generateRequirementsTxt(mockNotebookTracker);

            // Verify that the Python code sent to kernel doesn't include shell commands
            const pythonCode = mockKernel.requestExecute.mock.calls[0][0].code;
            expect(pythonCode).not.toContain('!pip install pandas');
            expect(pythonCode).not.toContain('!pip install numpy');
            expect(pythonCode).toContain('import pandas as pd');
            expect(pythonCode).toContain('import numpy as np');
        });

        test('should filter out %matplotlib magic commands', async () => {
            // Create mock code cell with magic commands
            const mockCodeCell = {
                model: {
                    type: 'code',
                    sharedModel: {
                        source: '%matplotlib inline\n%config InlineBackend.figure_format = "retina"\nimport matplotlib.pyplot as plt\nplt.plot([1, 2, 3])'
                    }
                }
            };

            mockNotebookPanel.content.widgets = [mockCodeCell];

            // Mock successful kernel execution
            const mockFuture = {
                onIOPub: jest.fn(),
                done: Promise.resolve()
            };

            mockKernel.requestExecute.mockReturnValue(mockFuture);

            const expectedOutput = 'matplotlib==3.7.1';
            
            mockFuture.onIOPub.mockImplementation((handler) => {
                handler({
                    header: { msg_type: 'stream' },
                    content: { name: 'stdout', text: expectedOutput }
                });
            });

            await generateRequirementsTxt(mockNotebookTracker);

            // Verify that magic commands are filtered out
            const pythonCode = mockKernel.requestExecute.mock.calls[0][0].code;
            expect(pythonCode).not.toContain('%matplotlib inline');
            expect(pythonCode).not.toContain('%config InlineBackend.figure_format');
            expect(pythonCode).toContain('import matplotlib.pyplot as plt');
        });

        test('should filter out mixed shell commands and Python code', async () => {
            // Create mock code cell with mixed content
            const mockCodeCell = {
                model: {
                    type: 'code',
                    sharedModel: {
                        source: '!pip install scikit-learn\nimport pandas as pd\n!conda install numpy\nimport numpy as np\n%matplotlib inline\nimport matplotlib.pyplot as plt'
                    }
                }
            };

            mockNotebookPanel.content.widgets = [mockCodeCell];

            // Mock successful kernel execution
            const mockFuture = {
                onIOPub: jest.fn(),
                done: Promise.resolve()
            };

            mockKernel.requestExecute.mockReturnValue(mockFuture);

            const expectedOutput = 'pandas==2.0.3\nnumpy==1.24.3\nmatplotlib==3.7.1\nscikit-learn==1.3.0';
            
            mockFuture.onIOPub.mockImplementation((handler) => {
                handler({
                    header: { msg_type: 'stream' },
                    content: { name: 'stdout', text: expectedOutput }
                });
            });

            await generateRequirementsTxt(mockNotebookTracker);

            // Verify filtering behavior
            const pythonCode = mockKernel.requestExecute.mock.calls[0][0].code;
            expect(pythonCode).not.toContain('!pip install scikit-learn');
            expect(pythonCode).not.toContain('!conda install numpy');
            expect(pythonCode).not.toContain('%matplotlib inline');
            expect(pythonCode).toContain('import pandas as pd');
            expect(pythonCode).toContain('import numpy as np');
            expect(pythonCode).toContain('import matplotlib.pyplot as plt');
        });
    });

    describe('Fallback behavior', () => {
        test('should return fallback requirements when no notebook is active', async () => {
            // Create a new mock tracker with null currentWidget
            const mockTrackerWithNullWidget = {
                currentWidget: null
            } as any;

            const result = await generateRequirementsTxt(mockTrackerWithNullWidget);

            expect(result).toBe('');
            expect(console.error).toHaveBeenCalledWith('No notebook is currently active');
        });

        test('should return fallback requirements when kernel is null', async () => {
            // Set kernel to null
            mockSession.kernel = null;

            const result = await generateRequirementsTxt(mockNotebookTracker);

            expect(result).toBe('streamlit>=1.28.0');
            expect(console.error).toHaveBeenCalledWith('No kernel found');
        });

        test('should return fallback requirements when kernel execution fails', async () => {
            // Create mock code cell
            const mockCodeCell = {
                model: {
                    type: 'code',
                    sharedModel: {
                        source: 'import pandas as pd'
                    }
                }
            };

            mockNotebookPanel.content.widgets = [mockCodeCell];

            // Mock kernel execution that throws an error
            const mockFuture = {
                onIOPub: jest.fn(),
                done: Promise.reject(new Error('Kernel execution failed'))
            };

            mockKernel.requestExecute.mockReturnValue(mockFuture);

            const result = await generateRequirementsTxt(mockNotebookTracker);

            expect(result).toBe('streamlit>=1.28.0');
            expect(console.error).toHaveBeenCalledWith('Error generating requirements.txt:', expect.any(Error));
        });

        test('should return fallback requirements when pipreqs execution fails', async () => {
            // Create mock code cell
            const mockCodeCell = {
                model: {
                    type: 'code',
                    sharedModel: {
                        source: 'import pandas as pd'
                    }
                }
            };

            mockNotebookPanel.content.widgets = [mockCodeCell];

            // Mock kernel execution that returns empty result
            const mockFuture = {
                onIOPub: jest.fn(),
                done: Promise.resolve()
            };

            mockKernel.requestExecute.mockReturnValue(mockFuture);

            // Simulate empty output from pipreqs
            mockFuture.onIOPub.mockImplementation((handler) => {
                handler({
                    header: { msg_type: 'stream' },
                    content: { name: 'stdout', text: '' }
                });
            });

            const result = await generateRequirementsTxt(mockNotebookTracker);

            expect(result).toBe('streamlit>=1.28.0');
        });

        test('should return fallback requirements when session is null', async () => {
            // Set session to null
            mockNotebookPanel.sessionContext.session = null;

            const result = await generateRequirementsTxt(mockNotebookTracker);

            expect(result).toBe('streamlit>=1.28.0');
        });
    });

    describe('Error handling and edge cases', () => {
        test('should handle empty code cells', async () => {
            // Create mock code cell with empty source
            const mockCodeCell = {
                model: {
                    type: 'code',
                    sharedModel: {
                        source: ''
                    }
                }
            };

            mockNotebookPanel.content.widgets = [mockCodeCell];

            // Mock successful kernel execution
            const mockFuture = {
                onIOPub: jest.fn(),
                done: Promise.resolve()
            };

            mockKernel.requestExecute.mockReturnValue(mockFuture);

            const expectedOutput = 'streamlit>=1.28.0';
            
            mockFuture.onIOPub.mockImplementation((handler) => {
                handler({
                    header: { msg_type: 'stream' },
                    content: { name: 'stdout', text: expectedOutput }
                });
            });

            const result = await generateRequirementsTxt(mockNotebookTracker);

            expect(result).toBe(expectedOutput);
        });

        test('should handle markdown cells (should be ignored)', async () => {
            // Create mock markdown cell
            const mockMarkdownCell = {
                model: {
                    type: 'markdown',
                    sharedModel: {
                        source: '# This is a markdown cell\nSome text here'
                    }
                }
            };

            // Create mock code cell
            const mockCodeCell = {
                model: {
                    type: 'code',
                    sharedModel: {
                        source: 'import pandas as pd'
                    }
                }
            };

            mockNotebookPanel.content.widgets = [mockMarkdownCell, mockCodeCell];

            // Mock successful kernel execution
            const mockFuture = {
                onIOPub: jest.fn(),
                done: Promise.resolve()
            };

            mockKernel.requestExecute.mockReturnValue(mockFuture);

            const expectedOutput = 'pandas==2.0.3';
            
            mockFuture.onIOPub.mockImplementation((handler) => {
                handler({
                    header: { msg_type: 'stream' },
                    content: { name: 'stdout', text: expectedOutput }
                });
            });

            await generateRequirementsTxt(mockNotebookTracker);

            // Verify that markdown content is not included in the Python code
            const pythonCode = mockKernel.requestExecute.mock.calls[0][0].code;
            expect(pythonCode).not.toContain('# This is a markdown cell');
            expect(pythonCode).not.toContain('Some text here');
            expect(pythonCode).toContain('import pandas as pd');
        });

        test('should handle stderr output from pipreqs', async () => {
            // Create mock code cell
            const mockCodeCell = {
                model: {
                    type: 'code',
                    sharedModel: {
                        source: 'import pandas as pd'
                    }
                }
            };

            mockNotebookPanel.content.widgets = [mockCodeCell];

            // Mock successful kernel execution
            const mockFuture = {
                onIOPub: jest.fn(),
                done: Promise.resolve()
            };

            mockKernel.requestExecute.mockReturnValue(mockFuture);

            // Simulate stderr output (should be logged but not included in result)
            mockFuture.onIOPub.mockImplementation((handler) => {
                // First call with stderr
                handler({
                    header: { msg_type: 'stream' },
                    content: { name: 'stdout', text: 'Log: pipreqs warning: some packages not found' }
                });
                // Second call with actual output
                handler({
                    header: { msg_type: 'stream' },
                    content: { name: 'stdout', text: 'pandas==2.0.3' }
                });
            });

            const result = await generateRequirementsTxt(mockNotebookTracker);

            expect(result).toContain('streamlit>=1.28.0');
        });

        test('should handle special characters in code content', async () => {
            // Create mock code cell with special characters
            const mockCodeCell = {
                model: {
                    type: 'code',
                    sharedModel: {
                        source: 'import pandas as pd\n# This is a comment with "quotes" and \'single quotes\'\ndf = pd.DataFrame({"A": [1, 2, 3]})'
                    }
                }
            };

            mockNotebookPanel.content.widgets = [mockCodeCell];

            // Mock successful kernel execution
            const mockFuture = {
                onIOPub: jest.fn(),
                done: Promise.resolve()
            };

            mockKernel.requestExecute.mockReturnValue(mockFuture);

            const expectedOutput = 'pandas';
            
            mockFuture.onIOPub.mockImplementation((handler) => {
                handler({
                    header: { msg_type: 'stream' },
                    content: { name: 'stdout', text: expectedOutput }
                });
            });

            await generateRequirementsTxt(mockNotebookTracker);

            // Verify that the Python code is properly escaped
            const pythonCode = mockKernel.requestExecute.mock.calls[0][0].code;
            expect(pythonCode).toContain('import pandas as pd');
            expect(pythonCode).toContain('This is a comment with \"quotes\"');
            expect(pythonCode).toContain("'single quotes'");
        });
    });
}); 