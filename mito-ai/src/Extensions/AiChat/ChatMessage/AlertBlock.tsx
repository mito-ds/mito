/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import TextButton from '../../../components/TextButton';
import { FREE_TIER_LIMIT_REACHED_ERROR_TITLE } from '../../../utils/errors';
import { STRIPE_PAYMENT_LINK } from '../../../utils/stripe';
import { logEvent } from '../../../restAPI/RestAPI';

interface IAlertBlockProps {
    content: string;
    mitoAIConnectionErrorType: string | null;
}

const AlertBlock: React.FC<IAlertBlockProps> = ({ content, mitoAIConnectionErrorType }) => {
    const [showEmailDetails, setShowEmailDetails] = useState(false);

    // The first time this AlertBlock is rendered, log the error type
    useEffect(() => {
        void logEvent('alert_block_displayed', { 'type': mitoAIConnectionErrorType, 'error': content });
    }, []);

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
        <div className="chat-message-alert-container">
            <div className="chat-message-alert">
                <div className="alert-error-message">
                    &#9888; {content}
                </div>
            </div>
            <div>
                <p className="alert-actions-title">If this issue persists, we recommend:</p>
                <ul className="alert-actions-list">
                    <li>Restarting JupyterLab completely</li>
                    <li>Upgrading to the latest version of Mito AI</li>
                    <li>
                        Sending us an email to founders@sagacollab.com &nbsp; 
                        <div className="details-toggle">
                            <button 
                                type="button"
                                onClick={() => setShowEmailDetails(!showEmailDetails)}
                                className="toggle-button"
                            >
                                <span className="toggle-text"> Info to send us</span>
                                <span className={`toggle-caret ${showEmailDetails ? 'open' : ''}`}>
                                    ▼
                                </span>
                            </button>
                        </div>
                        {showEmailDetails && (
                            <div className="details-content">
                                <li>A screenshot of your entire Jupyter window</li>
                                <li>A screenshot of your browser&apos;s console. You can access this by right clicking on this error message, clicking &quot;Inspect&quot;, and then clicking the &quot;Console&quot; tab. Then find the red error message at the bottom of the console and screenshot it.</li>
                                <li>Your `pip list` output</li>
                            </div>
                        )}
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default AlertBlock;