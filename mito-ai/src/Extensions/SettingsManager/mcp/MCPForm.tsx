/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import { IMCPServerFormData } from './model';
import '../../../../style/ConnectionForm.css';
import LoadingCircle from '../../../components/LoadingCircle';

interface IMCPFormProps {
    formData: IMCPServerFormData;
    formError: string | null;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onSubmit: (e: React.FormEvent) => Promise<void>;
    onClose: () => void;
}

export const MCPForm: React.FC<IMCPFormProps> = ({
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
        <form onSubmit={handleSubmit} className="connection-form mcp-form">
            {formError && <p className="error">{formError}</p>}

            <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={onInputChange}
                    placeholder="mito-ai"
                    className="form-control"
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="command">Command</label>
                <input
                    id="command"
                    name="command"
                    type="text"
                    value={formData.command}
                    onChange={onInputChange}
                    placeholder="uvx"
                    className="form-control"
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="argsText">Arguments</label>
                <textarea
                    id="argsText"
                    name="argsText"
                    value={formData.argsText}
                    onChange={onInputChange}
                    placeholder={'mito-ai-mcp'}
                    className="form-control"
                    rows={4}
                />
                <div className="settings-option-description">
                    One argument per line.
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="envText">Environment Variables (optional)</label>
                <textarea
                    id="envText"
                    name="envText"
                    value={formData.envText}
                    onChange={onInputChange}
                    placeholder={'API_KEY=...\nOTHER=value'}
                    className="form-control"
                    rows={4}
                />
                <div className="settings-option-description">
                    One KEY=VALUE per line.
                </div>
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
                            Verifying Server<div style={{ color: 'var(--purple-700)' }}>
                                <LoadingCircle />
                            </div>
                        </>
                    ) : (
                        'Add Server'
                    )}
                </button>
            </div>
        </form>
    );
};
