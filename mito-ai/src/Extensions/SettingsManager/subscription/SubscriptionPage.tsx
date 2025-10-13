/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import { getUserKey } from '../../../restAPI/RestAPI';
import '../../../../style/SubscriptionPage.css';

const MAX_FREE_USAGE = 150;

export const SubscriptionPage = (): JSX.Element => {
    const [usageCount, setUsageCount] = useState<number>(0);
    const [resetDate, setResetDate] = useState<string | null>(null);

    const getAiMitoApiNumUsages = async (): Promise<number> => {
        const usageCount = await getUserKey('ai_mito_api_num_usages');
        return usageCount ? parseInt(usageCount) : 0;
    };

    const getNextResetDate = async (): Promise<string | null> => {
        const lastResetDate = await getUserKey('mito_ai_last_reset_date');
        if (!lastResetDate) return null;

        // Parse the date and add one month
        const lastReset = new Date(lastResetDate);
        const nextReset = new Date(lastReset);
        nextReset.setMonth(nextReset.getMonth() + 1);

        // Format the date before returning
        return nextReset.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // When we first open the page, load the settings from the server
    useEffect(() => {
        const fetchSettings = async (): Promise<void> => {
            const count = await getAiMitoApiNumUsages();
            setUsageCount(count);

            const nextReset = await getNextResetDate();
            setResetDate(nextReset);
        };
        void fetchSettings();
    }, []);

    const percentage = (usageCount / MAX_FREE_USAGE) * 100;
    const remainingUsage = MAX_FREE_USAGE - usageCount;

    return (
        <div className="subscription-page-container">
            <div className="subscription-page-header">
                <h2 className="subscription-page-title">Manage Subscription</h2>
                <p className="subscription-page-subtitle">
                    Track your usage and manage your plan
                </p>
            </div>

            <div className="subscription-page-card">
                <div className="subscription-page-card-content">
                    <h3 className="subscription-page-section-title">
                        Free Plan Usage
                    </h3>

                    {/* Usage stats */}
                    <div className="subscription-page-usage-stats">
                        <div className="subscription-page-usage-count">
                            {usageCount}
                        </div>
                        <div className="subscription-page-usage-details">
                            <div>of {MAX_FREE_USAGE} messages</div>
                            <div>({percentage.toFixed(1)}% used)</div>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="subscription-page-progress-bar">
                        <div
                            className="subscription-page-progress-fill"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                    </div>

                    {/* Status message */}
                    {remainingUsage > 0 ? (
                        <p className="subscription-page-status-message">
                            {resetDate ? (
                                <>Your free usage resets {resetDate}</>
                            ) : (
                                <>✓ {remainingUsage} messages remaining</>
                            )}
                        </p>
                    ) : (
                        <p className="subscription-page-status-warning">
                            You have reached your free usage limit. Upgrade to continue using Mito AI.
                        </p>
                    )}
                </div>

                {/* Action buttons */}
                <div className="subscription-page-button-container">
                    <form 
                        action="https://jl76z192i0.execute-api.us-east-1.amazonaws.com/Prod/create_checkout_session/" 
                        method="POST" 
                        target="_blank"
                    >
                        <button 
                            type="submit"
                            className="button-base button-purple subscription-page-button"
                        >
                            <b>Upgrade to Pro</b>
                        </button>
                    </form>
                    <a 
                        href="https://www.trymito.io/plans" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="button-base button-gray subscription-page-button"
                    >
                        <b>View Plans</b>
                    </a>
                </div>
            </div>
        </div>
    );
};
