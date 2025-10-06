/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import { RulesForm } from './RulesForm';
import { Rule } from './models';
import { getRule, getRules, setRule, fetchGoogleDriveContent } from '../../../restAPI/RestAPI';
import { isValidFileName, stripFileEnding } from '../../../utils/fileName';

export const RulesPage = (): JSX.Element => {
    const [modalStatus, setModalStatus] = useState<'new rule' | 'edit rule' | undefined>(undefined);
    const [rules, setRules] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<Rule>({
        name: '',
        description: '',
        googleDriveUrl: '',
        lastUpdated: '',
        ruleType: 'manual'
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
        const initializeRules = async () => {
            // Then fetch all rules
            await fetchRules();
        };
        
        void initializeRules();
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

        await setRule(formData.name, formData.description, formData.ruleType, formData.googleDriveUrl);
        setModalStatus(undefined);
        setFormData({
            name: '',
            description: '',
            googleDriveUrl: '',
            lastUpdated: '',
            ruleType: 'manual'
        });
        void fetchRules();
    };

    const handleRuleClick = async (rule: string): Promise<void> => {
        const ruleData = await getRule(rule);
        if (ruleData) {
            const formDataToSet: Rule = {
                name: stripFileEnding(rule),
                description: ruleData.content || '',
                googleDriveUrl: ruleData.google_drive_url || '',
                lastUpdated: ruleData.last_updated || '',
                ruleType: ruleData.rule_type === 'google_doc' ? 'google_doc' : 'manual'
            };
            setFormData(formDataToSet);
        } else {
            setFormData({
                name: stripFileEnding(rule),
                description: '',
                googleDriveUrl: '',
                lastUpdated: '',
                ruleType: 'manual'
            });
        }
        setModalStatus('edit rule');
    };

    const handleGoogleDriveUrlChange = (url: string): void => {
        setFormData(prev => ({ ...prev, googleDriveUrl: url }));
    };

    const handleFetchGoogleDriveContent = async (url: string): Promise<void> => {
        try {
            const result = await fetchGoogleDriveContent(url);
            setFormData(prev => ({
                ...prev,
                description: result.content,
                lastUpdated: new Date().toISOString(),
                ruleType: 'google_doc'
            }));
        } catch (error) {
            setFormError(error instanceof Error ? error.message : 'Failed to fetch Google Docs content');
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
                        onClick={() => handleRuleClick(rule)}
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
                                    description: '',
                                    googleDriveUrl: '',
                                    lastUpdated: '',
                                    ruleType: 'manual'
                                });
                            }}
                            isEditing={modalStatus === 'edit rule'}
                            onGoogleDriveUrlChange={handleGoogleDriveUrlChange}
                            onFetchGoogleDriveContent={handleFetchGoogleDriveContent}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
