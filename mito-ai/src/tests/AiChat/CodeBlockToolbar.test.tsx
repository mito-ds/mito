/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import CodeBlockToolbar from '../../Extensions/AiChat/ChatMessage/CodeBlockToolbar';
import { CodeReviewStatus } from '../../Extensions/AiChat/ChatTaskpane';

// Mock copyToClipboard utility
jest.mock('../../utils/copyToClipboard', () => jest.fn());

// Mock IconButton component
jest.mock('../../components/IconButton', () => {
    return {
        __esModule: true,
        default: jest.fn(({ icon, title, onClick, style }) => (
            <button title={title} onClick={onClick} style={style}>
                {title}
            </button>
        ))
    };
});

// Mock icons
jest.mock('../../icons/CopyIcon', () => {
    return {
        __esModule: true,
        default: () => <span>CopyIcon</span>
    };
});

jest.mock('../../icons/PlayButtonIcon', () => {
    return {
        __esModule: true,
        default: () => <span>PlayButtonIcon</span>
    };
});

jest.mock('../../icons/AcceptIcon', () => {
    return {
        __esModule: true,
        default: () => <span>AcceptIcon</span>
    };
});

jest.mock('../../icons/RejectIcon', () => {
    return {
        __esModule: true,
        default: () => <span>RejectIcon</span>
    };
});

describe('CodeBlockToolbar Component', () => {
    const createMockProps = (overrides = {}) => ({
        code: 'test code',
        isLastAiMessage: true,
        codeReviewStatus: 'chatPreview' as CodeReviewStatus,
        onPreview: jest.fn(),
        onAccept: jest.fn(),
        onReject: jest.fn(),
        ...overrides
    });

    describe('Chat Preview Mode', () => {
        it('shows preview button for last AI message in chatPreview status', () => {
            const props = createMockProps();
            render(<CodeBlockToolbar {...props} />);

            expect(screen.getByTitle('Overwrite Active Cell')).toBeInTheDocument();
            expect(screen.getByTitle('Copy')).toBeInTheDocument();
        });

        it('shows copy button for non-last AI message in chatPreview status', () => {
            const props = createMockProps({
                isLastAiMessage: false
            });
            render(<CodeBlockToolbar {...props} />);

            expect(screen.queryByTitle('Overwrite Active Cell')).not.toBeInTheDocument();
            expect(screen.getByTitle('Copy')).toBeInTheDocument();
        });

        it('calls onPreview when preview button is clicked', () => {
            const mockPreview = jest.fn();
            const props = createMockProps({
                onPreview: mockPreview
            });
            render(<CodeBlockToolbar {...props} />);

            fireEvent.click(screen.getByTitle('Overwrite Active Cell'));
            expect(mockPreview).toHaveBeenCalledTimes(1);
        });
    });

    describe('Code Cell Preview Mode', () => {
        it('shows accept and reject buttons for last AI message in codeCellPreview status', () => {
            const props = createMockProps({
                codeReviewStatus: 'codeCellPreview'
            });
            render(<CodeBlockToolbar {...props} />);

            expect(screen.getByTitle('Accept AI Generated Code')).toBeInTheDocument();
            expect(screen.getByTitle('Reject AI Generated Code')).toBeInTheDocument();
            expect(screen.queryByTitle('Copy')).not.toBeInTheDocument();
            expect(screen.queryByTitle('Overwrite Active Cell')).not.toBeInTheDocument();
        });

        it('calls onAccept when accept button is clicked', () => {
            const mockAccept = jest.fn();
            const props = createMockProps({
                codeReviewStatus: 'codeCellPreview',
                onAccept: mockAccept
            });
            render(<CodeBlockToolbar {...props} />);

            fireEvent.click(screen.getByTitle('Accept AI Generated Code'));
            expect(mockAccept).toHaveBeenCalledTimes(1);
        });

        it('calls onReject when reject button is clicked', () => {
            const mockReject = jest.fn();
            const props = createMockProps({
                codeReviewStatus: 'codeCellPreview',
                onReject: mockReject
            });
            render(<CodeBlockToolbar {...props} />);

            fireEvent.click(screen.getByTitle('Reject AI Generated Code'));
            expect(mockReject).toHaveBeenCalledTimes(1);
        });

        it('shows copy button for non-last AI message in codeCellPreview status', () => {
            const props = createMockProps({
                isLastAiMessage: false,
                codeReviewStatus: 'codeCellPreview'
            });
            render(<CodeBlockToolbar {...props} />);

            expect(screen.queryByTitle('Accept AI Generated Code')).not.toBeInTheDocument();
            expect(screen.queryByTitle('Reject AI Generated Code')).not.toBeInTheDocument();
            expect(screen.getByTitle('Copy')).toBeInTheDocument();
        });
    });

    describe('Copy Button', () => {
        it('shows copy button when not in codeCellPreview status', () => {
            const props = createMockProps({
                codeReviewStatus: 'chatPreview'
            });
            render(<CodeBlockToolbar {...props} />);

            expect(screen.getByTitle('Copy')).toBeInTheDocument();
        });

        it('shows copy button for non-last AI message regardless of status', () => {
            const props = createMockProps({
                isLastAiMessage: false,
                codeReviewStatus: 'codeCellPreview'
            });
            render(<CodeBlockToolbar {...props} />);

            expect(screen.getByTitle('Copy')).toBeInTheDocument();
        });

        it('calls copyToClipboard when copy button is clicked', () => {
            const mockCopyToClipboard = require('../../utils/copyToClipboard');
            const props = createMockProps({
                isLastAiMessage: false
            });
            render(<CodeBlockToolbar {...props} />);

            fireEvent.click(screen.getByTitle('Copy'));
            expect(mockCopyToClipboard).toHaveBeenCalledWith('test code');
        });
    });

    describe('Edge Cases', () => {
        it('renders nothing when no buttons should be shown', () => {
            const props = createMockProps({
                isLastAiMessage: false,
                codeReviewStatus: 'codeCellPreview'
            });
            render(<CodeBlockToolbar {...props} />);

            // Should show copy button in this case
            expect(screen.getByTitle('Copy')).toBeInTheDocument();
        });

        it('handles missing callback functions gracefully', () => {
            const props = createMockProps({
                onPreview: undefined,
                onAccept: undefined,
                onReject: undefined
            });
            render(<CodeBlockToolbar {...props} />);

            // When onPreview is undefined, only copy button should be shown
            expect(screen.queryByTitle('Overwrite Active Cell')).not.toBeInTheDocument();
            expect(screen.getByTitle('Copy')).toBeInTheDocument();
        });
    });
}); 