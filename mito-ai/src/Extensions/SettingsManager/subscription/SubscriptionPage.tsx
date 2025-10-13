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
        <div>
            <div className="settings-header">
                <h2>Manage Subscription</h2>
            </div>

            {isPro ? <ProCard /> : <FreeTierCard />}
        </div>
    );
};
