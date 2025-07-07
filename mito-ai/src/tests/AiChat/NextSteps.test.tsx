/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react';
import NextStepsPills from '../../components/NextStepsPills';
import ChatMessage from '../../Extensions/AiChat/ChatMessage/ChatMessage';
import { createMockJupyterApp } from '../__mocks__/jupyterMocks';
import { IDisplayOptimizedChatItem } from '../../Extensions/AiChat/ChatHistoryManager';

// Mock CSS imports
jest.mock('../../../style/NextStepsPills.css', () => ({}));
jest.mock('../../../style/ChatMessage.css', () => ({}));
jest.mock('../../../style/MarkdownMessage.css', () => ({}));

jest.mock('../../Extensions/AiChat/ChatMessage/AlertBlock', () => {
    return function MockAlertBlock() {
        return <div data-testid="alert-block">Mocked AlertBlock</div>;
    };
});

jest.mock('../../Extensions/AiChat/ChatMessage/MarkdownBlock', () => {
    return function MockMarkdownBlock({ markdown }: { markdown: string }) {
        return <div data-testid="markdown-block">{markdown}</div>;
    };
});

jest.mock('../../components/AgentComponents/GetCellOutputToolUI', () => {
    return function MockGetCellOutputToolUI() {
        return <div data-testid="get-cell-output-tool">Mocked GetCellOutputToolUI</div>;
    };
});

// Create base props for NextStepsPills component
const createMockProps = (overrides = {}) => ({
    nextSteps: [],
    onSelectNextStep: jest.fn(),
    displayedNextStepsIfAvailable: true,
    setDisplayedNextStepsIfAvailable: jest.fn(),
    ...overrides
});

// Helper function to render NextStepsPills component
const renderNextStepsPills = (props = {}) => {
    cleanup();
    return render(<NextStepsPills {...createMockProps(props)} />);
};

// Create base props for ChatMessage component
const createMockChatMessageProps = (overrides = {}) => ({
    message: { role: 'assistant' as const, content: 'Test message' },
    messageType: 'assistant' as IDisplayOptimizedChatItem['type'],
    codeCellID: undefined,
    agentResponse: undefined,
    messageIndex: 0,
    promptType: 'agent:execution' as const,
    mitoAIConnectionError: false,
    mitoAIConnectionErrorType: null,
    notebookTracker: {} as any,
    renderMimeRegistry: {} as any,
    app: createMockJupyterApp(),
    isLastAiMessage: false,
    isLastMessage: false,
    operatingSystem: 'mac' as const,
    previewAICode: jest.fn(),
    acceptAICode: jest.fn(),
    rejectAICode: jest.fn(),
    onUpdateMessage: jest.fn(),
    contextManager: undefined,
    codeReviewStatus: 'chatPreview' as const,
    setNextSteps: jest.fn(),
    agentModeEnabled: false,
    ...overrides
});

// Helper function to render ChatMessage component
const renderChatMessage = (props = {}) => {
    cleanup();
    return render(<ChatMessage {...createMockChatMessageProps(props)} />);
};

describe('NextStepsPills Component', () => {
    beforeEach(() => {
        cleanup();
        jest.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    describe('Rendering', () => {
        it('renders nothing when nextSteps array is empty', () => {
            renderNextStepsPills({
                nextSteps: []
            });

            // Should not render the container at all
            expect(screen.queryByText('Suggested Next Steps')).not.toBeInTheDocument();
            expect(screen.queryByRole('button')).not.toBeInTheDocument();
        });

        it('renders the container with title when nextSteps are provided', async () => {
            renderNextStepsPills({
                nextSteps: ['Create a bar chart', 'Add data filtering']
            });

            // Wait for the visibility animation
            await waitFor(() => {
                expect(screen.getByText('Suggested Next Steps')).toBeInTheDocument();
            });

            // Check that the container has the visible class
            const container = screen.getByText('Suggested Next Steps').closest('.next-steps-pills-container');
            expect(container).toBeInTheDocument();
        });

        it('renders all next step pills when expanded', async () => {
            const nextSteps = ['Create a bar chart', 'Add data filtering', 'Export to CSV'];
            renderNextStepsPills({
                nextSteps
            });

            // Wait for the visibility animation
            await waitFor(() => {
                expect(screen.getByText('Suggested Next Steps')).toBeInTheDocument();
            });

            // Check that all next steps are rendered as buttons
            nextSteps.forEach(step => {
                expect(screen.getByText(step)).toBeInTheDocument();
                expect(screen.getByText(step).closest('button')).toBeInTheDocument();
            });

            // Check that each button has the proper class
            const buttons = screen.getAllByRole('button');
            const pillButtons = buttons.filter(button => 
                button.classList.contains('next-step-pill')
            );
            expect(pillButtons).toHaveLength(nextSteps.length);
        });

        it('applies correct CSS classes for animation', async () => {
            renderNextStepsPills({
                nextSteps: ['Create a bar chart']
            });

            // Initially should not be visible
            const container = screen.getByText('Suggested Next Steps').closest('.next-steps-pills-container');
            
            // Wait for the visibility animation to trigger
            await waitFor(() => {
                expect(container).toHaveClass('visible');
            });
        });
    });

    describe('Expand/Collapse Functionality', () => {
        it('collapses when header is clicked', async () => {
            const mockSetDisplayedNextStepsIfAvailable = jest.fn();
            let displayedNextStepsIfAvailable = true;
            
            // Mock the prop change behavior
            mockSetDisplayedNextStepsIfAvailable.mockImplementation((newValue) => {
                displayedNextStepsIfAvailable = newValue;
            });

            const { rerender } = renderNextStepsPills({
                nextSteps: ['Create a bar chart', 'Add data filtering'],
                displayedNextStepsIfAvailable: displayedNextStepsIfAvailable,
                setDisplayedNextStepsIfAvailable: mockSetDisplayedNextStepsIfAvailable
            });

            await waitFor(() => {
                expect(screen.getByText('Suggested Next Steps')).toBeInTheDocument();
            });

            // Click on the header to collapse
            const header = screen.getByText('Suggested Next Steps').closest('.next-steps-header');
            
            act(() => {
                fireEvent.click(header!);
            });

            // Check that setDisplayedNextStepsIfAvailable was called with false
            expect(mockSetDisplayedNextStepsIfAvailable).toHaveBeenCalledWith(false);

            // Simulate the prop change by re-rendering with new prop value
            rerender(<NextStepsPills {...createMockProps({
                nextSteps: ['Create a bar chart', 'Add data filtering'],
                displayedNextStepsIfAvailable: false,
                setDisplayedNextStepsIfAvailable: mockSetDisplayedNextStepsIfAvailable
            })} />);

            // Check that the caret is now collapsed
            const caret = screen.getByText('▼');
            expect(caret).toHaveClass('collapsed');

            // Check that next steps are no longer visible
            expect(screen.queryByText('Create a bar chart')).not.toBeInTheDocument();
            expect(screen.queryByText('Add data filtering')).not.toBeInTheDocument();
        });

        it('expands when header is clicked again after being collapsed', async () => {
            const mockSetDisplayedNextStepsIfAvailable = jest.fn();

            const { rerender } = renderNextStepsPills({
                nextSteps: ['Create a bar chart', 'Add data filtering'],
                displayedNextStepsIfAvailable: false,
                setDisplayedNextStepsIfAvailable: mockSetDisplayedNextStepsIfAvailable
            });

            await waitFor(() => {
                expect(screen.getByText('Suggested Next Steps')).toBeInTheDocument();
            });

            // Check initial collapsed state
            expect(screen.getByText('▼')).toHaveClass('collapsed');
            expect(screen.queryByText('Create a bar chart')).not.toBeInTheDocument();

            const header = screen.getByText('Suggested Next Steps').closest('.next-steps-header');

            // Click to expand
            act(() => {
                fireEvent.click(header!);
            });

            // Check that setDisplayedNextStepsIfAvailable was called with true
            expect(mockSetDisplayedNextStepsIfAvailable).toHaveBeenCalledWith(true);

            // Simulate the prop change by re-rendering with new prop value
            rerender(<NextStepsPills {...createMockProps({
                nextSteps: ['Create a bar chart', 'Add data filtering'],
                displayedNextStepsIfAvailable: true,
                setDisplayedNextStepsIfAvailable: mockSetDisplayedNextStepsIfAvailable
            })} />);

            // Check that it's expanded again
            expect(screen.getByText('▼')).toHaveClass('expanded');
            expect(screen.getByText('Create a bar chart')).toBeInTheDocument();
            expect(screen.getByText('Add data filtering')).toBeInTheDocument();
        });
    });

    describe('DisplayedNextStepsIfAvailable Preference', () => {
        it('displays next steps when displayedNextStepsIfAvailable is true', async () => {
            renderNextStepsPills({
                nextSteps: ['Create a bar chart', 'Add data filtering'],
                displayedNextStepsIfAvailable: true
            });

            await waitFor(() => {
                expect(screen.getByText('Suggested Next Steps')).toBeInTheDocument();
            });

            // Check that next steps are visible when preference is true
            expect(screen.getByText('Create a bar chart')).toBeInTheDocument();
            expect(screen.getByText('Add data filtering')).toBeInTheDocument();

            // Check that the caret is in expanded state
            const caret = screen.getByText('▼');
            expect(caret).toHaveClass('expanded');
        });

        it('does not display next steps when displayedNextStepsIfAvailable is false', async () => {
            renderNextStepsPills({
                nextSteps: ['Create a bar chart', 'Add data filtering'],
                displayedNextStepsIfAvailable: false
            });

            await waitFor(() => {
                expect(screen.getByText('Suggested Next Steps')).toBeInTheDocument();
            });

            // Check that next steps are not visible when preference is false
            expect(screen.queryByText('Create a bar chart')).not.toBeInTheDocument();
            expect(screen.queryByText('Add data filtering')).not.toBeInTheDocument();

            // Check that the caret is in collapsed state
            const caret = screen.getByText('▼');
            expect(caret).toHaveClass('collapsed');
        });

        it('updates preference correctly through multiple expand/collapse cycles', async () => {
            const mockSetDisplayedNextStepsIfAvailable = jest.fn();
            
            const { rerender } = renderNextStepsPills({
                nextSteps: ['Create a bar chart', 'Add data filtering'],
                displayedNextStepsIfAvailable: true,
                setDisplayedNextStepsIfAvailable: mockSetDisplayedNextStepsIfAvailable
            });

            await waitFor(() => {
                expect(screen.getByText('Suggested Next Steps')).toBeInTheDocument();
            });

            const header = screen.getByText('Suggested Next Steps').closest('.next-steps-header');

            // First click to collapse
            act(() => {
                fireEvent.click(header!);
            });

            expect(mockSetDisplayedNextStepsIfAvailable).toHaveBeenCalledWith(false);

            // Simulate the prop change to collapsed state
            rerender(<NextStepsPills {...createMockProps({
                nextSteps: ['Create a bar chart', 'Add data filtering'],
                displayedNextStepsIfAvailable: false,
                setDisplayedNextStepsIfAvailable: mockSetDisplayedNextStepsIfAvailable
            })} />);

            // Second click to expand
            act(() => {
                fireEvent.click(header!);
            });

            expect(mockSetDisplayedNextStepsIfAvailable).toHaveBeenCalledWith(true);

            // Verify it was called twice with the correct values
            expect(mockSetDisplayedNextStepsIfAvailable).toHaveBeenCalledTimes(2);
            expect(mockSetDisplayedNextStepsIfAvailable).toHaveBeenNthCalledWith(1, false);
            expect(mockSetDisplayedNextStepsIfAvailable).toHaveBeenNthCalledWith(2, true);
        });
    });

    describe('Next Step Selection', () => {
        it('calls onSelectNextStep when a next step pill is clicked', async () => {
            const mockOnSelectNextStep = jest.fn();
            renderNextStepsPills({
                nextSteps: ['Create a bar chart', 'Add data filtering'],
                onSelectNextStep: mockOnSelectNextStep
            });

            await waitFor(() => {
                expect(screen.getByText('Create a bar chart')).toBeInTheDocument();
            });

            // Click on the first next step
            const firstStepButton = screen.getByText('Create a bar chart').closest('button');
            
            act(() => {
                fireEvent.click(firstStepButton!);
            });

            // Wait for the animation delay
            await waitFor(() => {
                expect(mockOnSelectNextStep).toHaveBeenCalledWith('Create a bar chart');
            }, { timeout: 200 });
        });

        it('applies animation out class when a next step is clicked', async () => {
            renderNextStepsPills({
                nextSteps: ['Create a bar chart'],
                onSelectNextStep: jest.fn()
            });

            await waitFor(() => {
                expect(screen.getByText('Create a bar chart')).toBeInTheDocument();
            });

            const container = screen.getByText('Suggested Next Steps').closest('.next-steps-pills-container');
            const stepButton = screen.getByText('Create a bar chart').closest('button');

            act(() => {
                fireEvent.click(stepButton!);
            });

            // Check that the animating-out class is applied
            expect(container).toHaveClass('animating-out');
        });
    });
});

describe('ChatMessage Next Steps Logic', () => {
    beforeEach(() => {
        cleanup();
        jest.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    describe('Next Steps Display Logic', () => {
        it('calls setNextSteps when all conditions are met', () => {
            const mockSetNextSteps = jest.fn();
            const nextSteps = ['Create a bar chart', 'Add data filtering', 'Export to CSV'];

            renderChatMessage({
                isLastMessage: true,
                agentResponse: {
                    type: 'finished_task',
                    message: 'Task completed successfully',
                    next_steps: nextSteps
                },
                setNextSteps: mockSetNextSteps
            });

            expect(mockSetNextSteps).toHaveBeenCalledWith(nextSteps);
        });

        it('does not call setNextSteps when not the last message', () => {
            const mockSetNextSteps = jest.fn();
            const nextSteps = ['Create a bar chart', 'Add data filtering'];

            renderChatMessage({
                isLastMessage: false, // Not last message
                agentResponse: {
                    type: 'finished_task',
                    message: 'Task completed successfully',
                    next_steps: nextSteps
                },
                setNextSteps: mockSetNextSteps
            });

            expect(mockSetNextSteps).not.toHaveBeenCalled();
        });

        it('does not call setNextSteps when agent response type is not finished_task', () => {
            const mockSetNextSteps = jest.fn();
            const nextSteps = ['Create a bar chart', 'Add data filtering'];

            renderChatMessage({
                isLastMessage: true,
                agentResponse: {
                    type: 'cell_update', // Different type
                    message: 'Code updated',
                    next_steps: nextSteps
                },
                setNextSteps: mockSetNextSteps
            });

            expect(mockSetNextSteps).not.toHaveBeenCalled();
        });

        it('does not call setNextSteps when agent response is undefined', () => {
            const mockSetNextSteps = jest.fn();

            renderChatMessage({
                isLastMessage: true,
                agentResponse: undefined, // No agent response
                setNextSteps: mockSetNextSteps
            });

            expect(mockSetNextSteps).not.toHaveBeenCalled();
        });

        it('does not call setNextSteps when next_steps is undefined', () => {
            const mockSetNextSteps = jest.fn();

            renderChatMessage({
                isLastMessage: true,
                agentResponse: {
                    type: 'finished_task',
                    message: 'Task completed successfully',
                    next_steps: undefined // No next steps
                },
                setNextSteps: mockSetNextSteps
            });

            expect(mockSetNextSteps).not.toHaveBeenCalled();
        });

        it('does not call setNextSteps when next_steps array is empty', () => {
            const mockSetNextSteps = jest.fn();

            renderChatMessage({
                isLastMessage: true,
                agentResponse: {
                    type: 'finished_task',
                    message: 'Task completed successfully',
                    next_steps: [] // Empty array
                },
                setNextSteps: mockSetNextSteps
            });

            expect(mockSetNextSteps).not.toHaveBeenCalled();
        });
    });
});
