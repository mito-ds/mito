/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '../../../../style/SubscriptionPage.css';

export const ProCard = (): JSX.Element => {
    return (
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
    );
};

