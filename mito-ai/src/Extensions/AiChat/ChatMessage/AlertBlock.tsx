/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import TextButton from '../../../components/TextButton';
import { FREE_TIER_LIMIT_REACHED_ERROR_TITLE } from '../../../utils/errors';
import { STRIPE_PAYMENT_LINK } from '../../../utils/stripe';


interface IAlertBlockProps {
    content: string;
    mitoAIConnectionErrorType: string | null;
}

const AlertBlock: React.FC<IAlertBlockProps> = ({ content, mitoAIConnectionErrorType }) => {

    if (mitoAIConnectionErrorType === FREE_TIER_LIMIT_REACHED_ERROR_TITLE) {
        return (
            <div className="chat-message-alert">
                <p>
                    You&apos;ve used up your free trial of Mito AI for this month. To continue using Mito AI now, upgrade to <a href="https://www.trymito.io/plans" target="_blank" rel="noreferrer">Mito Pro</a> and get access to:
                </p>
                <ul>
                    <li>Unlimited AI Chat and Agent</li>
                    <li>Unlimited AI Autocompletes</li>
                    <li>All Mito Spreadsheet Pro features</li>
                </ul>
                <p>
                    Or supply your own Open AI Key to continue using the basic version of Mito AI. 
                </p>
                <TextButton
                    title="Upgrade to Pro"
                    text="Upgrade to Pro"
                    action={STRIPE_PAYMENT_LINK}
                    variant="purple"
                    width="block"
                />
            </div>
        );
    }

    return (
        <div className="chat-message-alert">
            {content}
        </div>
    );
};

export default AlertBlock;