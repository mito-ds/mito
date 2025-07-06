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

            expect(screen.getByText('Generated 5 lines of code')).toBeInTheDocument();
            expect(screen.queryByTestId('python-code')).not.toBeInTheDocument();
        });

        it('expands to show code when agent mode toggle is clicked', () => {
            const props = createMockProps({
                agentModeEnabled: true
            });
            render(<AssistantCodeBlock {...props} />);

            const toggle = screen.getByText('Generated 5 lines of code');
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
            fireEvent.click(screen.getByText('Generated 5 lines of code'));

            const codeElement = screen.getByTestId('python-code');
            expect(codeElement.textContent).toBe('```python\nline1\nline2\nline3\nline4\nline5\n```');
        });
    });
});
