/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import { DBConnections, DBConnection } from './model';
import { ConnectionList } from './ConnectionList';
import { ConnectionForm } from './ConnectionForm';
import { requestAPI } from '../../../restAPI/utils';
import '../../../../style/DatabasePage.css';

export const DatabasePage = (): JSX.Element => {
    const [connections, setConnections] = useState<DBConnections>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState<DBConnection>({
        type: 'snowflake',
        username: '',
        password: '',
        account: '',
        warehouse: '',
    });
    const [formError, setFormError] = useState<string | null>(null);

    const fetchConnections = async (): Promise<void> => {
        const resp = await requestAPI<DBConnections>('db/connections')
        if (resp.error) {
            // Handle error case - you might want to show an error message to the user
            console.error('Failed to fetch database connections:', resp.error.message);
            setError(resp.error.message);
            setConnections({});
        } else if (resp.data) {
            setConnections(resp.data);
            setError(null);
        }
        setLoading(false);
    };

    useEffect(() => {
        void fetchConnections();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setFormError(null);

        const resp = await requestAPI<{ status: string; message: string; connection_id: string }>('db/connections', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        if (resp.error) {
            setFormError(resp.error.message);
            return;
        }

        if (resp.data) {
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
        }

    };

    const handleDelete = async (id: string): Promise<void> => {
        const resp = await requestAPI<{ status: string; message: string }>(`db/connections/${id}`, {
            method: 'DELETE',
        });

        if (resp.error) {
            setError(resp.error.message);
            return;
        }

        if (resp.data) {
            // Refresh the connections list
            await fetchConnections();
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
