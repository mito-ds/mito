/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import { getUserKey } from '../../../restAPI/RestAPI';
import { FreeTierCard } from './FreeTierCard';
import '../../../../style/SubscriptionPage.css';

export const SubscriptionPage = (): JSX.Element => {
    const [isPro, setIsPro] = useState<boolean>(false);

    // When we first open the page, load the settings from the server
    useEffect(() => {
        const fetchSettings = async (): Promise<void> => {
            const proStatus = await getUserKey('is_pro');
            console.log('proStatus', proStatus);
            setIsPro(false);
        };
        void fetchSettings();
    }, []);

    return (
        <div className="subscription-page-container">
            <div className="subscription-page-header">
                <h2 className="subscription-page-title">Manage Subscription</h2>
                <p className="subscription-page-subtitle">
                    {isPro ? 'You are on the Pro plan' : 'Track your usage and manage your plan'}
                </p>
            </div>

            {isPro ? (
                <div className="subscription-page-card">
                    <div className="subscription-page-card-content">
                        <h3 className="subscription-page-section-title">
                            Mito Pro
                        </h3>
                        <p className="subscription-page-status-message">
                            ✓ You have unlimited access to Mito AI
                        </p>
                    </div>
                </div>
            ) : (
                <FreeTierCard />
            )}
        </div>
    );
};
