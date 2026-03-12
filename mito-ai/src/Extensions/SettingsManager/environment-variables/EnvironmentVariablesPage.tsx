/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import { getEnvVars, setEnvVar, deleteEnvVar } from '../../../restAPI/RestAPI';

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
            <p className="settings-option-description" style={{ marginLeft: 0, marginBottom: '16px' }}>
                Set environment variables that the backend will pick up. Useful for API keys and other configuration values. Changes take effect immediately without restarting the server.
            </p>

            {entries.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--jp-border-color1)' }}>
                            <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 500 }}>Name</th>
                            <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 500 }}>Value</th>
                            <th style={{ padding: '6px 8px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map(([key, value]) => (
                            <tr key={key} style={{ borderBottom: '1px solid var(--jp-border-color2)' }}>
                                <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontSize: '0.9em' }}>{key}</td>
                                <td style={{ padding: '6px 8px' }}>
                                    {editingKey === key ? (
                                        <input
                                            type="text"
                                            value={editingValue}
                                            onChange={e => setEditingValue(e.target.value)}
                                            style={{ width: '100%', boxSizing: 'border-box' }}
                                            autoFocus
                                        />
                                    ) : (
                                        <span style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>
                                            {'•'.repeat(Math.min(value.length, 20))}
                                        </span>
                                    )}
                                </td>
                                <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>
                                    {editingKey === key ? (
                                        <>
                                            <button onClick={() => void handleEditSave(key)} style={{ marginRight: '6px' }}>Save</button>
                                            <button onClick={() => setEditingKey(undefined)}>Cancel</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => startEditing(key, value)} style={{ marginRight: '6px' }}>Edit</button>
                                            <button onClick={() => void handleDelete(key)}>Delete</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <div className="settings-option">
                <strong>Add Environment Variable</strong>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Name (e.g. OPENAI_API_KEY)"
                        value={newKey}
                        onChange={e => setNewKey(e.target.value)}
                        style={{ flex: '1', minWidth: '160px' }}
                    />
                    <input
                        type="text"
                        placeholder="Value"
                        value={newValue}
                        onChange={e => setNewValue(e.target.value)}
                        style={{ flex: '2', minWidth: '200px' }}
                        onKeyDown={e => { if (e.key === 'Enter') void handleAdd(); }}
                    />
                    <button onClick={() => void handleAdd()}>Add</button>
                </div>
                {error && (
                    <p style={{ color: 'var(--jp-error-color1)', marginTop: '6px', fontSize: '0.9em' }}>{error}</p>
                )}
            </div>
        </div>
    );
};
