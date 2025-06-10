/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import { getSetting, updateSettings } from '../../../restAPI/RestAPI';

export const GeneralPage = (): JSX.Element => {

    const [betaMode, setBetaMode] = useState<boolean>(false);

    // When we first open the page, load the settings from the server
    useEffect(() => {
        const fetchSettings = async (): Promise<void> => {
            const betaMode = await getSetting('beta_mode');
            setBetaMode(betaMode === 'true');
        };
        void fetchSettings();
    }, []);

    const handleBetaModeChange = async (): Promise<void> => {
        const newBetaMode = !betaMode;
        await updateSettings('beta_mode', newBetaMode.toString());
        setBetaMode(newBetaMode);
    };
    
    return (
        <div>
            <div className="settings-header">
                <h2>General</h2>
            </div>
            <div className="settings-option">
                <label className="settings-checkbox-label">
                    <input type="checkbox" checked={betaMode} onChange={handleBetaModeChange} />
                    <span>Beta Mode</span>
                </label>
                <p className="settings-option-description">
                    Enable early access to experimental features. These features may be less stable than regular features.
                </p>
            </div>
        </div>
    );
};
