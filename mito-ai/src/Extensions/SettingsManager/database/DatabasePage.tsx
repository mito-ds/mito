import React, { useEffect, useState } from 'react';
import { PageConfig } from '@jupyterlab/coreutils';
import { DBConnections, NewConnectionForm } from './types';
import { ConnectionList } from './ConnectionList';
import { ConnectionForm } from './ConnectionForm';
import '../../../../style/DatabasePage.css';

export const DatabasePage = (): JSX.Element => {
    const [connections, setConnections] = useState<DBConnections>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState<NewConnectionForm>({
        type: 'snowflake',
        username: '',
        password: '',
        account: '',
        warehouse: '',
    });
    const [formError, setFormError] = useState<string | null>(null);

    const fetchConnections = async () => {
        try {
            const baseUrl = PageConfig.getBaseUrl();
            const response = await fetch(`${baseUrl}mito-ai/db/connections`);
            if (!response.ok) {
                throw new Error('Failed to fetch connections');
            }
            const data = await response.json();
            setConnections(data);
            setLoading(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConnections();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        try {
            const baseUrl = PageConfig.getBaseUrl();
            const response = await fetch(`${baseUrl}mito-ai/db/connections`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to create connection');
            }

            // Refresh the connections list
            await fetchConnections();
            setShowModal(false);
            setFormData({
                type: 'snowflake',
                username: '',
                password: '',
                account: '',
                warehouse: '',
            });
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const baseUrl = PageConfig.getBaseUrl();
            const response = await fetch(`${baseUrl}mito-ai/db/connections/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete connection');
            }

            // Refresh the connections list
            await fetchConnections();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    return (
        <div className="db-connections">
            <div className="settings-header">
                <h2>Database Connections</h2>
                <button
                    className="button-base button-purple"
                    onClick={() => setShowModal(true)}
                >
                    <b>＋ Add Connection</b>
                </button>
            </div>

            <ConnectionList
                connections={connections}
                loading={loading}
                error={error}
                onDelete={handleDelete}
            />

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Add New Connection</h3>
                            <button
                                className="modal-close-button"
                                onClick={() => setShowModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <ConnectionForm
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
