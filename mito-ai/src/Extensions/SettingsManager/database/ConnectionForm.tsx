/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import { DBConnection, DatabaseField, databaseConfigs } from './model';
import '../../../../style/ConnectionForm.css';
import LoadingCircle from '../../../components/LoadingCircle';

interface ConnectionFormProps {
    formData: DBConnection;
    formError: string | null;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
}

export const ConnectionForm: React.FC<ConnectionFormProps> = ({
    formData,
    formError,
    onInputChange,
    onSubmit,
    onClose
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const selectedConfig = formData.type ? databaseConfigs[formData.type] : undefined;

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onSubmit(e);
        } finally {
            setIsLoading(false);
        }
    };

    const renderField = (field: DatabaseField): JSX.Element => {
        const commonProps = {
            id: field.name,
            name: field.name,
            value: formData[field.name] || '',
            onChange: onInputChange,
            placeholder: field.placeholder,
            required: field.required,
            className: 'form-control'
        };

        switch (field.type) {
            case 'select':
                return (
                    <select {...commonProps}>
                        <option value="">Select {field.label}</option>
                        {field.options?.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                );
            case 'number':
                return (
                    <input
                        {...commonProps}
                        type="number"
                    />
                );
            default:
                return (
                    <input
                        {...commonProps}
                        type={field.type}
                    />
                );
        }
    };

    return (
        <form onSubmit={handleSubmit} className="connection-form">
            {formError && <p className="error">{formError}</p>}
            {selectedConfig?.alertText && (
                <div className="alert-banner" dangerouslySetInnerHTML={{ __html: selectedConfig.alertText }} />
            )}

            <div className="form-group">
                <label htmlFor="type">Database Type</label>
                <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={onInputChange}
                    required
                >
                    <option value="">Select Database Type</option>
                    {Object.values(databaseConfigs).map(config => (
                        <option key={config.type} value={config.type}>
                            {config.displayName}
                        </option>
                    ))}
                </select>
            </div>

            {selectedConfig && selectedConfig.fields.map(field => (
                <div key={field.name} className="form-group">
                    <label htmlFor={field.name}>{field.label}</label>
                    {renderField(field)}
                </div>
            ))}

            <div className="form-info">
                <p>
                    Mito will automatically install any required database drivers when you connect.
                    <a
                        href="https://docs.trymito.io/mito-ai/database-connectors/database-drivers"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Learn more about database drivers
                    </a>
                </p>
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
                            Validating Connection<div style={{ color: 'var(--purple-700)' }}>
                                <LoadingCircle />
                            </div>
                        </>
                    ) : (
                        'Add Connection'
                    )}
                </button>
            </div>
        </form>
    );
}; 