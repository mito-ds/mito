/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import { FREE_TIER_LIMIT_REACHED_ERROR_TITLE } from '../../../utils/errors';
import { STRIPE_PAYMENT_LINK } from '../../../utils/stripe';
import { logEvent } from '../../../restAPI/RestAPI';
import '../../../../style/AlertBlock.css';

// Add calendly link constant
const CALENDLY_LINK = 'https://calendly.com/jake_from_mito/mito-meeting'

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
            <div className="chat-message-alert-container upgrade">
                <div className="chat-message-alert">
                    <div className="alert-error-message">
                       Free Trial Limit Reached
                    </div>
                </div>
                <p className="alert-actions-title">
                    You&apos;ve used up your free trial of Mito AI for this month.
                </p>
                <p className="alert-actions-title" style={{marginTop: '0px', marginBottom: '5px'}}>
                    Choose how you&apos;d like to continue:
                </p>
                <ol style={{ margin: '0', paddingLeft: '20px' }}>
                    <li>
                        <form action={STRIPE_PAYMENT_LINK} method="POST" target="_blank" style={{ display: 'inline' }}>
                            <button 
                                type="submit"
                                className="secondary-option-link"
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    font: 'inherit',
                                    color: 'var(--purple-700)',
                                    textDecoration: 'underline',
                                    cursor: 'pointer',
                                    transition: 'color 0.2s ease'
                                }}
                            >
                                Upgrade to Mito Pro
                            </button>
                        </form>
                        {' '} for unlimited AI access and dedicated support
                    </li>
                    <li>
                        <button 
                            onClick={() => {
                                window.open(CALENDLY_LINK, '_blank');
                            }}
                            className="secondary-option-link"
                            style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                font: 'inherit',
                                color: 'var(--purple-700)',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                transition: 'color 0.2s ease'
                            }}
                        >
                            Schedule a call with our founders
                        </button>
                        {' '} to get 3 free months of Mito Pro
                    </li>
                    <li>
                        <a 
                            href="https://docs.trymito.io/mito-ai/configuring-ai-provider-keys"
                            target="_blank"
                            rel="noreferrer"
                            className="secondary-option-link"
                        >
                            Use your own API keys
                        </a>
                        {' '} to continue using Mito AI
                    </li>
                </ol>
            </div>
        )
    }

    return (
        <div className="chat-message-alert-container error">
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