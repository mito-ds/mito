/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import { RulesForm } from './RulesForm';
import { Rule } from './models';
import { getRules, setRule } from '../../../RestAPI';
import { isValidFileName } from '../../../utils/fileName';

export const RulesPage = (): JSX.Element => {
    const [showModal, setShowModal] = useState(false);
    const [rules, setRules] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<Rule>({
        name: '',
        description: ''
    });
    const [formError, setFormError] = useState<string | null>(null);

    const fetchRules = async (): Promise<void> => {
        try {
            const rules = await getRules();
            setRules(rules);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();

        // TODO: Validate that the rule name is a valid file name
        setFormError(null);

        // Make sure tha the rule is a valid file name
        if (!isValidFileName(formData.name)) {
            setFormError('Invalid rule name. Rules must contain only alphanumeric characters, underscores, or hyphens.');
            return;
        }

        await setRule(formData.name, formData.description);
        setShowModal(false);
        setFormData({
            name: '',
            description: ''
        });
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

            {error && <p className="error">{error}</p>}
            
            <div className="rules-list">
                {rules && rules.length > 0 ? rules.map((rule) => (
                    <div key={rule} className="rule-item">
                        <div className="rule-content">
                            <h3 className="rule-name">{rule}</h3>
                            <p className="rule-description">Click update to edit this rule's description and settings.</p>
                        </div>
                        <div className="rule-actions">
                            <button 
                                className="button-base button-secondary"
                                onClick={() => {
                                    // TODO: Implement update functionality
                                    console.log('Update rule:', rule);
                                }}
                            >
                                Update
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="empty-state">
                        <p>No rules created yet. Add your first rule to get started!</p>
                    </div>
                )}
            </div>

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
