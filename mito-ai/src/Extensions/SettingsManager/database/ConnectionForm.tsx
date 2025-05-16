import React from 'react';
import { NewConnectionForm } from './types';

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
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Add New Connection</h2>
                </div>
                <form onSubmit={onSubmit}>
                    {formError && <p className="error">{formError}</p>}
                    <div className="form-group">
                        <label htmlFor="name">Connection Name:</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={onInputChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="type">Type:</label>
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
                        <label htmlFor="username">Username:</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={onInputChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password:</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={onInputChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="account">Account:</label>
                        <input
                            type="text"
                            id="account"
                            name="account"
                            value={formData.account}
                            onChange={onInputChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="warehouse">Warehouse:</label>
                        <input
                            type="text"
                            id="warehouse"
                            name="warehouse"
                            value={formData.warehouse}
                            onChange={onInputChange}
                            required
                        />
                    </div>
                    <div className="form-actions">
                        <button
                            type="button"
                            className="jp-mod-styled jp-mod-reject"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="jp-mod-styled jp-mod-accept"
                        >
                            Add Connection
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}; 