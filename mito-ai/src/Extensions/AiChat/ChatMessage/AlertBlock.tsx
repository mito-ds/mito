/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import TextButton from '../../../components/TextButton';
import { FREE_TIER_LIMIT_REACHED_ERROR_TITLE } from '../../../utils/errors';
import { STRIPE_PAYMENT_LINK } from '../../../utils/stripe';
import { logEvent } from '../../../restAPI/RestAPI';
import '../../../../style/AlertBlock.css';

// Add calendly link constant
const CALENDLY_LINK = 'https://calendly.com/your-calendly-link'; // Replace with actual calendly link

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
                <div>
                    <p className="alert-actions-title">
                        You&apos;ve used up your free trial of Mito AI for this month.
                    </p>
                    <div>
                        <p className="alert-actions-title" style={{ marginBottom: '8px' }}>
                            Mito Pro includes:
                        </p>
                        <ul className="alert-actions-list">
                            <li>Unlimited AI Chat and Agent</li>
                            <li>All Mito Spreadsheet Pro features</li>
                            <li>Dedicated support team</li>
                        </ul>
                    </div>
                    
                    <div style={{ marginTop: '20px' }}>
                        <p className="alert-actions-title" style={{ marginBottom: '16px' }}>
                            Choose how you&apos;d like to continue:
                        </p>
                        
                        <div style={{ 
                            display: 'flex', 
                            gap: '8px', 
                            marginBottom: '16px',
                            justifyContent: 'center'
                        }}>
                            <div style={{ flex: 1, maxWidth: '200px' }}>
                                <TextButton
                                    title="Upgrade to Pro"
                                    text="Upgrade to Pro"
                                    action={STRIPE_PAYMENT_LINK}
                                    variant="dark-purple"
                                    width="block"
                                />
                            </div>
                            <div style={{ flex: 1, maxWidth: '200px' }}>
                                <TextButton
                                    title="Schedule Call to Extend Trial"
                                    text="Schedule Call to Extend Trial"
                                    action={CALENDLY_LINK}
                                    variant="dark-purple"
                                    width="block"
                                />
                            </div>
                        </div>
                        
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: 0, fontStyle: 'italic' }}>
                                Or continue with your own{' '}
                                <a href="https://docs.trymito.io/mito-ai/configuring-ai-provider-keys" 
                                   target="_blank" 
                                   rel="noreferrer"
                                   style={{ fontStyle: 'italic' }}>
                                    API key
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
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