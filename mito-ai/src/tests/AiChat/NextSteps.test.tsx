/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react';
import NextStepsPills from '../../components/NextStepsPills';

// Mock CSS imports
jest.mock('../../../style/NextStepsPills.css', () => ({}));

// Create base props for the component
const createMockProps = (overrides = {}) => ({
    nextSteps: [],
    onSelectNextStep: jest.fn(),
    ...overrides
});

// Helper function to render the component
const renderNextStepsPills = (props = {}) => {
    cleanup();
    return render(<NextStepsPills {...createMockProps(props)} />);
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
        it('starts in expanded state by default', async () => {
            renderNextStepsPills({
                nextSteps: ['Create a bar chart', 'Add data filtering']
            });

            await waitFor(() => {
                expect(screen.getByText('Suggested Next Steps')).toBeInTheDocument();
            });

            // Check that the caret is in expanded state
            const caret = screen.getByText('▼');
            expect(caret).toHaveClass('expanded');

            // Check that next steps are visible
            expect(screen.getByText('Create a bar chart')).toBeInTheDocument();
            expect(screen.getByText('Add data filtering')).toBeInTheDocument();
        });

        it('collapses when header is clicked', async () => {
            renderNextStepsPills({
                nextSteps: ['Create a bar chart', 'Add data filtering']
            });

            await waitFor(() => {
                expect(screen.getByText('Suggested Next Steps')).toBeInTheDocument();
            });

            // Click on the header to collapse
            const header = screen.getByText('Suggested Next Steps').closest('.next-steps-header');
            
            act(() => {
                fireEvent.click(header!);
            });

            // Check that the caret is now collapsed
            const caret = screen.getByText('▼');
            expect(caret).toHaveClass('collapsed');

            // Check that next steps are no longer visible
            expect(screen.queryByText('Create a bar chart')).not.toBeInTheDocument();
            expect(screen.queryByText('Add data filtering')).not.toBeInTheDocument();
        });

        it('expands when header is clicked again after being collapsed', async () => {
            renderNextStepsPills({
                nextSteps: ['Create a bar chart', 'Add data filtering']
            });

            await waitFor(() => {
                expect(screen.getByText('Suggested Next Steps')).toBeInTheDocument();
            });

            const header = screen.getByText('Suggested Next Steps').closest('.next-steps-header');

            // First click to collapse
            act(() => {
                fireEvent.click(header!);
            });

            // Verify collapsed state
            expect(screen.getByText('▼')).toHaveClass('collapsed');

            // Second click to expand
            act(() => {
                fireEvent.click(header!);
            });

            // Check that it's expanded again
            expect(screen.getByText('▼')).toHaveClass('expanded');
            expect(screen.getByText('Create a bar chart')).toBeInTheDocument();
            expect(screen.getByText('Add data filtering')).toBeInTheDocument();
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
