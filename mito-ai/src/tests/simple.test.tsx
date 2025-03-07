import { CodeCell } from '@jupyterlab/cells';
import { INotebookTracker } from '@jupyterlab/notebook';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import '@testing-library/jest-dom'
import { render, fireEvent } from '@testing-library/react'
import React from 'react';
import ChatInput from '../Extensions/AiChat/ChatMessage/ChatInput';

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
jest.mock('../utils/notebook', () => ({
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
            const { container } = renderChatInput();
            const textarea = container.querySelector('textarea');
            expect(textarea).toBeInTheDocument();

            // Initially, preview should not be visible
            expect(container.querySelector('.active-cell-preview-container')).not.toBeInTheDocument();

            // Type in textarea
            if (textarea) {
                typeInTextarea(textarea, 'test input');
            }

            // Preview should become visible
            expect(container.querySelector('.active-cell-preview-container')).toBeInTheDocument();
        });

        it('does not show preview for empty cells', () => {
            const props = {
                displayActiveCellCode: false,
                notebookTracker: {
                    ...createMockProps().notebookTracker,
                    activeCell: createMockCell('', EMPTY_CELL_ID) as unknown as CodeCell
                }
            };

            const { container } = renderChatInput(props);
            const textarea = container.querySelector('textarea');
            expect(textarea).toBeInTheDocument();

            // Type in textarea
            if (textarea) {
                typeInTextarea(textarea, 'test input');
            }

            // Preview should not be visible for empty cells
            expect(container.querySelector('.active-cell-preview-container')).not.toBeInTheDocument();
        });
    });
});