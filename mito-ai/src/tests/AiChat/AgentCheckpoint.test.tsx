/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '@testing-library/jest-dom';
import { render, fireEvent, waitFor } from '@testing-library/react';

// Mock JupyterLab app commands
const mockExecute = jest.fn();
const mockApp = {
    commands: {
        execute: mockExecute
    }
};

// Simple test component for restore button functionality
const AgentRestoreButton: React.FC<{
    hasCheckpoint: boolean;
    app: any;
}> = ({ hasCheckpoint, app }) => {
    const [showButton, setShowButton] = React.useState(hasCheckpoint);

    const handleRestore = async () => {
        await app.commands.execute("docmanager:restore-checkpoint");
        await app.commands.execute("notebook:restart-run-all");
        setShowButton(false);
    };

    if (!showButton) return null;

    return (
        <button data-testid="restore-button" onClick={handleRestore}>
            ⏪ Restore checkpoint
        </button>
    );
};

describe('Agent Checkpoint', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('shows restore button when checkpoint exists', () => {
        const { getByTestId } = render(
            <AgentRestoreButton hasCheckpoint={true} app={mockApp} />
        );

        expect(getByTestId('restore-button')).toBeInTheDocument();
    });

    it('calls restore commands when button clicked', async () => {
        mockExecute.mockResolvedValue(undefined);

        const { getByTestId } = render(
            <AgentRestoreButton hasCheckpoint={true} app={mockApp} />
        );

        fireEvent.click(getByTestId('restore-button'));

        await waitFor(() => {
            expect(mockExecute).toHaveBeenCalledWith("docmanager:restore-checkpoint");
            expect(mockExecute).toHaveBeenCalledWith("notebook:restart-run-all");
        });
    });

    it('hides button after successful restore', async () => {
        mockExecute.mockResolvedValue(undefined);

        const { getByTestId, queryByTestId } = render(
            <AgentRestoreButton hasCheckpoint={true} app={mockApp} />
        );

        fireEvent.click(getByTestId('restore-button'));

        await waitFor(() => {
            expect(queryByTestId('restore-button')).not.toBeInTheDocument();
        });
    });

    it('does not show button when no checkpoint exists', () => {
        const { queryByTestId } = render(
            <AgentRestoreButton hasCheckpoint={false} app={mockApp} />
        );

        expect(queryByTestId('restore-button')).not.toBeInTheDocument();
    });
});