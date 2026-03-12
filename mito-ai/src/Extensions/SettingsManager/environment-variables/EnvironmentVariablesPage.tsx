/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import { getEnvVars, setEnvVar, deleteEnvVar } from '../../../restAPI/RestAPI';
import '../../../../style/EnvironmentVariablesPage.css';
import '../../../../style/button.css';

export const EnvironmentVariablesPage = (): JSX.Element => {
    const [envVars, setEnvVars] = useState<Record<string, string>>({});
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    const [error, setError] = useState<string | undefined>(undefined);
    const [editingKey, setEditingKey] = useState<string | undefined>(undefined);
    const [editingValue, setEditingValue] = useState('');

    useEffect(() => {
        void fetchEnvVars();
    }, []);

    const fetchEnvVars = async (): Promise<void> => {
        const vars = await getEnvVars();
        setEnvVars(vars);
    };

    const handleAdd = async (): Promise<void> => {
        const key = newKey.trim();
        const value = newValue.trim();
        if (!key) {
            setError('Variable name cannot be empty.');
            return;
        }
        setError(undefined);
        await setEnvVar(key, value);
        setNewKey('');
        setNewValue('');
        await fetchEnvVars();
    };

    const handleDelete = async (key: string): Promise<void> => {
        await deleteEnvVar(key);
        await fetchEnvVars();
    };

    const handleEditSave = async (key: string): Promise<void> => {
        await setEnvVar(key, editingValue);
        setEditingKey(undefined);
        await fetchEnvVars();
    };

    const startEditing = (key: string, currentValue: string): void => {
        setEditingKey(key);
        setEditingValue(currentValue);
    };

    const entries = Object.entries(envVars);

    return (
        <div>
            <div className="settings-header">
                <h2>Environment Variables</h2>
            </div>

            <div className="env-vars-list">
                {entries.length > 0 ? entries.map(([key, value]) => (
                    <div key={key} className="env-var-item">
                        <span className="env-var-key">{key}</span>
                        {editingKey === key ? (
                            <input
                                className="env-var-edit-input"
                                type="text"
                                value={editingValue}
                                onChange={e => setEditingValue(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') void handleEditSave(key); }}
                                autoFocus
                            />
                        ) : (
                            <span className="env-var-masked-value">
                                {'•'.repeat(Math.min(value.length, 20))}
                            </span>
                        )}
                        <div className="env-var-actions">
                            {editingKey === key ? (
                                <>
                                    <button
                                        className="button-base button-purple"
                                        onClick={() => void handleEditSave(key)}
                                    >
                                        Save
                                    </button>
                                    <button
                                        className="button-base button-gray"
                                        onClick={() => setEditingKey(undefined)}
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        className="button-base button-gray"
                                        onClick={() => startEditing(key, value)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="button-base button-red"
                                        onClick={() => void handleDelete(key)}
                                    >
                                        Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )) : (
                    <div className="env-vars-empty-state">
                        <p>No environment variables set. Add one below to get started.</p>
                    </div>
                )}
            </div>

            <div className="env-vars-add-form">
                <strong>Add Environment Variable</strong>
                <div className="env-vars-add-row">
                    <input
                        className="env-vars-add-input env-vars-add-input-key"
                        type="text"
                        placeholder="Name (e.g. OPENAI_API_KEY)"
                        value={newKey}
                        onChange={e => setNewKey(e.target.value)}
                    />
                    <input
                        className="env-vars-add-input env-vars-add-input-value"
                        type="text"
                        placeholder="Value"
                        value={newValue}
                        onChange={e => setNewValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') void handleAdd(); }}
                    />
                    <button
                        className="button-base button-purple"
                        onClick={() => void handleAdd()}
                    >
                        <b>＋ Add</b>
                    </button>
                </div>
                {error && <p className="env-vars-error">{error}</p>}
            </div>

            <div className="env-vars-restart-notice">
                <p><strong>After saving, restart the server for changes to take effect:</strong></p>
                <ul>
                    <li><strong>JupyterLab:</strong> Shut down the server from the terminal (<code>Ctrl+C</code>), then restart it (<code>jupyter lab</code>).</li>
                    <li><strong>JupyterHub:</strong> Open the <strong>File</strong> menu and select <strong>Hub Control Panel</strong>, then click <strong>Stop My Server</strong> and start it again.</li>
                </ul>
            </div>
        </div>
    );
};
