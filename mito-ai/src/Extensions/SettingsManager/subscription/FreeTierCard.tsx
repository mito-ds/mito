/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import { getUserKey, logEvent } from '../../../restAPI/RestAPI';
import { STRIPE_PAYMENT_LINK } from '../../../utils/stripe';
import '../../../../style/SubscriptionPage.css';

const MAX_FREE_USAGE = 150;

export const FreeTierCard = (): JSX.Element => {
    const [usageCount, setUsageCount] = useState<number>(0);
    const [resetDate, setResetDate] = useState<string | null>(null);

    const percentage = Math.round((usageCount / MAX_FREE_USAGE) * 100);
    const remainingUsage = MAX_FREE_USAGE - usageCount;

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

    return (
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
                        <div>({percentage}% used)</div>
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
                    action={STRIPE_PAYMENT_LINK}
                    method="POST"
                    target="_blank"
                >
                    <button
                        type="submit"
                        className="button-base button-purple subscription-page-button"
                        onClick={() => {
                            void logEvent('clicked_upgrade_to_pro_from_settings', {
                                usage_count: usageCount,
                                usage_percentage: percentage,
                            });
                        }}
                    >
                        <b>Upgrade to Pro</b>
                    </button>
                </form>
                <a
                    href="https://www.trymito.io/plans"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button-base button-gray subscription-page-button"
                    onClick={() => {
                        void logEvent('clicked_view_plans_from_settings',
                            {
                                usage_count: usageCount,
                                usage_percentage: percentage,
                            }
                        );
                    }}
                >
                    <b>View Plans</b>
                </a>
            </div>
        </div>
    );
};

