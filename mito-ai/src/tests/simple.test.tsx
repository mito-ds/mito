import { render, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ChatInput from '../Extensions/AiChat/ChatMessage/ChatInput';
import React from 'react';
import { CodeCell } from '@jupyterlab/cells';

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
        selectionChanged: {
            connect: jest.fn(),
            disconnect: jest.fn()
        },
        widgetAdded: {
            connect: jest.fn(),
            disconnect: jest.fn()
        },
        currentWidget: null,
        currentChanged: {
            connect: jest.fn(),
            disconnect: jest.fn()
        },
        cells: [],
        widgets: [],
        dispose: jest.fn(),
        isDisposed: false,
        add: jest.fn(),
        remove: jest.fn(),
        size: 0,
        restored: Promise.resolve(),
        widgetUpdated: {
            connect: jest.fn(),
            disconnect: jest.fn()
        },
        find: jest.fn(),
        forEach: jest.fn(),
        iter: jest.fn(),
        onCurrentChanged: jest.fn(),
        filter: jest.fn(),
        has: jest.fn(),
        inject: jest.fn()
    },
    renderMimeRegistry: {
        sanitizer: { sanitize: jest.fn() },
        resolver: {
            resolve: jest.fn(),
            resolveUrl: jest.fn(),
            getDownloadUrl: jest.fn()
        },
        linkHandler: { handleLink: jest.fn() },
        latexTypesetter: { typeset: jest.fn() },
        markdownParser: {
            parse: jest.fn(),
            render: jest.fn()
        },
        createRenderer: jest.fn().mockReturnValue({
            renderModel: jest.fn(),
            node: document.createElement('div')
        }),
        createModel: jest.fn(),
        preferredMimeType: jest.fn(),
        clone: jest.fn(),
        dispose: jest.fn(),
        isDisposed: false,
        addFactory: jest.fn(),
        getFactory: jest.fn(),
        getFactoryFor: jest.fn(),
        defaultRendererFactories: [],
        mimeTypes: [],
        changed: {
            connect: jest.fn(),
            disconnect: jest.fn()
        },
        removeMimeType: jest.fn(),
        getRank: jest.fn(),
        setRank: jest.fn()
    },
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