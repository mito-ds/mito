/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import { getUserKey } from '../../../restAPI/RestAPI';
import { FreeTierCard } from './FreeTierCard';
import { ProCard } from './ProCard';
import '../../../../style/SubscriptionPage.css';

export const SubscriptionPage = (): JSX.Element => {
    const [isPro, setIsPro] = useState<boolean>(false);

    // When we first open the page, load the settings from the server
    useEffect(() => {
        const fetchSettings = async (): Promise<void> => {
            const proStatus = await getUserKey('is_pro');
            setIsPro(proStatus === 'True');
        };
        void fetchSettings();
    }, []);

    return (
        <div className="subscription-page-container">
            <div className="subscription-page-header">
                <h2 className="subscription-page-title">Manage Subscription</h2>
                <p className="subscription-page-subtitle">
                    'Track your usage and manage your plan'
                </p>
            </div>

            {isPro ? <ProCard /> : <FreeTierCard />}
        </div>
    );
};
