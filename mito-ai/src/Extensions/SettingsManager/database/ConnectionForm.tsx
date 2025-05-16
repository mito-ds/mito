import React from 'react';
import { NewConnectionForm } from './types';
import '../../../../style/ConnectionForm.css';

interface ConnectionFormProps {
    formData: NewConnectionForm;
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
    return (
        <form onSubmit={onSubmit} className="connection-form">
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
                <label htmlFor="name">Connection Name</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={onInputChange}
                    placeholder="e.g., Production Snowflake"
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={onInputChange}
                    placeholder="e.g., john.doe"
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
                    placeholder="e.g., xy12345.us-east-1"
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
                    placeholder="e.g., COMPUTE_WH"
                    required
                />
            </div>

            <div className="form-actions">
                <button
                    type="button"
                    className="button-base button-gray"
                    onClick={onClose}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="button-base button-purple"
                >
                    Add Connection
                </button>
            </div>
        </form>
    );
}; 