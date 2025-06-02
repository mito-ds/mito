/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react';
import { NotebookFooter } from '../../Extensions/NotebookFooter/NotebookFooter';
import { NotebookActions } from '@jupyterlab/notebook';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { COMMAND_MITO_AI_SEND_AGENT_MESSAGE, COMMAND_MITO_AI_OPEN_CHAT } from '../../commands';

// Mock NotebookActions
jest.mock('@jupyterlab/notebook', () => ({
    NotebookActions: {
        insertBelow: jest.fn(),
        changeCellType: jest.fn(),
        focusActiveCell: jest.fn()
    }
}));

// Mock the icons
jest.mock('../../icons/NotebookFooter/CodeIcon', () => {
    return {
        __esModule: true,
        default: jest.fn(() => <div data-testid="code-icon">Code Icon</div>)
    };
});

jest.mock('../../icons/NotebookFooter/TextIcon', () => {
    return {
        __esModule: true,
        default: jest.fn(() => <div data-testid="text-icon">Text Icon</div>)
    };
});

// Mock LoadingCircle component
jest.mock('../../components/LoadingCircle', () => {
    return {
        __esModule: true,
        default: jest.fn(() => <div data-testid="loading-circle">Loading...</div>)
    };
});

// Create mock notebook
const createMockNotebook = (widgetCount = 3) => {
    const mockWidgets = Array(widgetCount).fill(null).map((_, index) => ({
        id: `cell-${index}`,
        model: { type: 'code' }
    }));

    const mockActiveCell = {
        model: { type: 'code' }
    };

    const mockCells = {
        changed: {
            connect: jest.fn(),
            disconnect: jest.fn()
        }
    };

    return {
        widgets: mockWidgets,
        activeCellIndex: 0,
        activeCell: mockActiveCell,
        model: {
            cells: mockCells,
            isDisposed: false
        }
    };
};

// Create mock app
const createMockApp = () => ({
    commands: {
        execute: jest.fn().mockResolvedValue(undefined)
    }
}) as unknown as JupyterFrontEnd;

// Create base props for the component
const createMockProps = (overrides = {}) => ({
    notebook: createMockNotebook(),
    app: createMockApp(),
    ...overrides
});

// Helper function to render the component
const renderNotebookFooter = (props = {}) => {
    cleanup();
    return render(<NotebookFooter {...createMockProps(props)} />);
};

const PLACEHOLDER_TEXT = 'What analysis can I help you with?';

describe('NotebookFooter Component', () => {
    beforeEach(() => {
        cleanup();
        jest.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    describe('Initial Rendering', () => {
        it('renders the footer with correct initial state', () => {
            renderNotebookFooter();

            // Check for input field
            const input = screen.getByPlaceholderText(PLACEHOLDER_TEXT);
            expect(input).toBeInTheDocument();
            expect(input).toHaveValue('');

            // Check for submit button
            const submitButton = screen.getByText('▶');
            expect(submitButton).toBeInTheDocument();

            // Check for Python button
            const pythonButton = screen.getByText('Python');
            expect(pythonButton).toBeInTheDocument();

            // Check for Text button
            const textButton = screen.getByText('Text');
            expect(textButton).toBeInTheDocument();

            // Check for cell count display
            expect(screen.getByText('3 cells')).toBeInTheDocument();

            // Check for the sparkle icon when not generating
            expect(screen.getByText('✦')).toBeInTheDocument();
        });

        it('displays the correct cell count from notebook widgets', () => {
            renderNotebookFooter({
                notebook: createMockNotebook(5)
            });

            expect(screen.getByText('5 cells')).toBeInTheDocument();
        });

        it('renders icons for Python and Text buttons', () => {
            renderNotebookFooter();

            expect(screen.getByTestId('code-icon')).toBeInTheDocument();
            expect(screen.getByTestId('text-icon')).toBeInTheDocument();
        });
    });

    describe('Input Handling', () => {
        it('updates input value when user types', () => {
            renderNotebookFooter();

            const input = screen.getByPlaceholderText(PLACEHOLDER_TEXT);
            
            fireEvent.change(input, { target: { value: 'Create a pandas dataframe' } });
            
            expect(input).toHaveValue('Create a pandas dataframe');
        });

        it('submits message when Enter key is pressed', async () => {
            const mockApp = createMockApp();
            renderNotebookFooter({ app: mockApp });

            const input = screen.getByPlaceholderText(PLACEHOLDER_TEXT);
            
            // Type a message
            fireEvent.change(input, { target: { value: 'Create a pandas dataframe' } });
            
            // Press Enter
            await act(async () => {
                fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
            });

            // Check that commands were executed
            expect(mockApp.commands.execute).toHaveBeenCalledWith(COMMAND_MITO_AI_OPEN_CHAT, { focusChatInput: false });
            expect(mockApp.commands.execute).toHaveBeenCalledWith(COMMAND_MITO_AI_SEND_AGENT_MESSAGE, { input: 'Create a pandas dataframe' });
        });

        it('does not submit when Shift+Enter is pressed', async () => {
            const mockApp = createMockApp();
            renderNotebookFooter({ app: mockApp });

            const input = screen.getByPlaceholderText(PLACEHOLDER_TEXT);
            
            fireEvent.change(input, { target: { value: 'Test message' } });
            
            // Press Shift+Enter
            fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: true });

            // Commands should not be executed
            expect(mockApp.commands.execute).not.toHaveBeenCalled();
        });

        it('does not submit empty messages', async () => {
            const mockApp = createMockApp();
            renderNotebookFooter({ app: mockApp });

            const input = screen.getByPlaceholderText(PLACEHOLDER_TEXT);
            
            // Try to submit empty message
            await act(async () => {
                fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
            });

            expect(mockApp.commands.execute).not.toHaveBeenCalled();
        });

        it('trims whitespace from messages before submitting', async () => {
            const mockApp = createMockApp();
            renderNotebookFooter({ app: mockApp });

            const input = screen.getByPlaceholderText(PLACEHOLDER_TEXT);
            
            fireEvent.change(input, { target: { value: '  Create a dataframe  ' } });
            
            await act(async () => {
                fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
            });

            expect(mockApp.commands.execute).toHaveBeenCalledWith(COMMAND_MITO_AI_SEND_AGENT_MESSAGE, { input: 'Create a dataframe' });
        });
    });

    describe('Submit Button', () => {
        it('submits message when submit button is clicked', async () => {
            const mockApp = createMockApp();
            renderNotebookFooter({ app: mockApp });

            const input = screen.getByPlaceholderText(PLACEHOLDER_TEXT);
            const submitButton = screen.getByText('▶');
            
            fireEvent.change(input, { target: { value: 'Create a pandas dataframe' } });
            
            await act(async () => {
                fireEvent.click(submitButton);
            });

            expect(mockApp.commands.execute).toHaveBeenCalledWith(COMMAND_MITO_AI_OPEN_CHAT, { focusChatInput: false });
            expect(mockApp.commands.execute).toHaveBeenCalledWith(COMMAND_MITO_AI_SEND_AGENT_MESSAGE, { input: 'Create a pandas dataframe' });
        });

        it('opens chat and sends agent message in correct order', async () => {
            const mockApp = createMockApp();
            renderNotebookFooter({ app: mockApp });

            const input = screen.getByPlaceholderText(PLACEHOLDER_TEXT);
            
            fireEvent.change(input, { target: { value: 'Test message' } });
            
            await act(async () => {
                fireEvent.click(screen.getByText('▶'));
            });

            // Verify commands were called in the correct order
            const executeCallOrder = (mockApp.commands.execute as jest.Mock).mock.calls;
            expect(executeCallOrder[0]).toEqual([COMMAND_MITO_AI_OPEN_CHAT, { focusChatInput: false }]);
            expect(executeCallOrder[1]).toEqual([COMMAND_MITO_AI_SEND_AGENT_MESSAGE, { input: 'Test message' }]);
        });
    });

    describe('Loading State', () => {
        it('shows loading state during message submission', async () => {
            // Mock app.commands.execute to return a promise that we can control
            let resolvePromise: () => void;
            const mockPromise = new Promise<void>((resolve) => {
                resolvePromise = resolve;
            });

            const mockApp = {
                commands: {
                    execute: jest.fn().mockReturnValue(mockPromise)
                }
            } as unknown as JupyterFrontEnd;

            renderNotebookFooter({ app: mockApp });

            const input = screen.getByPlaceholderText(PLACEHOLDER_TEXT);
            
            fireEvent.change(input, { target: { value: 'Test message' } });
            
            // Submit the message
            act(() => {
                fireEvent.click(screen.getByText('▶'));
            });

            // Check loading state
            await waitFor(() => {
                expect(screen.getByPlaceholderText('Generating notebook...')).toBeInTheDocument();
                expect(screen.getByTestId('loading-circle')).toBeInTheDocument();
            });

            // Resolve the promise to end loading state
            act(() => {
                resolvePromise!();
            });

            // Wait for loading state to end
            await waitFor(() => {
                expect(screen.queryByPlaceholderText('Generating notebook...')).not.toBeInTheDocument();
                expect(screen.getByPlaceholderText(PLACEHOLDER_TEXT)).toBeInTheDocument();
            });
        });

        it('clears input value immediately when submitting', async () => {
            const mockApp = createMockApp();
            renderNotebookFooter({ app: mockApp });

            const input = screen.getByPlaceholderText(PLACEHOLDER_TEXT);
            
            fireEvent.change(input, { target: { value: 'Test message' } });
            
            await act(async () => {
                fireEvent.click(screen.getByText('▶'));
            });

            // Input should be cleared
            expect(input).toHaveValue('');
        });

        it('disables input field during message submission', async () => {
            // Mock app.commands.execute to return a promise that we can control
            let resolvePromise: () => void;
            const mockPromise = new Promise<void>((resolve) => {
                resolvePromise = resolve;
            });

            const mockApp = {
                commands: {
                    execute: jest.fn().mockReturnValue(mockPromise)
                }
            } as unknown as JupyterFrontEnd;

            renderNotebookFooter({ app: mockApp });

            const input = screen.getByPlaceholderText(PLACEHOLDER_TEXT);
            
            // Initially, input should not be disabled
            expect(input).not.toBeDisabled();
            
            fireEvent.change(input, { target: { value: 'Test message' } });
            
            // Submit the message
            act(() => {
                fireEvent.click(screen.getByText('▶'));
            });

            // Input should be disabled during loading
            await waitFor(() => {
                expect(input).toBeDisabled();
            });

            // Resolve the promise to end loading state
            act(() => {
                resolvePromise!();
            });

            // Input should be enabled again after loading completes
            await waitFor(() => {
                expect(input).not.toBeDisabled();
            });
        });
    });

    describe('Cell Creation', () => {
        it('creates a new code cell when Python button is clicked', () => {
            const mockNotebook = createMockNotebook();
            renderNotebookFooter({ notebook: mockNotebook });

            const pythonButton = screen.getByText('Python');
            
            fireEvent.click(pythonButton);

            // Check that NotebookActions.insertBelow was called
            expect(NotebookActions.insertBelow).toHaveBeenCalledWith(mockNotebook);
            expect(NotebookActions.focusActiveCell).toHaveBeenCalledWith(mockNotebook);

            // Check that the last action is updated
            expect(screen.getByText('3 cells • Added Python cell')).toBeInTheDocument();
        });

        it('creates a new markdown cell when Text button is clicked', () => {
            const mockNotebook = createMockNotebook();
            renderNotebookFooter({ notebook: mockNotebook });

            const textButton = screen.getByText('Text');
            
            fireEvent.click(textButton);

            // Check that NotebookActions were called
            expect(NotebookActions.insertBelow).toHaveBeenCalledWith(mockNotebook);
            expect(NotebookActions.changeCellType).toHaveBeenCalledWith(mockNotebook, 'markdown');
            expect(NotebookActions.focusActiveCell).toHaveBeenCalledWith(mockNotebook);

            // Check that the last action is updated
            expect(screen.getByText('3 cells • Added Text cell')).toBeInTheDocument();
        });

        it('sets active cell index before adding new cell when notebook has widgets', () => {
            const mockNotebook = createMockNotebook(5);
            renderNotebookFooter({ notebook: mockNotebook });

            fireEvent.click(screen.getByText('Python'));

            // Should set active cell index to last cell before inserting
            expect(mockNotebook.activeCellIndex).toBe(4); // length - 1
        });

        it('handles empty notebook when adding cells', () => {
            const mockNotebook = createMockNotebook(0);
            renderNotebookFooter({ notebook: mockNotebook });

            fireEvent.click(screen.getByText('Python'));

            // Should not set active cell index for empty notebook
            expect(mockNotebook.activeCellIndex).toBe(0);
            expect(NotebookActions.insertBelow).toHaveBeenCalledWith(mockNotebook);
        });

        it('only changes cell type for markdown cells, not code cells', () => {
            const mockNotebook = createMockNotebook();
            renderNotebookFooter({ notebook: mockNotebook });

            // Click Python button (should not change cell type)
            fireEvent.click(screen.getByText('Python'));
            expect(NotebookActions.changeCellType).not.toHaveBeenCalled();

            jest.clearAllMocks();

            // Click Text button (should change cell type)
            fireEvent.click(screen.getByText('Text'));
            expect(NotebookActions.changeCellType).toHaveBeenCalledWith(mockNotebook, 'markdown');
        });
    });

    describe('Cell Count Updates', () => {
        it('updates cell count when notebook cells change', () => {
            const mockNotebook = createMockNotebook(3);
            renderNotebookFooter({ notebook: mockNotebook });

            // Initially shows 3 cells
            expect(screen.getByText('3 cells')).toBeInTheDocument();

            // Simulate notebook cell change
            mockNotebook.widgets.push({ id: 'new-cell', model: { type: 'code' } });
            
            // Trigger the callback that would be called by Jupyter
            const connectCall = mockNotebook.model.cells.changed.connect.mock.calls[0];
            const updateCallback = connectCall[0];
            
            act(() => {
                updateCallback();
            });

            // Should show updated cell count
            expect(screen.getByText('4 cells')).toBeInTheDocument();
        });

        it('handles notebook without model gracefully', () => {
            const mockNotebook = {
                widgets: [{ id: 'cell-1' }],
                model: null
            };

            // Should not throw an error
            expect(() => {
                renderNotebookFooter({ notebook: mockNotebook });
            }).not.toThrow();
        });

        it('disconnects cell change listener on cleanup', () => {
            const mockNotebook = createMockNotebook();
            const { unmount } = renderNotebookFooter({ notebook: mockNotebook });

            // Component should have connected to cell changes
            expect(mockNotebook.model.cells.changed.connect).toHaveBeenCalled();

            // Unmount the component
            unmount();

            // Should have disconnected the listener
            expect(mockNotebook.model.cells.changed.disconnect).toHaveBeenCalled();
        });

        it('does not disconnect if model is disposed', () => {
            const mockNotebook = createMockNotebook();
            mockNotebook.model.isDisposed = true;

            const { unmount } = renderNotebookFooter({ notebook: mockNotebook });
            
            unmount();

            // Should not try to disconnect if model is disposed
            expect(mockNotebook.model.cells.changed.disconnect).not.toHaveBeenCalled();
        });
    });

    describe('Event Handling', () => {
        it('stops propagation on input events', () => {
            renderNotebookFooter();

            const input = screen.getByPlaceholderText(PLACEHOLDER_TEXT);

            // Spy on stopPropagation
            const stopPropagationSpy = jest.spyOn(Event.prototype, 'stopPropagation');

            // Fire events
            fireEvent.change(input, { target: { value: 'test' } });
            fireEvent.keyDown(input, { key: 'a' });
            fireEvent.keyPress(input, { key: 'a' });
            fireEvent.focus(input);
            fireEvent.blur(input);

            // Verify stopPropagation was called
            expect(stopPropagationSpy).toHaveBeenCalled();

            stopPropagationSpy.mockRestore();
        });

        it('stops propagation on button mouse down events', () => {
            renderNotebookFooter();

            const submitButton = screen.getByText('▶');
            const pythonButton = screen.getByText('Python');
            const textButton = screen.getByText('Text');

            const stopPropagationSpy = jest.spyOn(Event.prototype, 'stopPropagation');

            // Fire mousedown events
            fireEvent.mouseDown(submitButton);
            fireEvent.mouseDown(pythonButton);
            fireEvent.mouseDown(textButton);

            expect(stopPropagationSpy).toHaveBeenCalled();

            stopPropagationSpy.mockRestore();
        });
    });
});
