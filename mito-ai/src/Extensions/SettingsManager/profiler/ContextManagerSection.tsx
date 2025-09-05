/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import { IContextManager } from '../../ContextManager/ContextManagerPlugin';

interface ContextManagerSectionProps {
    contextManager: IContextManager;
}

export const ContextManagerSection = ({ contextManager }: ContextManagerSectionProps): JSX.Element => {
    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefreshContextManager = (): void => {
        // Force a re-render by toggling the state
        setRefreshKey(prev => prev + 1);
    };

    const activeNotebookContext = contextManager.getActiveNotebookContext();

    const copyContextManagerToClipboard = async (): Promise<void> => {
        const jsonContent = JSON.stringify({
            variables: activeNotebookContext?.variables,
            files: activeNotebookContext?.files
        }, null, 2);

        try {
            await navigator.clipboard.writeText(jsonContent);
            console.log('Context Manager contents copied to clipboard');
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
        }
    };

    return (
        <div>
            <h3>Context Manager</h3>

            <div className="profiler-button-container">
                <button
                    className="button-base"
                    onClick={handleRefreshContextManager}
                >
                    Refresh
                </button>
                <button
                    className="button-base"
                    onClick={copyContextManagerToClipboard}
                >
                    Copy
                </button>
            </div>

            {refreshKey > 0 && (
                <div className="settings-option">
                    <pre className="json-container">
                        {JSON.stringify({
                            variables: activeNotebookContext?.variables,
                            files: activeNotebookContext?.files
                        }, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};
