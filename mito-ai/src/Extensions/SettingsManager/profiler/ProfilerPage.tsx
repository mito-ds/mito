/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import { IContextManager } from '../../ContextManager/ContextManagerPlugin';

interface ProfilerPageProps {
    contextManager: IContextManager;
}

export const ProfilerPage = ({ contextManager }: ProfilerPageProps): JSX.Element => {

    const [showContents, setShowContents] = useState<boolean>(true);

    const handleRefreshContextManager = (): void => {
        // Force a re-render by toggling the state
        setShowContents(false);
        setTimeout(() => setShowContents(true), 0);
    };

    const handleCopyToClipboard = async (): Promise<void> => {
        const jsonContent = JSON.stringify({
            variables: contextManager.variables,
            files: contextManager.files
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
            <div className="settings-header">
                <h2>Profiler</h2>
            </div>

            <p style={{ color: 'red' }}>The profiler is a tool for debugging Mito AI internally.</p>

            <h3>Context Manager</h3>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <button
                    className="button-base"
                    onClick={handleRefreshContextManager}
                >
                    Refresh
                </button>
                <button
                    className="button-base"
                    onClick={handleCopyToClipboard}
                >
                    Copy
                </button>
            </div>

            {showContents && (
                <div className="settings-option">
                    <pre style={{
                        overflowY: 'auto',
                        padding: '10px',
                        marginTop: '10px',
                        // backgroundColor: '#f5f5f5',
                    }}>
                        {JSON.stringify({
                            variables: contextManager.variables,
                            files: contextManager.files
                        }, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};
