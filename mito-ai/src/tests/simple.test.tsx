import { render, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ChatInput from '../Extensions/AiChat/ChatMessage/ChatInput';
import React from 'react';
import { CodeCell } from '@jupyterlab/cells';

// Create a mock for the active cell that matches the interface we need
const mockActiveCell = {
    model: {
        value: {
            text: 'print("Hello World")'
        },
        id: 'test-cell-id'
    },
    editor: {
        model: {
            value: {
                text: 'print("Hello World")'
            }
        }
    }
};

// Mock the notebook utils functions
jest.mock('../utils/notebook', () => ({
    getActiveCellID: () => 'test-cell-id',
    getCellCodeByID: () => 'print("Hello World")'
}));

// Mock data and required props
const mockProps = {
    initialContent: '',
    placeholder: 'Type your message...',
    onSave: jest.fn(),
    isEditing: false,
    notebookTracker: {
        activeCellChanged: {
            connect: jest.fn(),
            disconnect: jest.fn()
        },
        activeCell: mockActiveCell as unknown as CodeCell,
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
        sanitizer: {
            sanitize: jest.fn()
        },
        resolver: {
            resolve: jest.fn(),
            resolveUrl: jest.fn(),
            getDownloadUrl: jest.fn()
        },
        linkHandler: {
            handleLink: jest.fn()
        },
        latexTypesetter: {
            typeset: jest.fn()
        },
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
    displayActiveCellCode: true
};

test('active cell preview is displayed when input has content', () => {
    const { container } = render(<ChatInput {...mockProps} />);

    // Get the textarea and assert it exists
    const textarea = container.querySelector('textarea');
    expect(textarea).toBeInTheDocument();

    // Initially, preview should not be visible
    expect(container.querySelector('.active-cell-preview-container')).not.toBeInTheDocument();

    // Focus the textarea and type something
    if (textarea) {
        fireEvent.focus(textarea);
        fireEvent.change(textarea, { target: { value: 'test input' } });
    }

    // Now preview should be visible
    expect(container.querySelector('.active-cell-preview-container')).toBeInTheDocument();
});