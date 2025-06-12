/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { INotebookTracker } from '@jupyterlab/notebook';
import { convertNotebookToStreamlit } from '../../Extensions/AppBuilder/NotebookToStreamlit';
import { saveFileWithKernel } from '../../Extensions/AppBuilder/fileUtils';
import { MarkdownCell } from '@jupyterlab/cells';
import { generateRequirementsTxt } from '../../Extensions/AppBuilder/requirementsUtils';

// Mock the dependencies
jest.mock('@jupyterlab/notebook');
jest.mock('../../Extensions/AppBuilder/fileUtils', () => ({
    saveFileWithKernel: jest.fn().mockResolvedValue(undefined)
}));

describe('NotebookToStreamlit Basic Conversion', () => {
    let mockNotebookTracker: jest.Mocked<INotebookTracker>;
    let mockNotebookPanel: any;

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

        // Mock console.error
        console.error = jest.fn();
    });

    test('should convert a simple notebook with pandas code to streamlit app', async () => {
        await convertNotebookToStreamlit(mockNotebookTracker);
        
        // Verify that saveFileWithKernel was called with correct parameters
        expect(saveFileWithKernel).toHaveBeenCalledWith(
            mockNotebookTracker,
            './app.py',
            expect.stringContaining('import streamlit as st')
        );
        
        // Verify that requirements.txt was created
        expect(saveFileWithKernel).toHaveBeenCalledWith(
            mockNotebookTracker,
            './requirements.txt',
            expect.any(String)
        );
    });

    test('should convert a markdown cells correctly in the streamlit app', async () => {
        // Create a mock MarkdownCell instance with a model getter
        const mockMarkdownCell = Object.create(MarkdownCell.prototype);
        Object.defineProperty(mockMarkdownCell, 'model', {
            get: () => ({
                type: 'markdown',
                sharedModel: {
                    source: '# This is a heading\nSome *italic* text.'
                },
                id: 'markdown-cell-id',
                metadata: {},
                setMetadata: jest.fn(),
                getMetadata: jest.fn().mockReturnValue(true)
            }),
            configurable: true
        });

        mockNotebookPanel.content.widgets.push(mockMarkdownCell);

        await convertNotebookToStreamlit(mockNotebookTracker);

        // Get the code passed to saveFileWithKernel for app.py
        const appPyCall = (saveFileWithKernel as jest.Mock).mock.calls.find(
            call => call[1] === './app.py'
        );
        expect(appPyCall).toBeDefined();
        const generatedCode = appPyCall[2];

        // Check that st.markdown is present with the markdown content
        expect(generatedCode).toContain('st.markdown("""# This is a heading\nSome *italic* text.""")');
    });

    test('should convert a code cell to code in streamlit app', async () => {
        // Create a mock CodeCell instance with a model getter
        const { CodeCell } = require('@jupyterlab/cells');
        const mockCodeCell = Object.create(CodeCell.prototype);
        Object.defineProperty(mockCodeCell, 'model', {
            get: () => ({
                type: 'code',
                sharedModel: {
                    source: 'x = 42\nprint(x)'
                },
                id: 'code-cell-id',
                metadata: {},
                setMetadata: jest.fn(),
                getMetadata: jest.fn().mockReturnValue(true)
            }),
            configurable: true
        });

        // Replace the widgets with just the code cell for clarity
        mockNotebookPanel.content.widgets = [mockCodeCell];

        await convertNotebookToStreamlit(mockNotebookTracker);

        // Get the code passed to saveFileWithKernel for app.py
        const appPyCall = (saveFileWithKernel as jest.Mock).mock.calls.find(
            call => call[1] === './app.py'
        );
        expect(appPyCall).toBeDefined();
        const generatedCode = appPyCall[2];

        // Check that the code cell's content is present in the generated code
        expect(generatedCode).toContain('x = 42');
        expect(generatedCode).toContain('print(x)');
    });

    test('should handle empty code cell', async () => {
        // Create a mock CodeCell instance with an empty source
        const { CodeCell } = require('@jupyterlab/cells');
        const mockEmptyCodeCell = Object.create(CodeCell.prototype);
        Object.defineProperty(mockEmptyCodeCell, 'model', {
            get: () => ({
                type: 'code',
                sharedModel: {
                    source: '' // Empty code cell
                },
                id: 'empty-code-cell-id',
                metadata: {},
                setMetadata: jest.fn(),
                getMetadata: jest.fn().mockReturnValue(true)
            }),
            configurable: true
        });

        // Replace the widgets with just the empty code cell
        mockNotebookPanel.content.widgets = [mockEmptyCodeCell];

        await convertNotebookToStreamlit(mockNotebookTracker);

        // Get the code passed to saveFileWithKernel for app.py
        const appPyCall = (saveFileWithKernel as jest.Mock).mock.calls.find(
            call => call[1] === './app.py'
        );
        expect(appPyCall).toBeDefined();
        const generatedCode = appPyCall[2];

        // The generated code should NOT contain any code from the empty cell
        // It should only have the initial imports and title, but not "# Converting Code Cell"
        expect(generatedCode).not.toContain('# Converting Code Cell');
    });

    test('should generate requirements.txt with correct packages (sklearn and requests) using real implementation', async () => {
        // Create a mock CodeCell instance that imports sklearn and requests
        const { CodeCell } = require('@jupyterlab/cells');
        const mockCodeCell = Object.create(CodeCell.prototype);
        Object.defineProperty(mockCodeCell, 'model', {
            get: () => ({
                type: 'code',
                sharedModel: {
                    source: 'import sklearn\nimport requests'
                },
                id: 'code-cell-id',
                metadata: {},
                setMetadata: jest.fn(),
                getMetadata: jest.fn().mockReturnValue(true)
            }),
            configurable: true
        });

        // Mock kernel and session
        const mockKernel = {
            requestExecute: jest.fn(({ code, silent }) => {
                // Simulate the future object returned by requestExecute
                const future = {
                    _onIOPub: undefined as undefined | ((msg: any) => void),
                    done: Promise.resolve()
                };
                let outputMsg = {
                    header: { msg_type: 'stream' },
                    content: { name: 'stdout', text: 'scikit-learn==1.2.2\nrequests==2.31.0\nstreamlit>=1.28.0\n' }
                };
                Object.defineProperty(future, 'onIOPub', {
                    get() { return this._onIOPub; },
                    set(fn) {
                        this._onIOPub = fn;
                        if (fn) {
                            // Immediately call the handler with the output
                            fn(outputMsg);
                        }
                    },
                    configurable: true
                });
                return future;
            })
        };

        const mockSession = {
            kernel: mockKernel
        };

        // Mock notebook panel and tracker
        const mockNotebookPanel = {
            context: { path: 'test_notebook.ipynb' },
            content: { widgets: [mockCodeCell] },
            sessionContext: { session: mockSession }
        };
        const mockNotebookTracker = {
            currentWidget: mockNotebookPanel
        } as any;

        // Call the real generateRequirementsTxt
        const requirementsContent = await generateRequirementsTxt(mockNotebookTracker);

        // Check that requirements.txt contains scikit-learn and requests
        expect(requirementsContent).toMatch(/scikit-learn/i);
        expect(requirementsContent).toMatch(/requests/i);
        expect(requirementsContent).toMatch(/streamlit/i);
    });

    test('should handle visualization cells', async () => {
        // Create a mock CodeCell instance with matplotlib and plotly visualization code
        const { CodeCell } = require('@jupyterlab/cells');
        const mockMatplotlibCell = Object.create(CodeCell.prototype);
        Object.defineProperty(mockMatplotlibCell, 'model', {
            get: () => ({
                type: 'code',
                sharedModel: {
                    source: 'import matplotlib.pyplot as plt\nplt.plot([1,2,3], [4,5,6])\nplt.show()'
                },
                id: 'matplotlib-cell-id',
                metadata: {},
                setMetadata: jest.fn(),
                getMetadata: jest.fn().mockReturnValue(true)
            }),
            configurable: true
        });

        const mockPlotlyCell = Object.create(CodeCell.prototype);
        Object.defineProperty(mockPlotlyCell, 'model', {
            get: () => ({
                type: 'code',
                sharedModel: {
                    source: 'import plotly.graph_objects as go\nfig = go.Figure()\ndisplay_viz(fig)'
                },
                id: 'plotly-cell-id',
                metadata: {},
                setMetadata: jest.fn(),
                getMetadata: jest.fn().mockReturnValue(true)
            }),
            configurable: true
        });

        // Replace the widgets with both visualization cells
        mockNotebookPanel.content.widgets = [mockMatplotlibCell, mockPlotlyCell];

        await convertNotebookToStreamlit(mockNotebookTracker);

        // Get the code passed to saveFileWithKernel for app.py
        const appPyCall = (saveFileWithKernel as jest.Mock).mock.calls.find(
            call => call[1] === './app.py'
        );
        expect(appPyCall).toBeDefined();
        const generatedCode = appPyCall[2];

        // Check that the generated code contains the display_viz function and calls
        expect(generatedCode).toContain('def display_viz(fig):');
        // For matplotlib
        expect(generatedCode).toContain('st.pyplot(fig)');
        // For plotly
        expect(generatedCode).toContain('st.plotly_chart(fig)');
        // The code cell content should be present
        expect(generatedCode).toContain('plt.plot([1,2,3], [4,5,6])');
        expect(generatedCode).toContain('display_viz(fig)');
    });

    test('should handle dataframe display', async () => {
        // Create a mock CodeCell instance that creates and displays a DataFrame
        const { CodeCell } = require('@jupyterlab/cells');
        const mockDataFrameCell = Object.create(CodeCell.prototype);
        Object.defineProperty(mockDataFrameCell, 'model', {
            get: () => ({
                type: 'code',
                sharedModel: {
                    source: 'import pandas as pd\ndf = pd.DataFrame({"A": [1, 2, 3]})\ndf'
                },
                id: 'dataframe-cell-id',
                metadata: {},
                setMetadata: jest.fn(),
                getMetadata: jest.fn().mockReturnValue(true)
            }),
            configurable: true
        });

        // Replace the widgets with just the dataframe cell
        mockNotebookPanel.content.widgets = [mockDataFrameCell];

        await convertNotebookToStreamlit(mockNotebookTracker);

        // Get the code passed to saveFileWithKernel for app.py
        const appPyCall = (saveFileWithKernel as jest.Mock).mock.calls.find(
            call => call[1] === './app.py'
        );
        expect(appPyCall).toBeDefined();
        const generatedCode = appPyCall[2];

        // Check that the DataFrame creation and display code is present
        expect(generatedCode).toContain('import pandas as pd');
        expect(generatedCode).toContain('df = pd.DataFrame({"A": [1, 2, 3]})');
        // The last line 'df' should be present, which in Streamlit will display the DataFrame
        expect(generatedCode).toMatch(/df\s*$/m);
    });

    test('should handle newlines in print statements correctly', async () => {
        // Create a mock CodeCell instance with a print statement containing a newline
        const { CodeCell } = require('@jupyterlab/cells');
        const mockPrintCell = Object.create(CodeCell.prototype);
        Object.defineProperty(mockPrintCell, 'model', {
            get: () => ({
                type: 'code',
                sharedModel: {
                    source: 'print("a\\nb")'
                },
                id: 'print-cell-id',
                metadata: {},
                setMetadata: jest.fn(),
                getMetadata: jest.fn().mockReturnValue(true)
            }),
            configurable: true
        });

        // Replace the widgets with just the print cell
        mockNotebookPanel.content.widgets = [mockPrintCell];

        await convertNotebookToStreamlit(mockNotebookTracker);

        // Get the code passed to saveFileWithKernel for app.py
        const appPyCall = (saveFileWithKernel as jest.Mock).mock.calls.find(
            call => call[1] === './app.py'
        );
        expect(appPyCall).toBeDefined();
        const generatedCode = appPyCall[2];

        // Check that the print statement with the newline is present in the generated code
        expect(generatedCode).toContain('print("a\\nb")');
    });

    test('should convert a simple notebook with one code cell', async () => {
        // Create a mock CodeCell instance with a simple print statement
        const { CodeCell } = require('@jupyterlab/cells');
        const mockSimpleCodeCell = Object.create(CodeCell.prototype);
        Object.defineProperty(mockSimpleCodeCell, 'model', {
            get: () => ({
                type: 'code',
                sharedModel: {
                    source: 'print("hello world")'
                },
                id: 'simple-code-cell-id',
                metadata: {},
                setMetadata: jest.fn(),
                getMetadata: jest.fn().mockReturnValue(true)
            }),
            configurable: true
        });

        // Replace the widgets with just the simple code cell
        mockNotebookPanel.content.widgets = [mockSimpleCodeCell];

        await convertNotebookToStreamlit(mockNotebookTracker);

        // Get the code passed to saveFileWithKernel for app.py
        const appPyCall = (saveFileWithKernel as jest.Mock).mock.calls.find(
            call => call[1] === './app.py'
        );
        expect(appPyCall).toBeDefined();
        const generatedCode = appPyCall[2];

        // Check that the code cell's content is present in the generated code
        expect(generatedCode).toContain('print("hello world")');
    });
}); 