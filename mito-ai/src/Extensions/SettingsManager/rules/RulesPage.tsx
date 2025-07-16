/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import { RulesForm } from './RulesForm';
import { Rule } from './models';
import { getRule, getRules, setRule, deleteRule, renameRule } from '../../../restAPI/RestAPI';
import { isValidFileName, stripFileEnding } from '../../../utils/fileName';

export const RulesPage = (): JSX.Element => {
    const [modalStatus, setModalStatus] = useState<'new rule' | 'edit rule' | undefined>(undefined);
    const [rules, setRules] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [originalRuleName, setOriginalRuleName] = useState<string>('');

    const [formData, setFormData] = useState<Rule>({
        name: '',
        description: ''
    });
    const [formError, setFormError] = useState<string | null>(null);

    const fetchRules = async (): Promise<void> => {
        try {
            const rules = await getRules();
            setRules(rules.sort());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    useEffect(() => {
        void fetchRules();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();

        // Make sure tha the rule is a valid file name
        if (!isValidFileName(formData.name)) {
            setFormError('Invalid rule name. Rules must contain only alphanumeric characters, underscores, or hyphens.');
            return;
        } else {
            setFormError(null);
        }

        try {
            if (modalStatus === 'edit rule' && originalRuleName !== formData.name) {
                // Rule name changed during edit - use rename endpoint
                await renameRule(originalRuleName, formData.name, formData.description);
            } else {
                // Normal create or update (name didn't change)
                await setRule(formData.name, formData.description);
            }
            
            setModalStatus(undefined);
            setFormData({
                name: '',
                description: ''
            });
            setOriginalRuleName('');
            void fetchRules();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    const handleRuleClick = async (rule: string): Promise<void> => {
        const ruleContent = await getRule(rule);
        const ruleName = stripFileEnding(rule);
        setFormData({
            name: ruleName,
            description: ruleContent || ''
        });
        setOriginalRuleName(ruleName);
        setModalStatus('edit rule');
    };

    const handleDeleteRule = async (rule: string): Promise<void> => {
        if (!window.confirm(`Are you sure you want to delete the rule "${stripFileEnding(rule)}"? This action cannot be undone.`)) {
            return;
        }
        try {
            await deleteRule(rule);
            void fetchRules();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete rule');
        }
    };

    return (
        <div>
            <div className="settings-header">
                <h2>Rules</h2>
                <button
                    className="button-base button-purple"
                    onClick={() => setModalStatus('new rule')}
                >
                    <b>＋ Add Rule</b>
                </button>
            </div>
            <p>Rules provide more context to Ai models to help them follow your preferences, adhere to your organization&apos;s style guides, learn niche topics, and be a better colleague.</p>

            {error && <p className="error">{error}</p>}
            
            <div className="rules-list">
                {rules && rules.length > 0 ? rules.map((rule) => (
                    <div 
                        key={rule} 
                        className="rule-item"
                        onClick={() => void handleRuleClick(rule)}
                    >
                        <div className="rule-content">
                            <h4 className="rule-name">{stripFileEnding(rule)}</h4>
                            <p className="rule-description">Click update to edit this rule&apos;s description and settings.</p>
                        </div>
                        <div className="rule-actions">
                            <button 
                                className="button-base button-gray"
                            >
                                Update
                            </button>
                            <button
                                className="button-base button-red"
                                style={{ marginLeft: 8 }}
                                onClick={e => {
                                    e.stopPropagation();
                                    handleDeleteRule(rule);
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="empty-state">
                        <p>No rules created yet. Add your first rule to get started!</p>
                    </div>
                )}
            </div>

            {modalStatus && (
                <div className="modal-overlay">
                    <div className="modal-content modal-content-large" onClick={e => e.stopPropagation()}>
                        <RulesForm
                            formData={formData}
                            formError={formError}
                            onInputChange={handleInputChange}
                            onSubmit={handleSubmit}
                            onClose={() => {
                                setModalStatus(undefined);
                                setFormData({
                                    name: '',
                                    description: ''
                                });
                                setOriginalRuleName('');
                            }}
                            isEditing={modalStatus === 'edit rule'}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
