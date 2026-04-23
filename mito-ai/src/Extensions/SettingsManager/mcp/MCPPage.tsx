/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import { requestAPI } from '../../../restAPI/utils';
import { MCPForm } from './MCPForm';
import {
    EMPTY_MCP_FORM,
    IMCPServerFormData,
    IMCPServers,
    parseArgs,
    parseEnv
} from './model';
import '../../../../style/DatabasePage.css';
import '../../../../style/MCPPage.css';

export const MCPPage = (): JSX.Element => {
    const [servers, setServers] = useState<IMCPServers>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState<IMCPServerFormData>(EMPTY_MCP_FORM);
    const [formError, setFormError] = useState<string | null>(null);
    const [clickedDelete, setClickedDelete] = useState<string | null>(null);

    const fetchServers = async (): Promise<void> => {
        setLoading(true);
        const resp = await requestAPI<IMCPServers>('mcp/servers');
        if (resp.error) {
            setError(resp.error.message);
            setServers({});
        } else if (resp.data) {
            setServers(resp.data);
            setError(null);
        }
        setLoading(false);
    };

    useEffect(() => {
        void fetchServers();
    }, []);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ): void => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setFormError(null);

        const [env, envError] = parseEnv(formData.envText);
        if (envError) {
            setFormError(envError);
            return;
        }

        const body = {
            name: formData.name.trim(),
            command: formData.command.trim(),
            args: parseArgs(formData.argsText),
            env
        };

        const resp = await requestAPI<{ connection_id: string }>('mcp/servers', {
            method: 'POST',
            body: JSON.stringify(body)
        });

        if (resp.error) {
            setFormError(resp.error.message);
            return;
        }

        await fetchServers();
        setShowModal(false);
        setFormData(EMPTY_MCP_FORM);
    };

    const handleDelete = async (id: string): Promise<void> => {
        const resp = await requestAPI<{ status: string }>(`mcp/servers/${id}`, {
            method: 'DELETE'
        });
        if (resp.error) {
            setError(resp.error.message);
            return;
        }
        setClickedDelete(null);
        await fetchServers();
    };

    const renderServers = (): JSX.Element => {
        if (loading) {
            return <p>Loading MCP servers...</p>;
        }

        if (error) {
            return <p className="error">Error: {error}</p>;
        }

        if (Object.keys(servers).length === 0) {
            return (
                <div className="no-connections-container">
                    <p>No MCP servers configured.</p>
                    <p>
                        Add a server to let Mito AI discover tools provided over
                        the <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer">Model Context Protocol</a>.
                    </p>
                </div>
            );
        }

        return (
            <div className="connections-grid">
                {Object.entries(servers).map(([id, server]) => (
                    <div key={id} className="connection-card">
                        <div className="connection-card-header">
                            <h3 className="connection-alias">{server.name}</h3>
                            <span className="connection-type">MCP</span>
                        </div>
                        <div className="connection-divider" />
                        <div className="connection-details">
                            <p>
                                <strong>Command:</strong>{' '}
                                <code>
                                    {server.command}
                                    {server.args && server.args.length > 0
                                        ? ' ' + server.args.join(' ')
                                        : ''}
                                </code>
                            </p>
                            {server.error ? (
                                <p className="error">
                                    <strong>Connection error:</strong> {server.error}
                                </p>
                            ) : (
                                <div className="mcp-tools">
                                    <strong>Tools ({server.tools?.length ?? 0}):</strong>
                                    {server.tools && server.tools.length > 0 ? (
                                        <ul>
                                            {server.tools.map(tool => (
                                                <li key={tool.name} title={tool.description}>
                                                    <strong>{tool.name}</strong>
                                                    {tool.description ? ` - ${tool.description}` : ''}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p>No tools reported.</p>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="connection-actions">
                            {clickedDelete === id ? (
                                <div className="confirmation-buttons">
                                    <button
                                        className="button-base button-red"
                                        onClick={() => handleDelete(id)}
                                    >
                                        Yes, delete
                                    </button>
                                    <button
                                        className="button-base button-gray"
                                        onClick={() => setClickedDelete(null)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button
                                    className="button-base button-red"
                                    onClick={() => setClickedDelete(id)}
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="mcp-servers">
            <div className="settings-header">
                <h2>MCP Servers</h2>
                <div className="header-buttons">
                    <button
                        className="button-base button-purple"
                        onClick={() => {
                            setFormData(EMPTY_MCP_FORM);
                            setFormError(null);
                            setShowModal(true);
                        }}
                    >
                        <b>＋ Add Server</b>
                    </button>
                </div>
            </div>

            {renderServers()}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add MCP Server</h3>
                            <button
                                className="modal-close-button"
                                onClick={() => setShowModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <MCPForm
                            formData={formData}
                            formError={formError}
                            onInputChange={handleInputChange}
                            onSubmit={handleSubmit}
                            onClose={() => setShowModal(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
