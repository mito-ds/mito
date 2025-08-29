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

    return (
        <div>
            <div className="settings-header">
                <h2>Profiler</h2>
            </div>

            <h3>Context Manager</h3>

            <button
                className="button-base"
                onClick={handleRefreshContextManager}
            >
                Refresh
            </button>

            {showContents && (
                <div className="settings-option">
                    <pre style={{
                        overflowY: 'auto',
                        // border: '1px solid #ccc',
                        padding: '10px',
                        marginTop: '10px',
                        // backgroundColor: '#f5f5f5',
                        // fontSize: '12px'
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
