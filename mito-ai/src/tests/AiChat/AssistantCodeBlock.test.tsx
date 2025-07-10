/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import AssistantCodeBlock from '../../Extensions/AiChat/ChatMessage/AssistantCodeBlock';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { CodeReviewStatus } from '../../Extensions/AiChat/ChatTaskpane';

const SAMPLE_CODE_SUMMARY = 'Sample code summary';

// Mock the PythonCode component
jest.mock('../../Extensions/AiChat/ChatMessage/PythonCode', () => {
    return {
        __esModule: true,
        default: jest.fn(({ code }) => (
            <div data-testid="python-code">{code}</div>
        ))
    };
});

// Mock the CodeBlockToolbar component
jest.mock('../../Extensions/AiChat/ChatMessage/CodeBlockToolbar', () => {
    return {
        __esModule: true,
        default: jest.fn(() => <div data-testid="code-block-toolbar" />)
    };
});

// Mock copyToClipboard utility
jest.mock('../../utils/copyToClipboard', () => jest.fn());

// Create base props for the component
const createMockProps = (overrides = {}) => ({
    code: '```python\nline1\nline2\nline3\nline4\nline5\n```',
    isCodeComplete: true,
    renderMimeRegistry: {} as IRenderMimeRegistry,
    previewAICode: jest.fn(),
    acceptAICode: jest.fn(),
    rejectAICode: jest.fn(),
    isLastAiMessage: true,
    codeReviewStatus: 'chatPreview' as CodeReviewStatus,
    agentModeEnabled: false,
    codeSummary: SAMPLE_CODE_SUMMARY,
    ...overrides
});

describe('AssistantCodeBlock Component', () => {
    describe('Toolbar Rendering', () => {
        it('shows toolbar for complete code and last AI message', () => {
            const props = createMockProps();
            render(<AssistantCodeBlock {...props} />);

            expect(screen.getByTestId('code-block-toolbar')).toBeInTheDocument();
        });

        it('shows toolbar for non-last AI message with complete code', () => {
            const props = createMockProps({
                isLastAiMessage: false,
                isCodeComplete: true
            });
            render(<AssistantCodeBlock {...props} />);

            expect(screen.getByTestId('code-block-toolbar')).toBeInTheDocument();
        });

        it('shows no toolbar for incomplete code and non-last message', () => {
            const props = createMockProps({
                isLastAiMessage: false,
                isCodeComplete: false
            });
            render(<AssistantCodeBlock {...props} />);

            expect(screen.queryByTestId('code-block-toolbar')).not.toBeInTheDocument();
        });

        it('shows toolbar in codeCellPreview status', () => {
            const props = createMockProps({
                codeReviewStatus: 'codeCellPreview'
            });
            render(<AssistantCodeBlock {...props} />);

            expect(screen.getByTestId('code-block-toolbar')).toBeInTheDocument();
        });
    });

    describe('Agent Mode', () => {
        it('shows agent mode toggle when agentModeEnabled is true', () => {
            const props = createMockProps({
                agentModeEnabled: true
            });
            render(<AssistantCodeBlock {...props} />);

            expect(screen.getByText(SAMPLE_CODE_SUMMARY)).toBeInTheDocument();
            expect(screen.queryByTestId('python-code')).not.toBeInTheDocument();
        });

        it('expands to show code when agent mode toggle is clicked', () => {
            const props = createMockProps({
                agentModeEnabled: true
            });
            render(<AssistantCodeBlock {...props} />);

            const toggle = screen.getByText(SAMPLE_CODE_SUMMARY);
            fireEvent.click(toggle);

            expect(screen.getByTestId('python-code')).toBeInTheDocument();
        });

        it('applies agent mode styling when enabled', () => {
            const props = createMockProps({
                agentModeEnabled: true
            });
            render(<AssistantCodeBlock {...props} />);

            const container = document.querySelector('.code-block-container');
            expect(container).toHaveClass('agent-mode');
        });

        it('shows custom code summary when provided in agent mode', () => {
            const props = createMockProps({
                agentModeEnabled: true,
                codeSummary: 'Custom summary for data processing'
            });
            render(<AssistantCodeBlock {...props} />);

            expect(screen.getByText('Custom summary for data processing')).toBeInTheDocument();
            expect(screen.queryByText('Generated code')).not.toBeInTheDocument();
        });

        it('shows default "Generated code" when codeSummary is undefined in agent mode', () => {
            const props = createMockProps({
                agentModeEnabled: true,
                codeSummary: undefined
            });
            render(<AssistantCodeBlock {...props} />);

            expect(screen.getByText('Generated code')).toBeInTheDocument();
        });
    });

    describe('Code Display', () => {
        it('shows full code when not in agent mode', () => {
            const props = createMockProps();
            render(<AssistantCodeBlock {...props} />);

            const codeElement = screen.getByTestId('python-code');
            expect(codeElement.textContent).toBe('```python\nline1\nline2\nline3\nline4\nline5\n```');
        });

        it('shows full code when agent mode is expanded', () => {
            const props = createMockProps({
                agentModeEnabled: true
            });
            render(<AssistantCodeBlock {...props} />);

            // Click to expand
            fireEvent.click(screen.getByText(SAMPLE_CODE_SUMMARY));

            const codeElement = screen.getByTestId('python-code');
            expect(codeElement.textContent).toBe('```python\nline1\nline2\nline3\nline4\nline5\n```');
        });
    });

    describe('Editability', () => {
        it('does not show edit icon for assistant code block', () => {
            const props = createMockProps();
            render(<AssistantCodeBlock {...props} />);

            // Verify no edit button/icon is present
            expect(screen.queryByTitle('Edit message')).not.toBeInTheDocument();
            expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument();
        });

        it('does not enable editing on double-click', () => {
            const props = createMockProps();
            render(<AssistantCodeBlock {...props} />);

            const codeElement = screen.getByTestId('python-code');
            
            // Double-click the code element
            fireEvent.doubleClick(codeElement);

            // Verify no edit input or textarea appears
            expect(screen.queryByTestId('chat-input')).not.toBeInTheDocument();
            expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
            expect(screen.queryByRole('textarea')).not.toBeInTheDocument();
        });
    });
});
