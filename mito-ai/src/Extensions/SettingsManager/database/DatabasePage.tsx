import React, { useEffect, useState } from 'react';
import { PageConfig } from '@jupyterlab/coreutils';
import { DBConnections, NewConnectionForm } from './types';
import { ConnectionList } from './ConnectionList';
import { ConnectionForm } from './ConnectionForm';
import { DeleteConfirmation } from './DeleteConfirmation';

export const DatabasePage = (): JSX.Element => {
    const [connections, setConnections] = useState<DBConnections>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState<NewConnectionForm>({
        name: '',
        type: 'snowflake',
        username: '',
        password: '',
        account: '',
        warehouse: ''
    });
    const [formError, setFormError] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ name: string } | null>(null);

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
                name: '',
                type: 'snowflake',
                username: '',
                password: '',
                account: '',
                warehouse: ''
            });
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    const handleDelete = async (name: string) => {
        try {
            const baseUrl = PageConfig.getBaseUrl();
            const response = await fetch(`${baseUrl}mito-ai/db/connections/${name}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete connection');
            }

            // Refresh the connections list
            await fetchConnections();
            setDeleteConfirm(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    return (
        <div className="db-connections">
            <div className="db-connections-header">
                <h2>Database Connections</h2>
                <button
                    className="jp-mod-styled jp-mod-accept"
                    onClick={() => setShowModal(true)}
                >
                    Add Connection
                </button>
            </div>

            <ConnectionList
                connections={connections}
                loading={loading}
                error={error}
                onDelete={(name) => setDeleteConfirm({ name })}
            />

            {showModal && (
                <ConnectionForm
                    formData={formData}
                    formError={formError}
                    onInputChange={handleInputChange}
                    onSubmit={handleSubmit}
                    onClose={() => setShowModal(false)}
                />
            )}

            {deleteConfirm && (
                <DeleteConfirmation
                    connectionName={deleteConfirm.name}
                    onConfirm={() => handleDelete(deleteConfirm.name)}
                    onCancel={() => setDeleteConfirm(null)}
                />
            )}
        </div>
    );
};
