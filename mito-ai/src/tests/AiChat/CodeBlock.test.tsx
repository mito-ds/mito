/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import CodeBlock from '../../Extensions/AiChat/ChatMessage/CodeBlock';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { CodeReviewStatus } from '../../Extensions/AiChat/ChatTaskpane';

// Mock the PythonCode component since it's a complex component that we don't need to test here
jest.mock('../../Extensions/AiChat/ChatMessage/PythonCode', () => {
    return {
        __esModule: true,
        default: jest.fn(({ code }) => (
            <div data-testid="python-code">{code}</div>
        ))
    };
});

// Create base props for the component
const createMockProps = (overrides = {}) => ({
    code: 'line1\nline2\nline3\nline4\nline5\nline6\nline7',
    isCodeComplete: true,
    role: 'user' as const,
    renderMimeRegistry: {} as IRenderMimeRegistry,
    previewAICode: jest.fn(),
    acceptAICode: jest.fn(),
    rejectAICode: jest.fn(),
    isLastAiMessage: false,
    codeReviewStatus: 'chatPreview' as CodeReviewStatus,
    ...overrides
});

describe('CodeBlock Component', () => {
    describe('User Code Preview', () => {
        it('shows only first 5 lines in preview mode', () => {
            const props = createMockProps();
            render(<CodeBlock {...props} />);

            // Get the rendered code content
            const codeElement = screen.getByTestId('python-code');

            // Split the rendered code into lines
            const renderedLines = codeElement.textContent?.split('\n') || [];

            // Check that only 5 lines are shown in preview
            expect(renderedLines).toHaveLength(5);

            // Verify the content of the first 5 lines
            expect(renderedLines[0]).toBe('line1');
            expect(renderedLines[1]).toBe('line2');
            expect(renderedLines[2]).toBe('line3');
            expect(renderedLines[3]).toBe('line4');
            expect(renderedLines[4]).toBe('line5');
        });

        it('shows expand button when code has more than 5 lines', () => {
            const props = createMockProps();
            render(<CodeBlock {...props} />);

            // Check for the expand button
            const expandButton = screen.getByTitle('Expand');
            expect(expandButton).toBeInTheDocument();
        });

        it('does not show expand button when code has 5 or fewer lines', () => {
            const props = createMockProps({
                code: 'line1\nline2\nline3\nline4\nline5'
            });
            render(<CodeBlock {...props} />);

            // Check that expand button is not present
            const expandButton = screen.queryByTitle('Expand');
            expect(expandButton).not.toBeInTheDocument();
        });

        it('expands to show all lines when clicked', () => {
            const props = createMockProps();
            render(<CodeBlock {...props} />);

            // Click the expand button
            const expandButton = screen.getByTitle('Expand');
            fireEvent.click(expandButton);

            // Get the rendered code content after expansion
            const codeElement = screen.getByTestId('python-code');
            const renderedLines = codeElement.textContent?.split('\n') || [];

            // Check that all lines are shown after expansion
            expect(renderedLines).toHaveLength(7);

            // Verify the content of all lines
            expect(renderedLines[0]).toBe('line1');
            expect(renderedLines[1]).toBe('line2');
            expect(renderedLines[2]).toBe('line3');
            expect(renderedLines[3]).toBe('line4');
            expect(renderedLines[4]).toBe('line5');
            expect(renderedLines[5]).toBe('line6');
            expect(renderedLines[6]).toBe('line7');
        });
    });

    describe('Assistant Code Actions', () => {
        it('does not show action buttons when code is incomplete', () => {
            const props = createMockProps({
                role: 'assistant',
                isLastAiMessage: true,
                isCodeComplete: false,
                codeReviewStatus: 'chatPreview'
            });
            render(<CodeBlock {...props} />);

            // Verify that action buttons are not present when code is incomplete
            expect(screen.queryByTitle('Overwrite Active Cell')).not.toBeInTheDocument();
            expect(screen.queryByTitle('Copy')).not.toBeInTheDocument();
            expect(screen.queryByTitle('Accept AI Generated Code')).not.toBeInTheDocument();
            expect(screen.queryByTitle('Reject AI Generated Code')).not.toBeInTheDocument();

            // Verify that the toolbar container is not present
            expect(document.querySelector('.code-block-toolbar')).not.toBeInTheDocument();
        });

        it('shows action buttons when code is complete and is last AI message', () => {
            const props = createMockProps({
                role: 'assistant',
                isLastAiMessage: true,
                isCodeComplete: true,
                codeReviewStatus: 'chatPreview'
            });
            render(<CodeBlock {...props} />);

            // Verify that action buttons are present when code is complete
            expect(screen.getByTitle('Overwrite Active Cell')).toBeInTheDocument();
            expect(screen.getByTitle('Copy')).toBeInTheDocument();

            // Verify that the toolbar container is present
            expect(document.querySelector('.code-block-toolbar')).toBeInTheDocument();
        });
    });
});
