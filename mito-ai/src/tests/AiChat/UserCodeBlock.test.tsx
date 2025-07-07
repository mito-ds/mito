/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import UserCodeBlock from '../../Extensions/AiChat/ChatMessage/UserCodeBlock';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';

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
    renderMimeRegistry: {} as IRenderMimeRegistry,
    agentModeEnabled: false,
    ...overrides
});

describe('UserCodeBlock Component', () => {
    describe('Code Preview', () => {
        it('shows only first 5 lines in preview mode', () => {
            const props = createMockProps();
            render(<UserCodeBlock {...props} />);

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
            render(<UserCodeBlock {...props} />);

            // Check for the expand button
            const expandButton = screen.getByTitle('Expand');
            expect(expandButton).toBeInTheDocument();
        });

        it('does not show expand button when code has 5 or fewer lines', () => {
            const props = createMockProps({
                code: 'line1\nline2\nline3\nline4\nline5'
            });
            render(<UserCodeBlock {...props} />);

            // Check that expand button is not present
            const expandButton = screen.queryByTitle('Expand');
            expect(expandButton).not.toBeInTheDocument();
        });

        it('expands to show all lines when expand button is clicked', () => {
            const props = createMockProps();
            render(<UserCodeBlock {...props} />);

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

        it('collapses back to preview when expand button is clicked again', () => {
            const props = createMockProps();
            render(<UserCodeBlock {...props} />);

            // Click the expand button to expand
            const expandButton = screen.getByTitle('Expand');
            fireEvent.click(expandButton);

            // Verify expanded state
            expect(screen.getByTitle('Collapse')).toBeInTheDocument();
            const expandedCodeElement = screen.getByTestId('python-code');
            const expandedLines = expandedCodeElement.textContent?.split('\n') || [];
            expect(expandedLines).toHaveLength(7);

            // Click the collapse button to collapse
            fireEvent.click(expandButton);

            // Verify collapsed state
            expect(screen.getByTitle('Expand')).toBeInTheDocument();
            const collapsedCodeElement = screen.getByTestId('python-code');
            const collapsedLines = collapsedCodeElement.textContent?.split('\n') || [];
            expect(collapsedLines).toHaveLength(5);
        });

        it('expands when clicking on the container', () => {
            const props = createMockProps();
            render(<UserCodeBlock {...props} />);

            // Click on the container (not the expand button)
            const container = document.querySelector('.code-block-container');
            expect(container).toBeInTheDocument();
            fireEvent.click(container!);

            // Verify expanded state
            const codeElement = screen.getByTestId('python-code');
            const renderedLines = codeElement.textContent?.split('\n') || [];
            expect(renderedLines).toHaveLength(7);
        });

        it('prevents event propagation when clicking expand button', () => {
            const props = createMockProps();
            render(<UserCodeBlock {...props} />);

            // Click the expand button
            const expandButton = screen.getByTitle('Expand');
            fireEvent.click(expandButton);

            // Verify expanded state
            const codeElement = screen.getByTestId('python-code');
            const renderedLines = codeElement.textContent?.split('\n') || [];
            expect(renderedLines).toHaveLength(7);

            // Click the expand button again (should collapse)
            fireEvent.click(expandButton);

            // Verify collapsed state
            const collapsedLines = codeElement.textContent?.split('\n') || [];
            expect(collapsedLines).toHaveLength(5);
        });
    });
});
