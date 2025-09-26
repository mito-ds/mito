/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import { setUserKey } from '../../restAPI/RestAPI';
import '../../../style/SignUpForm.css';


interface SignUpFormProps {
    onSignUpSuccess?: () => void;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onSignUpSuccess }) => {
    const [email, setEmail] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await setUserKey('user_email', email);
            onSignUpSuccess?.();
        } catch (error) {
            console.error('Failed to set user email:', error);
        }
    };

    return (
        <div className="signup-form-container">
            <div className="signup-form-message" data-testid="signup-form-message">
                Get started with Mito, no credit card required, just an email.
            </div>
            <form onSubmit={handleSubmit} style={{ marginTop: '15px' }}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="signup-form-input"
                    required
                />
                <button
                    type="submit"
                    className="button-base button-purple signup-form-button"
                >
                    Sign Up
                </button>
            </form>
        </div>
    );
};

export default SignUpForm;
