/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '@testing-library/jest-dom';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { restoreFromCurrentCheckpoint } from '../../utils/checkpoint';

// Mock checkpoint utilities
jest.mock('../../utils/checkpoint', () => ({
    restoreFromCurrentCheckpoint: jest.fn()
}));

// Simple test component for restore button functionality
const AgentRestoreButton: React.FC<{
    hasCheckpoint: boolean;
    notebookTracker: any;
}> = ({ hasCheckpoint, notebookTracker }) => {
    const [showButton, setShowButton] = React.useState(hasCheckpoint);

    const handleRestore = async () => {
        const success = await restoreFromCurrentCheckpoint(notebookTracker);
        if (success) {
            setShowButton(false);
        }
    };

    if (!showButton) return null;

    return (
        <button data-testid="restore-button" onClick={handleRestore}>
            ⏪ Restore checkpoint
        </button>
    );
};

describe('Agent Checkpoint', () => {
    const mockNotebookTracker = {} as any;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('shows restore button when checkpoint exists', () => {
        const { getByTestId } = render(
            <AgentRestoreButton hasCheckpoint={true} notebookTracker={mockNotebookTracker} />
        );

        expect(getByTestId('restore-button')).toBeInTheDocument();
    });

    it('calls restore function when button clicked', () => {
        (restoreFromCurrentCheckpoint as jest.Mock).mockReturnValue(true);

        const { getByTestId } = render(
            <AgentRestoreButton hasCheckpoint={true} notebookTracker={mockNotebookTracker} />
        );

        fireEvent.click(getByTestId('restore-button'));

        expect(restoreFromCurrentCheckpoint).toHaveBeenCalledWith(mockNotebookTracker);
    });

    it('hides button after successful restore', async () => {
        (restoreFromCurrentCheckpoint as jest.Mock).mockResolvedValue(true);

        const { getByTestId, queryByTestId } = render(
            <AgentRestoreButton hasCheckpoint={true} notebookTracker={mockNotebookTracker} />
        );

        fireEvent.click(getByTestId('restore-button'));

        await waitFor(() => {
            expect(queryByTestId('restore-button')).not.toBeInTheDocument();
        });
    });
});