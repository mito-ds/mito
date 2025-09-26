/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import '../../../style/CTACarousel.css';
// import '../../../style/SignUpForm.css';


const SignUpForm: React.FC = () => {
    const [email, setEmail] = useState<string>('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Email submitted:', email);
    };

    return (
        <div className="cta-carousel">
            <div className="">
                <div className="" data-testid="">
                    Get started with Mito, no credit card required, just an email. 
                </div>
                <form onSubmit={handleSubmit} style={{ marginTop: '15px' }}>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                        style={{
                            padding: '8px 12px',
                            border: '1px solid var(--jp-border-color1)',
                            borderRadius: 'var(--jp-border-radius)',
                            width: '200px',
                            marginRight: '8px',
                            height: '36px',
                            boxSizing: 'border-box'
                        }}
                    />
                    <button
                        type="submit"
                        className="button-base button-purple"
                        style={{
                            height: '36px',
                            boxSizing: 'border-box'
                        }}
                    >
                        Sign Up
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SignUpForm;
