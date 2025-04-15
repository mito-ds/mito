/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { CodeCell } from '@jupyterlab/cells';
import { INotebookTracker } from '@jupyterlab/notebook';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import '@testing-library/jest-dom'
import { render, fireEvent, screen, createEvent, act } from '@testing-library/react'
import React from 'react';
import ChatInput from '../../Extensions/AiChat/ChatMessage/ChatInput';
import { Variable } from '../../Extensions/ContextManager/VariableInspector';

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
    getCellCodeByID: jest.fn((id) => id === EMPTY_CELL_ID ? '' : TEST_CELL_CODE)
}));

// Base props for ChatInput component
const createMockProps = (overrides = {}) => ({
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
    let defaultProps: ReturnType<typeof createMockProps>;
    let onSaveMock: jest.Mock;

    beforeEach(() => {
        // Clear any previous renders
        document.body.innerHTML = '';
        
        // Create fresh mocks for each test
        onSaveMock = jest.fn();
        defaultProps = createMockProps({ onSave: onSaveMock });
        
        // Render with default props
        renderChatInput({ onSave: onSaveMock });
        
        // Get the textarea element that's used in most tests
        textarea = screen.getByRole('textbox');
    });

    describe('Active Cell Preview', () => {
        it('shows preview when input has content', () => {
            expect(textarea).toBeInTheDocument();

            // Initially, preview should not be visible
            expect(screen.queryByTestId('active-cell-preview-container')).not.toBeInTheDocument();

            // Type in textarea
            typeInTextarea(textarea, 'test input');

            // Preview should become visible
            expect(screen.getByTestId('active-cell-preview-container')).toBeInTheDocument();
        });

        it('does not show preview for empty cells', () => {
            // Clear and re-render with custom props
            document.body.innerHTML = '';
            
            // Mock getCellCodeByID to return empty string for this test
            const { getCellCodeByID } = require('../../utils/notebook');
            getCellCodeByID.mockImplementation(() => '');
            
            const props = {
                displayActiveCellCode: true,
                notebookTracker: {
                    ...defaultProps.notebookTracker,
                    activeCell: createMockCell('', EMPTY_CELL_ID) as unknown as CodeCell
                }
            };

            renderChatInput(props);
            
            const textarea = screen.getByRole('textbox');
            expect(textarea).toBeInTheDocument();

            // Type in textarea
            typeInTextarea(textarea, 'test input');

            // Preview should not be visible for empty cells
            expect(screen.queryByTestId('active-cell-preview-container')).not.toBeInTheDocument();
        });

        it('does not show preview when agent mode is enabled', () => {
            renderChatInput({ agentModeEnabled: true });

            // Type in textarea
            typeInTextarea(textarea, 'test input');

            // Preview should not be visible
            expect(screen.queryByTestId('active-cell-preview-container')).not.toBeInTheDocument();
        });
    });

    describe('Keyboard Interactions', () => {
        it('submits message and clears input when Enter key is pressed', () => {
            const testMessage = 'Hello, this is a test message';
            
            // Type content in the textarea
            typeInTextarea(textarea, testMessage);
            
            // Simulate pressing Enter
            fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter' });
            
            // Verify onSave was called with the input content
            expect(onSaveMock).toHaveBeenCalledWith(testMessage);
            
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
            expect(editSaveMock).toHaveBeenCalledWith(updatedContent);
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
});