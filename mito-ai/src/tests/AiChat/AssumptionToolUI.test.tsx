/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import AssumptionToolUI from '../../components/AgentComponents/AssumptionToolUI';
import { AnalysisAssumptionOptions } from '../../websockets/completions/CompletionModels';

// Mock CSS imports
jest.mock('../../../style/AssumptionTool.css', () => ({}));

const SINGLE_OPTION_ASSUMPTION: AnalysisAssumptionOptions = {
    selected: 'NaN values represent 0 impressions.',
    options: ['NaN values represent 0 impressions.']
};

const MULTI_OPTION_ASSUMPTION: AnalysisAssumptionOptions = {
    selected: 'Trial subscriptions are excluded from the retention population.',
    options: [
        'Trial subscriptions are excluded from the retention population.',
        'Trial subscriptions are included in the retention population.'
    ],
    evidence: "1,240 rows (12%) have status='trial'."
};

describe('AssumptionToolUI', () => {
    it('renders a single-option assumption as static text without a dropdown', () => {
        render(
            <AssumptionToolUI
                assumptions={[SINGLE_OPTION_ASSUMPTION]}
                onAssumptionChange={jest.fn()}
            />
        );

        expect(screen.getByText('NaN values represent 0 impressions.')).toBeInTheDocument();
        expect(screen.queryByTestId('assumption-statement-button')).not.toBeInTheDocument();
    });

    it('renders a multi-option assumption as a button that opens the alternatives list', () => {
        render(
            <AssumptionToolUI
                assumptions={[MULTI_OPTION_ASSUMPTION]}
                onAssumptionChange={jest.fn()}
            />
        );

        const statementButton = screen.getByTestId('assumption-statement-button');
        expect(statementButton).toHaveTextContent('Trial subscriptions are excluded from the retention population.');

        // Options list is closed by default
        expect(screen.queryByTestId('assumption-options-list')).not.toBeInTheDocument();

        fireEvent.click(statementButton);
        expect(screen.getByTestId('assumption-options-list')).toBeInTheDocument();
        expect(screen.getByText('Trial subscriptions are included in the retention population.')).toBeInTheDocument();
    });

    it('renders multi-option assumptions as static text when no change callback is provided', () => {
        render(<AssumptionToolUI assumptions={[MULTI_OPTION_ASSUMPTION]} />);

        expect(screen.getByText('Trial subscriptions are excluded from the retention population.')).toBeInTheDocument();
        expect(screen.queryByTestId('assumption-statement-button')).not.toBeInTheDocument();
    });

    it('calls onAssumptionChange with the original and new selection when an alternative is picked', () => {
        const onAssumptionChange = jest.fn();
        render(
            <AssumptionToolUI
                assumptions={[MULTI_OPTION_ASSUMPTION]}
                onAssumptionChange={onAssumptionChange}
            />
        );

        fireEvent.click(screen.getByTestId('assumption-statement-button'));
        fireEvent.click(screen.getByText('Trial subscriptions are included in the retention population.'));

        expect(onAssumptionChange).toHaveBeenCalledWith(
            'Trial subscriptions are excluded from the retention population.',
            'Trial subscriptions are included in the retention population.'
        );

        // The displayed statement updates to the new selection
        expect(screen.getByTestId('assumption-statement-button')).toHaveTextContent(
            'Trial subscriptions are included in the retention population.'
        );
    });

    it('shows the pending hint when a staged change exists for the assumption', () => {
        render(
            <AssumptionToolUI
                assumptions={[MULTI_OPTION_ASSUMPTION]}
                stagedAssumptionChanges={[{
                    originalSelected: 'Trial subscriptions are excluded from the retention population.',
                    newSelected: 'Trial subscriptions are included in the retention population.'
                }]}
                onAssumptionChange={jest.fn()}
            />
        );

        expect(screen.getByTestId('assumption-pending-hint')).toBeInTheDocument();
    });

    it('shows the context popover when hovering the context icon', () => {
        render(
            <AssumptionToolUI
                assumptions={[MULTI_OPTION_ASSUMPTION]}
                onAssumptionChange={jest.fn()}
            />
        );

        expect(screen.queryByTestId('assumption-evidence-popover')).not.toBeInTheDocument();

        fireEvent.mouseEnter(screen.getByTestId('assumption-evidence-icon'));

        const popover = screen.getByTestId('assumption-evidence-popover');
        expect(popover).toBeInTheDocument();
        expect(popover).toHaveTextContent('Context');
        expect(popover).toHaveTextContent("1,240 rows (12%) have status='trial'.");
    });

    it('does not render an evidence icon when there is no evidence', () => {
        render(
            <AssumptionToolUI
                assumptions={[SINGLE_OPTION_ASSUMPTION]}
                onAssumptionChange={jest.fn()}
            />
        );

        expect(screen.queryByTestId('assumption-evidence-icon')).not.toBeInTheDocument();
    });
});
