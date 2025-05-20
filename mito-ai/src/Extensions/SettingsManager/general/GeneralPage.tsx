import { PageConfig } from '@jupyterlab/coreutils';
import React, { useEffect, useState } from 'react';

export const GeneralPage = (): JSX.Element => {

    const baseUrl = PageConfig.getBaseUrl();
    const [betaMode, setBetaMode] = useState<boolean>(false);

    // When we first open the page, load the settings from the server
    useEffect(() => {
        const fetchSettings = async () => {
            const response = await fetch(`${baseUrl}mito-ai/settings/beta_mode`, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            const data = await response.json();
            if (data.value !== undefined) {
                setBetaMode(data.value);
            }
        };
        fetchSettings();
    }, []);

    const handleBetaModeChange = async () => {
        const newBetaMode = !betaMode;

        const response = await fetch(`${baseUrl}mito-ai/settings/beta_mode`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 'value': newBetaMode }),
        });
        const data = await response.json();
        if (data.value !== undefined) {
            setBetaMode(data.value);
        }
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
