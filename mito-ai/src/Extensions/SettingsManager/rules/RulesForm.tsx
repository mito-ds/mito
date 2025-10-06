/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState, useEffect } from 'react';
import LoadingCircle from '../../../components/LoadingCircle';
import '../../../../style/RulesForm.css';
import { Rule } from './models';
import { classNames } from '../../../utils/classNames';

interface RuleFormProps {
    formData: Rule;
    formError: string | null;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
    isEditing: boolean;
    onGoogleDriveUrlChange?: (url: string) => void;
    onFetchGoogleDriveContent?: (url: string) => Promise<void>;
}

export const RulesForm: React.FC<RuleFormProps> = ({
    formData,
    formError,
    onInputChange,
    onSubmit,
    onClose,
    isEditing,
    onGoogleDriveUrlChange,
    onFetchGoogleDriveContent
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingGoogleDocs, setIsFetchingGoogleDocs] = useState(false);
    const [ruleSource, setRuleSource] = useState<'manual' | 'google-docs'>('manual');
    
    const ruleSourceOptions = [
        { value: 'manual', label: 'Manual Entry' },
        { value: 'google-docs', label: 'Google Docs Link' }
    ];

    // Set initial rule source based on existing data
    useEffect(() => {
        if (formData.googleDriveUrl) {
            setRuleSource('google-docs');
        }
    }, [formData.googleDriveUrl]);

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onSubmit(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleDriveUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        onGoogleDriveUrlChange?.(url);
    };

    const handleFetchGoogleDocsContent = async () => {
        if (!formData.googleDriveUrl || !onFetchGoogleDriveContent) return;
        
        setIsFetchingGoogleDocs(true);
        try {
            await onFetchGoogleDriveContent(formData.googleDriveUrl);
        } catch (error) {
            console.error('Failed to fetch Google Docs content:', error);
        } finally {
            setIsFetchingGoogleDocs(false);
        }
    };

    const isValidGoogleDocsUrl = (url: string): boolean => {
        const googleDocsPattern = /^https:\/\/docs\.google\.com\/document\/d\/[a-zA-Z0-9-_]+/;
        return googleDocsPattern.test(url);
    };

    return (
        <form onSubmit={handleSubmit} className={classNames("connection-form", "rules-form")}>
            {formError && <p className="error">{formError}</p>}

            <div className="form-group">
                <label htmlFor="name">Rule Name</label>
                <sub>
                    <span>Rules must contain only alphanumeric characters, underscores, or hyphens.</span>
                </sub>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={onInputChange}
                    placeholder="Enter rule name"
                    required
                />

            </div>

            <div className="form-group">
                <label htmlFor="ruleSource">Rule Source</label>
                <select
                    id="ruleSource"
                    name="ruleSource"
                    value={ruleSource}
                    onChange={(e) => setRuleSource(e.target.value as 'manual' | 'google-docs')}
                    className="form-select"
                >
                    {ruleSourceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            {ruleSource === 'google-docs' && (
                <div className="form-group google-docs-section">
                    <label htmlFor="googleDriveUrl">Google Docs URL</label>
                    <sub>
                        <span>Paste a public Google Docs link. Then fetch the content to double check you selected the correct content.</span>
                    </sub>
                    <div className="google-docs-input-group">
                        <input
                            type="url"
                            id="googleDriveUrl"
                            name="googleDriveUrl"
                            value={formData.googleDriveUrl || ''}
                            onChange={handleGoogleDriveUrlChange}
                            placeholder="https://docs.google.com/document/d/..."
                            className={classNames(
                                "form-input",
                                formData.googleDriveUrl && !isValidGoogleDocsUrl(formData.googleDriveUrl) ? "rule-validation-error" : ""
                            )}
                        />
                        <button
                            type="button"
                            className="button-base button-gray"
                            onClick={handleFetchGoogleDocsContent}
                            disabled={!formData.googleDriveUrl || !isValidGoogleDocsUrl(formData.googleDriveUrl) || isFetchingGoogleDocs}
                        >
                            {isFetchingGoogleDocs ? (
                                <div className="loading-spinner">
                                    <LoadingCircle />
                                    Fetching...
                                </div>
                            ) : (
                                'Fetch Content'
                            )}
                        </button>
                    </div>
                    {formData.googleDriveUrl && !isValidGoogleDocsUrl(formData.googleDriveUrl) && (
                        <p className="rule-validation-error">Please enter a valid Google Docs URL</p>
                    )}
                </div>
            )}

            <div className="form-group">
                <label htmlFor="description">Rule Content</label>
                {ruleSource === 'google-docs' && (
                    <sub>
                        <span>Preview the rule content below. Then click the Add Rule button below.</span>
                    </sub>
                )}
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={onInputChange}
                    placeholder={ruleSource === 'google-docs' ? "Content will be fetched from Google Docs..." : "Enter or paste rule content here"}
                    rows={20}
                    required
                    className="form-textarea"
                    readOnly={ruleSource === 'google-docs' && !formData.description}
                />
                {ruleSource === 'google-docs' && formData.lastUpdated && (
                    <sub>
                        <span>Last updated: {new Date(formData.lastUpdated).toLocaleString()}</span>
                    </sub>
                )}
            </div>

            <div className="form-actions">
                <button
                    type="button"
                    className="button-base button-gray"
                    onClick={onClose}
                    disabled={isLoading}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="button-base button-purple"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <div className="loading-spinner">
                            <LoadingCircle />
                            {isEditing ? 'Updating Rule...' : 'Adding Rule...'}
                        </div>
                    ) : (
                        isEditing ? 'Update Rule' : 'Add Rule'
                    )}
                </button>
            </div>
        </form>
    );
}; 