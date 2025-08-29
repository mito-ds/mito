/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { IContextManager } from '../../ContextManager/ContextManagerPlugin';

interface ProfilerPageProps {
    contextManager: IContextManager;
}

export const ProfilerPage = ({ contextManager }: ProfilerPageProps): JSX.Element => {

    const handleLogContextManager = (): void => {
        console.log('ContextManager contents:');
        console.log('Variables:', contextManager.variables);
        console.log('Files:', contextManager.files);
    };
    
    return (
        <div>
            <div className="settings-header">
                <h2>Profiler</h2>
            </div>
            <div className="settings-option">
                <button 
                    className="button-base" 
                    onClick={handleLogContextManager}
                >
                    Log Context Manager Contents
                </button>
                <p className="settings-option-description">
                    Click to console log the current variables and files from the ContextManager.
                </p>
            </div>
        </div>
    );
};
