/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { CodeCell } from '@jupyterlab/cells';
import { INotebookTracker } from '@jupyterlab/notebook';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import '@testing-library/jest-dom'
import { render, fireEvent, screen, createEvent, act, within } from '@testing-library/react'
import React from 'react';
import ChatInput from '../../Extensions/AiChat/ChatMessage/ChatInput';
import { Variable } from '../../Extensions/ContextManager/VariableInspector';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { AgentExecutionStatus } from '../../Extensions/AiChat/ChatTaskpane';

// Add import for RestAPI to mock getRules
// import * as RestAPI from '../../RestAPI'; Jest will use the mock below

// Mock the RestAPI functions
jest.mock('../../restAPI/RestAPI', () => ({
  ...jest.requireActual('../../restAPI/RestAPI'), // Import and retain default behavior
  getRules: jest.fn().mockResolvedValue(['Data Analysis', 'Visualization', 'Machine Learning']),
  getDatabaseConnections: jest.fn().mockResolvedValue({})
}));

// Mock the PythonCode component
jest.mock('../../Extensions/AiChat/ChatMessage/PythonCode', () => {
    return {
        __esModule: true,
        default: jest.fn(({ code }) => (
            <div data-testid="python-code">{code}</div>
        ))
    };
});

// Mock data for test cases
const TEST_CELL_CODE = 'print("Hello World")';
const EMPTY_CELL_ID = 'empty-cell-id';
const TEST_CELL_ID = 'test-cell-id';

// Sample variables for testing
const MOCK_VARIABLES: Variable[] = [
  { variable_name: 'df', type: "<class 'pandas.core.frame.DataFrame'>", value: "DataFrame with 10 rows" },
  { variable_name: 'x', type: "<class 'int'>", value: 42 },
  { variable_name: 'y', type: "<class 'float'>", value: 3.14 }
];

// Sample rules for testing
const MOCK_RULES = ['Data Analysis', 'Visualization', 'Machine Learning'];

// Mock cell with code
const createMockCell = (code: string, cellId: string) => ({
    model: {
        value: { text: code },
        id: cellId
    },
    editor: {
        model: {
            value: { text: code }
        }
    }
});

// Mock notebook utils
jest.mock('../../utils/notebook', () => ({
    getActiveCellID: jest.fn((id) => id === EMPTY_CELL_ID ? EMPTY_CELL_ID : TEST_CELL_ID),
    getCellCodeByID: jest.fn((id) => id === EMPTY_CELL_ID ? '' : TEST_CELL_CODE),
    getActiveCellCode: jest.fn(() => TEST_CELL_CODE)
}));

// Base props for ChatInput component
const createMockProps = (overrides = {}) => ({
    app: {
        commands: {
            execute: jest.fn()
        }
    } as unknown as JupyterFrontEnd,
    initialContent: '',
    placeholder: 'Type your message...',
    onSave: jest.fn(),
    isEditing: false,
    contextManager: {
        variables: MOCK_VARIABLES,
        setVariables: jest.fn(),
        files: [],
        setFiles: jest.fn()
    },
    notebookTracker: {
        activeCellChanged: {
            connect: jest.fn(),
            disconnect: jest.fn()
        },
        activeCell: createMockCell(TEST_CELL_CODE, TEST_CELL_ID) as unknown as CodeCell,
        currentWidget: {
            content: {
                activeCell: createMockCell(TEST_CELL_CODE, TEST_CELL_ID) as unknown as CodeCell,
                widgets: [createMockCell(TEST_CELL_CODE, TEST_CELL_ID) as unknown as CodeCell]
            }
        }
    } as unknown as INotebookTracker,
    renderMimeRegistry: {
        createRenderer: jest.fn().mockReturnValue({
            renderModel: jest.fn(),
            node: document.createElement('div')
        }),
        sanitizer: { sanitize: jest.fn() }
    } as unknown as IRenderMimeRegistry,
    displayActiveCellCode: true,
    agentModeEnabled: false,
    agentExecutionStatus: 'idle' as AgentExecutionStatus,
    ...overrides
});

// Helper functions for common test operations
const renderChatInput = (props = {}) => {
    return render(<ChatInput {...createMockProps(props)} />);
};

const typeInTextarea = (textarea: HTMLElement, value: string) => {
    fireEvent.focus(textarea);
    fireEvent.change(textarea, { target: { value } });
};

describe('ChatInput Component', () => {
    let textarea: HTMLElement;
    let onSaveMock: jest.Mock;

    beforeEach(() => {
        // Clear any previous renders
        document.body.innerHTML = '';
        
        // Create fresh mocks for each test
        onSaveMock = jest.fn();
        
        // Render with default props
        renderChatInput({ onSave: onSaveMock });
        
        // Get the textarea element that's used in most tests
        textarea = screen.getByRole('textbox');
    });

    describe('Keyboard Interactions', () => {
        it('submits message and clears input when Enter key is pressed', () => {
            const testMessage = 'Hello, this is a test message';
            
            // Type content in the textarea
            typeInTextarea(textarea, testMessage);
            
            // Simulate pressing Enter
            fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });
            
            // Verify onSave was called with the input content
            expect(onSaveMock).toHaveBeenCalledWith(testMessage, undefined, [
                { type: 'active_cell', value: 'Active Cell', display: 'Active Cell' }
            ]);
            
            // Verify the input was cleared
            expect(textarea).toHaveValue('');
        });

        it('allows new line and does not submit message on Shift+Enter', () => {
            const testMessage = 'Line 1';
            
            // Type content in the textarea
            typeInTextarea(textarea, testMessage);
            
            // Create a keydown event for Shift+Enter
            const shiftEnterEvent = createEvent.keyDown(textarea, { 
                key: 'Enter', 
                code: 'Enter', 
                shiftKey: true 
            });
            
            // Fire the event and check if preventDefault was called
            fireEvent(textarea, shiftEnterEvent);
            expect(shiftEnterEvent.defaultPrevented).toBe(false);
            
            // Verify the input was not cleared
            expect(textarea).toHaveValue(testMessage);
            
            // Verify onSave was not called
            expect(onSaveMock).not.toHaveBeenCalled();
            
            // Manually simulate adding a new line (as the browser would do)
            // since JSDOM doesn't automatically do this
            typeInTextarea(textarea, `${testMessage}\nLine 2`);
            
            // Verify the new line is in the textarea
            expect(textarea).toHaveValue(`${testMessage}\nLine 2`);
            
            // Verify onSave was still not called
            expect(onSaveMock).not.toHaveBeenCalled();
        });

        it('prevents typing when agent is working', () => {
            // Clear and re-render with agent working status
            document.body.innerHTML = '';
            renderChatInput({ agentExecutionStatus: 'working' });
            
            const workingTextarea = screen.getByRole('textbox');
            
            // Verify the textarea is disabled
            expect(workingTextarea).toBeDisabled();
            
            // Try to press Enter key
            const enterEvent = createEvent.keyDown(workingTextarea, { 
                key: 'Enter', 
                code: 'Enter' 
            });
            
            fireEvent(workingTextarea, enterEvent);
            
            // Verify preventDefault was called (input was blocked)
            expect(enterEvent.defaultPrevented).toBe(true);
            
            // Verify onSave was not called
            expect(onSaveMock).not.toHaveBeenCalled();
        });

        it('prevents typing when agent is stopping', () => {
            // Clear and re-render with agent stopping status
            document.body.innerHTML = '';
            renderChatInput({ agentExecutionStatus: 'stopping' });
            
            const stoppingTextarea = screen.getByRole('textbox');
            
            // Verify the textarea is disabled
            expect(stoppingTextarea).toBeDisabled();
            
            // Try to press Enter key
            const enterEvent = createEvent.keyDown(stoppingTextarea, { 
                key: 'Enter', 
                code: 'Enter' 
            });
            
            fireEvent(stoppingTextarea, enterEvent);
            
            // Verify preventDefault was called (input was blocked)
            expect(enterEvent.defaultPrevented).toBe(true);
            
            // Verify onSave was not called
            expect(onSaveMock).not.toHaveBeenCalled();
        });

        it('allows typing when agent is idle', () => {
            // Clear and re-render with agent idle status
            document.body.innerHTML = '';
            const idleSaveMock = jest.fn();
            renderChatInput({ agentExecutionStatus: 'idle', onSave: idleSaveMock });
            
            const idleTextarea = screen.getByRole('textbox');
            
            // Verify the textarea is enabled
            expect(idleTextarea).not.toBeDisabled();
            
            // Type in the textarea
            const testMessage = 'This should be typed';
            typeInTextarea(idleTextarea, testMessage);
            
            // Verify the textarea value contains the typed text
            expect(idleTextarea).toHaveValue(testMessage);
            
            // Press Enter key
            fireEvent.keyDown(idleTextarea, { key: 'Enter', code: 'Enter' });
            
            // Verify onSave was called
            expect(idleSaveMock).toHaveBeenCalledWith(testMessage, undefined, [
                { type: 'active_cell', value: 'Active Cell', display: 'Active Cell' }
            ]);
        });
    });

    describe('Edit Mode', () => {
        it('shows edit buttons only when isEditing is true', () => {
            // First render with isEditing=false (already done in beforeEach)
            
            // Edit buttons should not be in the document
            expect(screen.queryByText('Save')).not.toBeInTheDocument();
            expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
            
            // Clear and re-render with isEditing=true
            document.body.innerHTML = '';
            renderChatInput({ isEditing: true });
            
            // Edit buttons should now be in the document
            expect(screen.getByText('Save')).toBeInTheDocument();
            expect(screen.getByText('Cancel')).toBeInTheDocument();
        });

        it('calls onSave with current input when Save button is clicked', () => {
            // Clear and re-render with edit mode props
            document.body.innerHTML = '';
            const initialContent = 'Initial content';
            const editSaveMock = jest.fn();
            
            renderChatInput({ 
                isEditing: true, 
                initialContent: initialContent,
                onSave: editSaveMock 
            });
            
            const editTextarea = screen.getByRole('textbox');
            expect(editTextarea).toHaveValue(initialContent);
            
            // Update the text in the textarea
            const updatedContent = 'Updated content';
            typeInTextarea(editTextarea, updatedContent);
            
            // Click the Save button
            const saveButton = screen.getByText('Save');
            fireEvent.click(saveButton);
            
            // Verify onSave was called with the updated content
            expect(editSaveMock).toHaveBeenCalledWith(updatedContent, undefined, [
                { type: 'active_cell', value: 'Active Cell', display: 'Active Cell' }
            ]);
        });

        it('calls onCancel when Cancel button is clicked', () => {
            // Clear and re-render with edit mode props
            document.body.innerHTML = '';
            const onCancelMock = jest.fn();
            
            renderChatInput({ 
                isEditing: true, 
                onCancel: onCancelMock 
            });
            
            // Click the Cancel button
            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);
            
            // Verify onCancel was called
            expect(onCancelMock).toHaveBeenCalled();
        });
    });

    describe('Variable Dropdown', () => {
        it('shows dropdown when @ character is typed', async () => {
            // Initially, dropdown should not be visible
            expect(screen.queryByTestId('chat-dropdown')).not.toBeInTheDocument();
            
            // Type @ character in textarea
            await act(async () => {
                typeInTextarea(textarea, '@');
            });
            
            // Dropdown should become visible
            expect(screen.getByTestId('chat-dropdown')).toBeInTheDocument();
            expect(screen.getByTestId('chat-dropdown-list')).toBeInTheDocument();
            
            // Check for variable names in the dropdown
            MOCK_VARIABLES.forEach(variable => {
                const variableElement = screen.getByTestId(`chat-dropdown-item-name-${variable.variable_name}`);
                expect(variableElement).toBeInTheDocument();
                expect(variableElement).toHaveTextContent(variable.variable_name);
            });
        });
        
        it('filters dropdown options based on text after @', async () => {
            // Type @d in textarea to filter for variables starting with 'd'
            await act(async () => {
                typeInTextarea(textarea, '@d');
            });
            
            // Wait for the dropdown to update
            expect(screen.getByTestId('chat-dropdown')).toBeInTheDocument();
            
            // Should show 'df' variable
            expect(screen.getByTestId('chat-dropdown-item-name-df')).toBeInTheDocument();
            
            // Should not show other variables
            expect(screen.queryByTestId('chat-dropdown-item-name-x')).not.toBeInTheDocument();
            expect(screen.queryByTestId('chat-dropdown-item-name-y')).not.toBeInTheDocument();
        });
        
        it('selects variable when clicked in dropdown', async () => {
            // Type @ character in textarea
            await act(async () => {
                typeInTextarea(textarea, '@');
            });
            
            // Find and click the dropdown item for 'df'
            const dfItem = screen.getByTestId('chat-dropdown-item-df');
            expect(dfItem).toBeInTheDocument();
            
            await act(async () => {
                fireEvent.click(dfItem);
            });
            
            // After clicking, dropdown should be closed
            expect(screen.queryByTestId('chat-dropdown')).not.toBeInTheDocument();
            
            // Variable should be inserted with backticks
            expect(textarea).toHaveValue('`df`');
        });
    });

    describe('Rules Dropdown', () => {
        beforeEach(() => {
            // Clear the DOM between tests
            document.body.innerHTML = '';
        });

        afterEach(() => {
            // jest.restoreAllMocks(); // Not needed if mocks are cleared correctly or scoped
            jest.clearAllMocks(); // Clear all mocks after each test
        });

        it('shows rules in dropdown when @ character is typed', async () => {
            // Clear and re-render to ensure our mock is used
            document.body.innerHTML = '';
            
            await act(async () => {
                renderChatInput();
            });
            
            const textarea = screen.getByRole('textbox');
            
            // Type @ character in textarea
            await act(async () => {
                typeInTextarea(textarea, '@');
            });
            
            // Dropdown should become visible
            expect(screen.getByTestId('chat-dropdown')).toBeInTheDocument();
            
            // Check for rules in the dropdown
            for (const rule of MOCK_RULES) {
                const ruleElement = screen.getByText(rule);
                expect(ruleElement).toBeInTheDocument();
            }
        });
        
        it('filters rules based on text after @', async () => {
            // Clear and re-render to ensure our mock is used
            document.body.innerHTML = '';
            
            await act(async () => {
                renderChatInput();
            });
            
            const textarea = screen.getByRole('textbox');
            
            // Type @V to filter for rules starting with 'V'
            await act(async () => {
                typeInTextarea(textarea, '@V');
            });
            
            // Wait for the dropdown to update
            expect(screen.getByTestId('chat-dropdown')).toBeInTheDocument();
            
            // Should show 'Visualization' rule
            expect(screen.getByText('Visualization')).toBeInTheDocument();
            
            // Should not show other rules
            expect(screen.queryByText('Data Analysis')).not.toBeInTheDocument();
            expect(screen.queryByText('Machine Learning')).not.toBeInTheDocument();
        });
        
        it('selects rule when clicked in dropdown', async () => {
            // Clear and re-render to ensure our mock is used
            document.body.innerHTML = '';
            
            await act(async () => {
                renderChatInput();
            });
            
            const textarea = screen.getByRole('textbox');
            
            // Type @ character in textarea
            await act(async () => {
                typeInTextarea(textarea, '@');
            });
            
            // Find and click the rule 'Data Analysis'
            expect(screen.getByTestId('chat-dropdown-list')).toBeInTheDocument();
            const ruleItem = screen.getByText('Data Analysis');
            
            // Click the rule item
            fireEvent.click(ruleItem);
            
            // After clicking, dropdown should be closed
            expect(screen.queryByTestId('chat-dropdown')).not.toBeInTheDocument();
            
            // Rule should be inserted with backticks
            expect(textarea).toHaveValue('Data Analysis');
            
            // Wait for the SelectedContextContainer to appear
            const selectedContextContainers = await screen.findAllByTestId('selected-context-container');
            expect(selectedContextContainers.length).toBeGreaterThan(0);
            
            // Find the container with the specific rule text
            const dataAnalysisContainer = selectedContextContainers.find(container => 
                within(container).queryByText('Data Analysis', {exact: false})
            );
            expect(dataAnalysisContainer).toBeInTheDocument();

            // Then, look for the rule text *within* that container
            const ruleTextInContainer = within(dataAnalysisContainer!).getByText('Data Analysis', {exact: false});
            expect(ruleTextInContainer).toBeInTheDocument();
            
            // Look for the container by its class instead of data-testid as an alternative
            const ruleContainer = document.querySelector('.selected-context-container');
            expect(ruleContainer).not.toBeNull();
        });
        
        it('displays SelectedContextContainer when a rule is selected', async () => {
            // Clear and re-render to ensure our mock is used
            document.body.innerHTML = '';
            
            await act(async () => {
                renderChatInput();
            });
            
            const textarea = screen.getByRole('textbox');
            
            // Type @ character in textarea
            await act(async () => {
                typeInTextarea(textarea, '@');
            });
            
            // Find and click the rule 'Machine Learning'
            const ruleItem = screen.getByText('Machine Learning');
            
            await act(async () => {
                fireEvent.click(ruleItem);
            });
            
            // SelectedContextContainer should be displayed with the selected rule
            const selectedContextContainers = await screen.findAllByTestId('selected-context-container');
            expect(selectedContextContainers.length).toBeGreaterThan(0);
            
            // Find the container with the specific rule text
            const machineLearningContainer = selectedContextContainers.find(container => 
                within(container).queryByText('Machine Learning', {exact: false})
            );
            expect(machineLearningContainer).toBeInTheDocument();

            // And it should be in the chat input
            const selectedRule = within(textarea).getByText('Machine Learning');
            expect(selectedRule).toBeInTheDocument();
            
            // Check that the rule container has a remove button
            const removeButton = machineLearningContainer!.querySelector('.icon');
            expect(removeButton).toBeInTheDocument();
            
            // Click the remove button
            await act(async () => {
                if (removeButton) {
                    fireEvent.click(removeButton);
                }
            });
            
            // After removing, the Machine Learning SelectedContextContainer should not be in the document
            // but the Active Cell context should still be there
            const remainingContainers = screen.getAllByTestId('selected-context-container');
            const removedMachineLearningContainer = remainingContainers.find(container => 
                within(container).queryByText('Machine Learning', {exact: false})
            );
            expect(removedMachineLearningContainer).toBeUndefined();
            
            // Verify that the Active Cell context is still there
            const activeCellContainer = remainingContainers.find(container => 
                within(container).queryByText('Active Cell', {exact: false})
            );
            expect(activeCellContainer).toBeInTheDocument();
        });
    });

    describe('Add Context Button', () => {
        beforeEach(() => {
            // Clear the DOM between tests
            document.body.innerHTML = '';
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('opens dropdown with search input when Add Context button is clicked', async () => {
            renderChatInput();
            
            const addContextButton = screen.getByText('＠ Add Context');
            
            // Initially, dropdown should not be visible
            expect(screen.queryByTestId('chat-dropdown')).not.toBeInTheDocument();
            
            // Click the Add Context button
            await act(async () => {
                fireEvent.click(addContextButton);
            });
            
            // Dropdown should become visible with search input
            expect(screen.getByTestId('chat-dropdown')).toBeInTheDocument();
            expect(screen.getByTestId('chat-dropdown-list')).toBeInTheDocument();
            
            // Search input should be visible and focused
            const searchInput = screen.getByPlaceholderText('Search variables and rules...');
            expect(searchInput).toBeInTheDocument();
            expect(searchInput).toHaveFocus();
        });

        it('shows both variables and rules in the dropdown when opened via Add Context button', async () => {
            renderChatInput();
            
            const addContextButton = screen.getByText('＠ Add Context');
            
            await act(async () => {
                fireEvent.click(addContextButton);
            });
            
            // Check for variables
            MOCK_VARIABLES.forEach(variable => {
                const variableElement = screen.getByTestId(`chat-dropdown-item-name-${variable.variable_name}`);
                expect(variableElement).toBeInTheDocument();
                expect(variableElement).toHaveTextContent(variable.variable_name);
            });
            
            // Check for rules
            MOCK_RULES.forEach(rule => {
                const ruleElement = screen.getByText(rule);
                expect(ruleElement).toBeInTheDocument();
            });
        });

        it('filters dropdown options when typing in search input', async () => {
            renderChatInput();
            
            const addContextButton = screen.getByText('＠ Add Context');
            
            await act(async () => {
                fireEvent.click(addContextButton);
            });
            
            const searchInput = screen.getByPlaceholderText('Search variables and rules...');
            
            // Type 'df' to filter for variables starting with 'df'
            await act(async () => {
                fireEvent.change(searchInput, { target: { value: 'df' } });
            });
            
            // Should show 'df' variable
            expect(screen.getByTestId('chat-dropdown-item-name-df')).toBeInTheDocument();
            
            // Should not show other variables
            expect(screen.queryByTestId('chat-dropdown-item-name-x')).not.toBeInTheDocument();
            expect(screen.queryByTestId('chat-dropdown-item-name-y')).not.toBeInTheDocument();
            
            // Should not show rules (since 'df' doesn't match any rule names)
            expect(screen.queryByText('Data Analysis')).not.toBeInTheDocument();
            expect(screen.queryByText('Visualization')).not.toBeInTheDocument();
            expect(screen.queryByText('Machine Learning')).not.toBeInTheDocument();
        });
    });

    describe('Active Cell Context', () => {
        beforeEach(() => {
            // Clear the DOM between tests
            document.body.innerHTML = '';
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('shows active cell context automatically in Chat mode when there is active cell code', () => {
            renderChatInput();
            
            // Should show the active cell context container
            const activeCellContainer = screen.getByText('Active Cell');
            expect(activeCellContainer).toBeInTheDocument();
            
            // Should be inside a SelectedContextContainer
            const selectedContextContainer = screen.getByTestId('selected-context-container');
            expect(selectedContextContainer).toBeInTheDocument();
            expect(within(selectedContextContainer).getByText('Active Cell')).toBeInTheDocument();
        });

        it('does not show active cell context in Agent mode', () => {
            renderChatInput({ agentModeEnabled: true });
            
            // Should not show the active cell context container
            expect(screen.queryByText('Active Cell')).not.toBeInTheDocument();
            
            // Should not have any SelectedContextContainer
            expect(screen.queryByTestId('selected-context-container')).not.toBeInTheDocument();
        });
    });
});