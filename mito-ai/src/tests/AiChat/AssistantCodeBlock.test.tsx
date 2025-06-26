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

// Mock copyToClipboard utility
jest.mock('../../utils/copyToClipboard', () => jest.fn());

// Create base props for the component
const createMockProps = (overrides = {}) => ({
    code: 'line1\nline2\nline3\nline4\nline5',
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
        it('shows full toolbar for complete code and last AI message', () => {
            const props = createMockProps();
            render(<AssistantCodeBlock {...props} />);

            expect(screen.getByTitle('Overwrite Active Cell')).toBeInTheDocument();
            expect(screen.getByTitle('Copy')).toBeInTheDocument();
        });

        it('shows only copy button for non-last AI message', () => {
            const props = createMockProps({
                isLastAiMessage: false,
                isCodeComplete: true
            });
            render(<AssistantCodeBlock {...props} />);

            expect(screen.queryByTitle('Overwrite Active Cell')).not.toBeInTheDocument();
            expect(screen.getByTitle('Copy')).toBeInTheDocument();
        });

        it('shows no toolbar for incomplete code and non-last message', () => {
            const props = createMockProps({
                isLastAiMessage: false,
                isCodeComplete: false
            });
            render(<AssistantCodeBlock {...props} />);

            expect(screen.queryByTitle('Overwrite Active Cell')).not.toBeInTheDocument();
            expect(screen.queryByTitle('Copy')).not.toBeInTheDocument();
        });

        it('shows accept/reject buttons in codeCellPreview status', () => {
            const props = createMockProps({
                codeReviewStatus: 'codeCellPreview'
            });
            render(<AssistantCodeBlock {...props} />);

            expect(screen.getByTitle('Accept AI Generated Code')).toBeInTheDocument();
            expect(screen.getByTitle('Reject AI Generated Code')).toBeInTheDocument();
            expect(screen.queryByTitle('Copy')).not.toBeInTheDocument();
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
            expect(screen.getByTitle('Copy')).toBeInTheDocument();
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

    describe('Event Handlers', () => {
        it('calls previewAICode when preview button is clicked', () => {
            const mockPreview = jest.fn();
            const props = createMockProps({
                previewAICode: mockPreview
            });
            render(<AssistantCodeBlock {...props} />);

            fireEvent.click(screen.getByTitle('Overwrite Active Cell'));
            expect(mockPreview).toHaveBeenCalledTimes(1);
        });

        it('calls acceptAICode when accept button is clicked', () => {
            const mockAccept = jest.fn();
            const props = createMockProps({
                codeReviewStatus: 'codeCellPreview',
                acceptAICode: mockAccept
            });
            render(<AssistantCodeBlock {...props} />);

            fireEvent.click(screen.getByTitle('Accept AI Generated Code'));
            expect(mockAccept).toHaveBeenCalledTimes(1);
        });

        it('calls rejectAICode when reject button is clicked', () => {
            const mockReject = jest.fn();
            const props = createMockProps({
                codeReviewStatus: 'codeCellPreview',
                rejectAICode: mockReject
            });
            render(<AssistantCodeBlock {...props} />);

            fireEvent.click(screen.getByTitle('Reject AI Generated Code'));
            expect(mockReject).toHaveBeenCalledTimes(1);
        });
    });

    describe('Code Display', () => {
        it('shows full code when not in agent mode', () => {
            const props = createMockProps();
            render(<AssistantCodeBlock {...props} />);

            const codeElement = screen.getByTestId('python-code');
            expect(codeElement.textContent).toBe('line1\nline2\nline3\nline4\nline5');
        });

        it('shows full code when agent mode is expanded', () => {
            const props = createMockProps({
                agentModeEnabled: true
            });
            render(<AssistantCodeBlock {...props} />);

            // Click to expand
            fireEvent.click(screen.getByText('Generated 5 lines of code'));

            const codeElement = screen.getByTestId('python-code');
            expect(codeElement.textContent).toBe('line1\nline2\nline3\nline4\nline5');
        });
    });
});
