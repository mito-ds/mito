/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import { RulesForm } from './RulesForm';
import { Rule } from './models';
import { setRule } from '../../../RestAPI';

export const RulesPage = (): JSX.Element => {
    const [showModal, setShowModal] = useState(false);

    console.log(showModal);

    const [formData, setFormData] = useState<Rule>({
        name: '',
        description: ''
    });
    const [formError, setFormError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();

        // TODO: Validate that the rule name is a valid file name
        setFormError(null);
        await setRule(formData.name, formData.description);
        setShowModal(false);
    };

    return (
        <div>
            <div className="settings-header">
                <h2>Rules</h2>
                <button
                    className="button-base button-purple"
                    onClick={() => setShowModal(true)}
                >
                    <b>＋ Add Rule</b>
                </button>
            </div>
            <p>Rules provide more context to Ai models to help them follow your preferences, adhere to your organization's style guides, learn niche topics, and be a better colleague.</p>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content modal-content-large" onClick={e => e.stopPropagation()}>
                        <RulesForm
                            formData={formData}
                            formError={formError}
                            onInputChange={handleInputChange}
                            onSubmit={handleSubmit}
                            onClose={() => setShowModal(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
