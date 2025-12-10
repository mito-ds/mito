/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import { setUserKey } from '../../restAPI/RestAPI';
import MitoLogo from '../../icons/MitoLogo';
import { logEvent } from '../../restAPI/RestAPI';
import { userSignupEvents } from '../../utils/userSignupEvents';
import '../../../style/SignUpForm.css';


interface SignUpFormProps {
    onSignUpSuccess?: () => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onSignUpSuccess }) => {
    const [email, setEmail] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        try {
            await setUserKey('user_email', email);
            onSignUpSuccess?.();
            // Emit signup success event for other components to listen to
            userSignupEvents.emitSignupSuccess();
        } catch (error) {
            // If we can't set the email, we still want the user to be able to use Mito AI.
            console.error('Failed to set user email:', error);
            // 1. Set the soft signup flag, allowing the user to proceed without an email being set.
            localStorage.setItem('mito_ai_soft_signup', 'true');
            // 2. Emit the signup success event.
            onSignUpSuccess?.();
            userSignupEvents.emitSignupSuccess();
            // 3. Finally, if possible, log the error.
            void logEvent('mito_ai_failed_to_set_user_email', { 'error': error, 'email': email });
        }
    };

    return (
        <div className="signup-form-container">
            <div className="signup-form-header-logo">
                <MitoLogo width="60" height="30" />
            </div>
            <span className="signup-form-header">
                Sign Up for Mito
            </span>
            <div className="signup-form-message" data-testid="signup-form-message">
                To avoid abuse of our free AI credits, we ask that you login to use Mito AI. No credit card required, just an email.
            </div>
            <form onSubmit={handleSubmit} style={{ marginTop: '15px' }}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your work email"
                    className="signup-form-input"
                    required
                />
                <button
                    type="submit"
                    className="button-base signup-form-button"
                >
                    Sign Up
                </button>
            </form>
        </div>
    );
};

export default SignUpForm;
