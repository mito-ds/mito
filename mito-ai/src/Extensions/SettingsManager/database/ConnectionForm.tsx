/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import { DBConnection } from './model';
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
        <form onSubmit={handleSubmit} className="connection-form">
            {formError && <p className="error">{formError}</p>}

            <div className="form-group">
                <label htmlFor="type">Database Type</label>
                <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={onInputChange}
                    required
                >
                    <option value="snowflake">Snowflake</option>
                </select>
            </div>

            <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={onInputChange}
                    placeholder="john.doe"
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={onInputChange}
                    placeholder="Enter your password"
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="account">Account</label>
                <input
                    type="text"
                    id="account"
                    name="account"
                    value={formData.account}
                    onChange={onInputChange}
                    placeholder="tudbfdr-ab12345"
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="warehouse">Warehouse</label>
                <input
                    type="text"
                    id="warehouse"
                    name="warehouse"
                    value={formData.warehouse}
                    onChange={onInputChange}
                    placeholder="COMPUTE_WH"
                    required
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