/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
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
}

export const RulesForm: React.FC<RuleFormProps> = ({
    formData,
    formError,
    onInputChange,
    onSubmit,
    onClose,
    isEditing
}) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onSubmit(e);
        } finally {
            setIsLoading(false);
        }
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
                <label htmlFor="description">Rule Content</label>
                <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={onInputChange}
                    placeholder="Enter or paste rule content here"
                    rows={30}
                    required
                    className="form-textarea"
                />
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
                        <>
                            Saving Rule<div style={{ color: 'var(--purple-700)' }}>
                                <LoadingCircle />
                            </div>
                        </>
                    ) : (
                        isEditing ? 'Update Rule' : 'Add Rule'
                    )}
                </button>
            </div>
        </form>
    );
}; 