/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import ChatMessage from '../../Extensions/AiChat/ChatMessage/ChatMessage';
import { CodeReviewStatus } from '../../Extensions/AiChat/ChatTaskpane';
import { ChatMessageType, PromptType } from '../../Extensions/AiChat/ChatHistoryManager';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { IContextManager } from '../../Extensions/ContextManager/ContextManagerPlugin';
import { OperatingSystem } from '../../utils/user';
import { createMockMessage } from '../__mocks__/openaiMocks';
import { createMockNotebookTracker, createMockRenderMimeRegistry } from '../__mocks__/jupyterMocks';

jest.mock('../../Extensions/AiChat/ChatMessage/MarkdownBlock', () => {
    return {
        __esModule: true,
        default: jest.fn(({ markdown }) => (
            <div data-testid="markdown-block">{markdown}</div>
        ))
    };
});

jest.mock('../../components/AgentToolComponents/GetCellOutputToolUI', () => {
    return {
        __esModule: true,
        default: jest.fn(() => (
            <div data-testid="get-cell-output-tool">Taking a look at the cell output</div>
        ))
    };
});

jest.mock('../../Extensions/AiChat/ChatMessage/ChatInput', () => {
    return {
        __esModule: true,
        default: jest.fn(props => {
            // Store callbacks for later access in tests
            (window as any).__chatInputCallbacks = {
                onSave: props.onSave,
                onCancel: props.onCancel
            };
            return (
                <div data-testid="chat-input">
                    <textarea
                        data-testid="chat-input-textarea"
                        defaultValue={props.initialContent}
                    />
                    <button
                        data-testid="save-button"
                        onClick={() => props.onSave(props.initialContent)}
                    >
                        Save
                    </button>
                    <button
                        data-testid="cancel-button"
                        onClick={props.onCancel}
                    >
                        Cancel
                    </button>
                </div>
            );
        })
    };
});

// Only mock external services and utilities
jest.mock('../../utils/notebook', () => ({
    getActiveCellID: jest.fn(() => 'test-cell-id'),
    getCellCodeByID: jest.fn(() => 'test code')
}));

// Mock copyToClipboard since it's a browser API
jest.mock('../../utils/copyToClipboard', () => {
    return jest.fn().mockResolvedValue(undefined);
});

// Create base props for the component
const createMockProps = (overrides = {}) => ({
    message: createMockMessage('user', 'Hello, can you help me with pandas?'),
    messageType: 'openai message' as ChatMessageType,
    codeCellID: 'test-cell-id',
    messageIndex: 0,
    promptType: 'chat' as PromptType,
    agentResponse: undefined,
    mitoAIConnectionError: false,
    mitoAIConnectionErrorType: null,
    notebookTracker: createMockNotebookTracker(),
    renderMimeRegistry: createMockRenderMimeRegistry(),
    app: { commands: { execute: jest.fn() } } as unknown as JupyterFrontEnd,
    isLastAiMessage: false,
    operatingSystem: 'mac' as OperatingSystem,
    previewAICode: jest.fn(),
    acceptAICode: jest.fn(),
    rejectAICode: jest.fn(),
    onUpdateMessage: jest.fn(),
    onDeleteMessage: jest.fn(),
    contextManager: { getVariables: jest.fn(() => []) } as unknown as IContextManager,
    codeReviewStatus: 'chatPreview' as CodeReviewStatus,
    ...overrides
});

// Helper function to render the component
const renderChatMessage = (props = {}) => {
    cleanup();
    return render(<ChatMessage {...createMockProps(props)} />);
};

describe('ChatMessage Component', () => {
    beforeEach(() => {
        cleanup();
        jest.clearAllMocks();
        // Clear previous callbacks
        (window as any).__chatInputCallbacks = null;
    });

    afterEach(() => {
        cleanup();
    });

    describe('Rendering', () => {
        it('renders a user message correctly', () => {
            renderChatMessage({
                message: createMockMessage('user', 'Hello, can you help me with pandas?')
            });

            // Since we mocked MarkdownBlock, we can find the text directly
            expect(screen.getByText('Hello, can you help me with pandas?')).toBeInTheDocument();

            // Check for the user message class
            const messageElement = screen.getByText('Hello, can you help me with pandas?');
            const messageContainer = messageElement.closest('.message');
            expect(messageContainer).toHaveClass('message-user');
        });

        it('renders an assistant message correctly', () => {
            renderChatMessage({
                message: createMockMessage('assistant', 'Yes, I can help with pandas. What do you need?'),
                messageType: 'openai message'
            });

            // Check for the assistant message text and class
            expect(screen.getByText('Yes, I can help with pandas. What do you need?')).toBeInTheDocument();
            const messageElement = screen.getByText('Yes, I can help with pandas. What do you need?');
            const messageContainer = messageElement.closest('.message');
            expect(messageContainer).toHaveClass('message-assistant-chat');
        });

        it('renders a code block with action buttons when it is the last AI message', () => {
            renderChatMessage({
                message: createMockMessage('assistant', 'Here is a pandas example:\n```python\nimport pandas as pd\ndf = pd.DataFrame({"A": [1, 2, 3]})\nprint(df)\n```'),
                messageType: 'openai message',
                isLastAiMessage: true,
                codeReviewStatus: 'chatPreview'
            });

            // Check for the text part
            expect(screen.getByText(/Here is a pandas example:/)).toBeInTheDocument();

            // Check for the container
            const container = screen.getByText(/Here is a pandas example:/).closest('.message');
            expect(container).toBeInTheDocument();
            expect(container).toHaveClass('message-assistant-chat');

            // Check for the action buttons that should appear with the code block
            const buttons = screen.getAllByRole('button');
            const buttonTexts = buttons.map(button => button.textContent || '');

            // Verify the specific button texts for code actions
            expect(buttonTexts).toContain('Overwrite Active Cell');
            expect(buttonTexts).toContain('Copy');

            // Verify the buttons are in the chat-message-buttons container
            const buttonContainer = screen.getByText('Overwrite Active Cell').closest('.chat-message-buttons');
            expect(buttonContainer).toBeInTheDocument();
        });
    });

    describe('Error Messages', () => {
        it('renders an error message when there is a connection error', () => {
            renderChatMessage({
                message: createMockMessage('assistant', 'Connection error message'),
                mitoAIConnectionError: true,
                mitoAIConnectionErrorType: 'timeout'
            });

            // Error message should be visible
            expect(screen.getByText('Connection error message')).toBeInTheDocument();
        });

        it('renders free tier limit reached error correctly', () => {
            renderChatMessage({
                message: createMockMessage('assistant', 'Test error message'),
                mitoAIConnectionError: true,
                mitoAIConnectionErrorType: 'mito_server_free_tier_limit_reached'
            });

            // Check for the upgrade message
            expect(screen.getByText(/You've used up your free trial of Mito AI for this month/i)).toBeInTheDocument();

            // Check for the upgrade button
            expect(screen.getByText(/Upgrade to Pro/i)).toBeInTheDocument();
        });
    });

    describe('User Actions and UI Responses', () => {
        it('shows edit button for user messages', () => {
            renderChatMessage({
                message: createMockMessage('user', 'Hello, can you help me with pandas?')
            });

            // Find the edit button (it might be an icon or have title)
            const editButton = screen.getByTitle('Edit message');
            expect(editButton).toBeInTheDocument();
        });

        it('switches to edit mode when edit button is clicked', () => {
            const updateMessageMock = jest.fn();

            renderChatMessage({
                message: createMockMessage('user', 'Hello, can you help me with pandas?'),
                onUpdateMessage: updateMessageMock
            });

            // Find and click the edit button
            const editButton = screen.getByTitle('Edit message');

            // Use act to wrap the state change
            act(() => {
                fireEvent.click(editButton);
            });

            // Should show the ChatInput component for editing
            expect(screen.getByTestId('chat-input')).toBeInTheDocument();

            // Simulate saving the edited message
            act(() => {
                (window as any).__chatInputCallbacks.onSave('Updated message content');
            });

            expect(updateMessageMock).toHaveBeenCalledWith(0, 'Updated message content', 'openai message');
        });

        it('shows code action buttons for the last AI message with code', () => {
            renderChatMessage({
                message: createMockMessage('assistant', '```python\nimport pandas as pd\n```'),
                isLastAiMessage: true,
                codeReviewStatus: 'chatPreview'
            });

            // Find buttons that should be displayed for code actions
            const buttons = screen.getAllByRole('button');
            const buttonTexts = buttons.map(button => button.textContent || '');

            // Check for the presence of action buttons
            expect(buttonTexts.some(text => text.includes('Overwrite') || text.includes('Active'))).toBe(true);
            expect(buttonTexts.some(text => text.includes('Copy'))).toBe(true);
        });

        it('shows accept/reject buttons for code cell preview', () => {
            renderChatMessage({
                message: createMockMessage('assistant', '```python\nimport pandas as pd\n```'),
                isLastAiMessage: true,
                codeReviewStatus: 'codeCellPreview'
            });

            // Find buttons that should be displayed for code preview
            const buttons = screen.getAllByRole('button');
            const buttonTexts = buttons.map(button => button.textContent || '');

            // Check for the presence of accept/reject buttons
            expect(buttonTexts.some(text => text.includes('Accept'))).toBe(true);
            expect(buttonTexts.some(text => text.includes('Reject'))).toBe(true);
        });

        it('calls the preview function when preview button is clicked', () => {
            const previewMock = jest.fn();

            renderChatMessage({
                message: createMockMessage('assistant', '```python\nimport pandas as pd\n```'),
                isLastAiMessage: true,
                codeReviewStatus: 'chatPreview',
                previewAICode: previewMock
            });

            // Find and click a button that contains "Overwrite"
            const buttons = screen.getAllByRole('button');
            const previewButton = buttons.find(button =>
                (button.textContent || '').includes('Overwrite') ||
                (button.textContent || '').includes('Active')
            );

            if (previewButton) {
                fireEvent.click(previewButton);
                expect(previewMock).toHaveBeenCalled();
            } else {
                fail('Preview button not found');
            }
        });

        it('calls the accept function when accept button is clicked', () => {
            const acceptMock = jest.fn();

            renderChatMessage({
                message: createMockMessage('assistant', '```python\nimport pandas as pd\n```'),
                isLastAiMessage: true,
                codeReviewStatus: 'codeCellPreview',
                acceptAICode: acceptMock
            });

            // Find and click the accept button
            const buttons = screen.getAllByRole('button');
            const acceptButton = buttons.find(button =>
                (button.textContent || '').includes('Accept')
            );

            if (acceptButton) {
                fireEvent.click(acceptButton);
                expect(acceptMock).toHaveBeenCalled();
            } else {
                fail('Accept button not found');
            }
        });

        it('calls the reject function when reject button is clicked', () => {
            const rejectMock = jest.fn();

            renderChatMessage({
                message: createMockMessage('assistant', '```python\nimport pandas as pd\n```'),
                isLastAiMessage: true,
                codeReviewStatus: 'codeCellPreview',
                rejectAICode: rejectMock
            });

            // Find and click the reject button
            const buttons = screen.getAllByRole('button');
            const rejectButton = buttons.find(button =>
                (button.textContent || '').includes('Reject')
            );

            if (rejectButton) {
                fireEvent.click(rejectButton);
                expect(rejectMock).toHaveBeenCalled();
            } else {
                fail('Reject button not found');
            }
        });

        it('displays the GetCellOutputToolUI component when agentResponse type is get_cell_output', () => {
            renderChatMessage({
                message: createMockMessage('assistant', 'Looking at your cell output...'),
                agentResponse: { type: 'get_cell_output' }
            });

            // Check that the GetCellOutputToolUI component is rendered
            expect(screen.getByTestId('get-cell-output-tool')).toBeInTheDocument();
            expect(screen.getByText('Taking a look at the cell output')).toBeInTheDocument();
        });

        it('does not show overwrite button when code is still generating (incomplete)', () => {
            renderChatMessage({
                message: createMockMessage('assistant', '```python\nimport pandas as pd\ndf = pd.DataFrame({"A": [1, 2, 3]})'),
                isLastAiMessage: true,
                codeReviewStatus: 'chatPreview'
            });

            const buttons = screen.queryAllByRole('button');

            // Verify that no buttons are present when code is incomplete
            expect(buttons).toHaveLength(0);

            // Also verify that the specific button texts are not present
            expect(screen.queryByText('Overwrite Active Cell')).not.toBeInTheDocument();
            expect(screen.queryByText('Copy')).not.toBeInTheDocument();
        });
    });
}); 