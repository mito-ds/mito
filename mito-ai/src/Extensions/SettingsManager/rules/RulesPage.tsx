/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import { RulesForm } from './RulesForm';
import { Rule } from './models';
import { deleteRule, getRule, getRules, setRule, RuleListItem } from '../../../restAPI/RestAPI';
import { slugifyRuleName, stripFileEnding } from '../../../utils/fileName';
import '../../../../style/button.css';

export const RulesPage = (): JSX.Element => {
    const [modalStatus, setModalStatus] = useState<'new rule' | 'edit rule' | undefined>(undefined);
    const [rules, setRules] = useState<RuleListItem[]>([]);
    const [error, setError] = useState<string | null>(null);

    const [editingRuleName, setEditingRuleName] = useState<string | null>(null);
    const [formData, setFormData] = useState<Rule>({
        name: '',
        description: '',
        isDefault: false
    });
    const [formError, setFormError] = useState<string | null>(null);

    const fetchRules = async (): Promise<void> => {
        try {
            const rulesList = await getRules();
            setRules(rulesList.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    useEffect(() => {
        void fetchRules();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
        const target = e.target;
        const name = target.name;
        const value = target.type === 'checkbox'
            ? (target as HTMLInputElement).checked
            : target.value;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();

        const slugifiedName = slugifyRuleName(formData.name);
        if (!slugifiedName) {
            setFormError('Rule name is required. Use letters, numbers, spaces, hyphens, or underscores.');
            return;
        }
        setFormError(null);

        await setRule(slugifiedName, formData.description, formData.isDefault);
        if (editingRuleName && editingRuleName !== slugifiedName) {
            await deleteRule(editingRuleName);
        }
        setModalStatus(undefined);
        setEditingRuleName(null);
        setFormData({
            name: '',
            description: '',
            isDefault: false
        });
        void fetchRules();
    };

    const handleRuleClick = async (ruleName: string): Promise<void> => {
        const ruleFile = ruleName.includes('.md') ? ruleName : `${ruleName}.md`;
        const { content: ruleContent, isDefault } = await getRule(ruleFile);
        const nameWithoutExt = stripFileEnding(ruleFile);
        setEditingRuleName(nameWithoutExt);
        setFormData({
            name: nameWithoutExt,
            description: ruleContent || '',
            isDefault
        });
        setModalStatus('edit rule');
    };

    const handleDeleteRule = async (e: React.MouseEvent, ruleItem: RuleListItem): Promise<void> => {
        e.stopPropagation();
        const ruleName = stripFileEnding(ruleItem.name);
        if (!window.confirm(`Are you sure you want to delete the rule "${ruleName}"?`)) {
            return;
        }
        try {
            await deleteRule(ruleName);
            if (editingRuleName === ruleName) {
                setModalStatus(undefined);
                setEditingRuleName(null);
                setFormData({ name: '', description: '', isDefault: false });
            }
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
                {rules && rules.length > 0 ? rules.map((ruleItem) => (
                    <div
                        key={ruleItem.name}
                        className="rule-item"
                        onClick={() => handleRuleClick(ruleItem.name)}
                    >
                        <div className="rule-content">
                            <h4 className="rule-name">
                                {stripFileEnding(ruleItem.name)}
                                {ruleItem.isDefault && (
                                    <span className="rule-badge">Default</span>
                                )}
                            </h4>
                        </div>
                        <div className="rule-actions">
                            <button
                                type="button"
                                className="button-base button-gray"
                            >
                                Update
                            </button>
                            <button
                                type="button"
                                className="button-base button-red"
                                onClick={e => handleDeleteRule(e, ruleItem)}
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
                                setEditingRuleName(null);
                                setFormData({
                                    name: '',
                                    description: '',
                                    isDefault: false
                                });
                            }}
                            isEditing={modalStatus === 'edit rule'}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
