import React, { useEffect, useState } from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import { PageConfig } from '@jupyterlab/coreutils';
import '../../../style/SettingsWidget.css';

interface DBConnection {
    type: string;
    username: string;
    password: string;
    account: string;
    warehouse: string;
}

interface DBConnections {
    [key: string]: DBConnection;
}

interface NewConnectionForm {
    name: string;
    type: string;
    username: string;
    password: string;
    account: string;
    warehouse: string;
}

const App = (): JSX.Element => {
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

    return (
        <div className="settings-widget">
            <h1>Mito AI Settings</h1>
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
                {loading && <p>Loading connections...</p>}
                {error && <p className="error">Error: {error}</p>}
                {!loading && !error && Object.keys(connections).length === 0 && (
                    <p>No database connections found.</p>
                )}
                {!loading && !error && Object.entries(connections).map(([name, connection]) => (
                    <div key={name} className="connection-card">
                        <h3>{name}</h3>
                        <div className="connection-details">
                            <p><strong>Type:</strong> {connection.type}</p>
                            <p><strong>Username:</strong> {connection.username}</p>
                            <p><strong>Account:</strong> {connection.account}</p>
                            <p><strong>Warehouse:</strong> {connection.warehouse}</p>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Add New Connection</h2>
                            <button 
                                className="jp-mod-styled jp-mod-reject"
                                onClick={() => setShowModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            {formError && <p className="error">{formError}</p>}
                            <div className="form-group">
                                <label htmlFor="name">Connection Name:</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="type">Type:</label>
                                <select
                                    id="type"
                                    name="type"
                                    value={formData.type}
                                    onChange={handleInputChange}
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
                                    onChange={handleInputChange}
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
                                    onChange={handleInputChange}
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
                                    onChange={handleInputChange}
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
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="form-actions">
                                <button 
                                    type="button" 
                                    className="jp-mod-styled jp-mod-reject"
                                    onClick={() => setShowModal(false)}
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
            )}
        </div>
    );
};

export class SettingsWidget extends ReactWidget {
    constructor() {
        super();
        this.addClass('jp-ReactWidget');
    }

    render(): JSX.Element {
        return <App />;
    }
}