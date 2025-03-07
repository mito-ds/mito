import { CodeCell } from '@jupyterlab/cells';
import { INotebookTracker } from '@jupyterlab/notebook';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import '@testing-library/jest-dom'
import { render, fireEvent, screen, createEvent } from '@testing-library/react'
import React from 'react';
import ChatInput from '../../Extensions/AiChat/ChatMessage/ChatInput';

// Mock data for test cases
const TEST_CELL_CODE = 'print("Hello World")';
const EMPTY_CELL_ID = 'empty-cell-id';
const TEST_CELL_ID = 'test-cell-id';

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
    describe('Active Cell Preview', () => {
        it('shows preview when input has content', () => {
            renderChatInput();
            const textarea = screen.getByRole('textbox');
            expect(textarea).toBeInTheDocument();

            // Initially, preview should not be visible
            expect(screen.queryByTestId('active-cell-preview-container')).not.toBeInTheDocument();

            // Type in textarea
            typeInTextarea(textarea, 'test input');

            // Preview should become visible
            expect(screen.getByTestId('active-cell-preview-container')).toBeInTheDocument();
        });

        it('does not show preview for empty cells', () => {
            const props = {
                displayActiveCellCode: false,
                notebookTracker: {
                    ...createMockProps().notebookTracker,
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
    });

    describe('Keyboard Interactions', () => {
        it('submits message and clears input when Enter key is pressed', () => {
            const onSaveMock = jest.fn();
            renderChatInput({ onSave: onSaveMock });
            
            const textarea = screen.getByRole('textbox');
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

        it('does not submit message when Shift+Enter is pressed', () => {
            const onSaveMock = jest.fn();
            renderChatInput({ onSave: onSaveMock });
            
            const textarea = screen.getByRole('textbox');
            const testMessage = 'Hello, this is a test message';
            
            // Type content in the textarea
            typeInTextarea(textarea, testMessage);
            
            // Simulate pressing Shift+Enter
            fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', shiftKey: true });
            
            // Verify onSave was not called
            expect(onSaveMock).not.toHaveBeenCalled();
            
            // Verify the input was not cleared
            expect(textarea).toHaveValue(testMessage);
        });

        it('allows new line when Shift+Enter is pressed', () => {
            const onSaveMock = jest.fn();
            renderChatInput({ onSave: onSaveMock });
            
            const textarea = screen.getByRole('textbox');
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
            
            // Manually simulate adding a new line (as the browser would do)
            // since JSDOM doesn't automatically do this
            typeInTextarea(textarea, `${testMessage}\nLine 2`);
            
            // Verify the new line is in the textarea
            expect(textarea).toHaveValue(`${testMessage}\nLine 2`);
            
            // Verify onSave was not called
            expect(onSaveMock).not.toHaveBeenCalled();
        });
    });

    describe('Edit Mode', () => {
        it('shows edit buttons only when isEditing is true', () => {
            // First render with isEditing=false
            const { rerender } = renderChatInput({ isEditing: false });
            
            // Edit buttons should not be in the document
            expect(screen.queryByText('Save')).not.toBeInTheDocument();
            expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
            
            // Re-render with isEditing=true
            rerender(<ChatInput {...createMockProps({ isEditing: true })} />);
            
            // Edit buttons should now be in the document
            expect(screen.getByText('Save')).toBeInTheDocument();
            expect(screen.getByText('Cancel')).toBeInTheDocument();
        });

        it('calls onSave with current input when Save button is clicked', () => {
            const initialContent = 'Initial content';
            const onSaveMock = jest.fn();
            
            renderChatInput({ 
                isEditing: true, 
                initialContent: initialContent,
                onSave: onSaveMock 
            });
            
            const textarea = screen.getByRole('textbox');
            expect(textarea).toHaveValue(initialContent);
            
            // Update the text in the textarea
            const updatedContent = 'Updated content';
            typeInTextarea(textarea, updatedContent);
            
            // Click the Save button
            const saveButton = screen.getByText('Save');
            fireEvent.click(saveButton);
            
            // Verify onSave was called with the updated content
            expect(onSaveMock).toHaveBeenCalledWith(updatedContent);
        });

        it('calls onCancel when Cancel button is clicked', () => {
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
});