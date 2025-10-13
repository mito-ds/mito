/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import { getUserKey } from '../../../restAPI/RestAPI';

const MAX_FREE_USAGE = 150;

export const SubscriptionPage = (): JSX.Element => {

    const [usageCount, setUsageCount] = useState<number>(0);

    const getAiMitoApiNumUsages = async (): Promise<number> => {
        const usageCount = await getUserKey('ai_mito_api_num_usages');
        return usageCount ? parseInt(usageCount) : 0;
    };

    // When we first open the page, load the settings from the server
    useEffect(() => {
        const fetchSettings = async (): Promise<void> => {
            const count = await getAiMitoApiNumUsages();
            setUsageCount(count);
        };
        void fetchSettings();
    }, []);

    const percentage = (usageCount / MAX_FREE_USAGE) * 100;
    const remainingUsage = MAX_FREE_USAGE - usageCount;

    return (
        <div>
            <div className="settings-header">
                <h2>Manage Subscription</h2>
            </div>
            <div className="settings-option">
                <div className="settings-section">
                    <h3>Free Plan Usage</h3>
                    <p className="settings-option-description">
                        You have used <strong>{usageCount}</strong> of <strong>{MAX_FREE_USAGE}</strong> free AI messages ({percentage.toFixed(1)}%)
                    </p>
                    {remainingUsage > 0 ? (
                        <p className="settings-option-description">
                            {remainingUsage} messages remaining
                        </p>
                    ) : (
                        <p className="settings-option-description" style={{ color: 'var(--red-500)' }}>
                            You have reached your free usage limit. Upgrade to continue using Mito AI.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
