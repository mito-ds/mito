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

const App = (): JSX.Element => {
    const [connections, setConnections] = useState<DBConnections>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
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

        fetchConnections();
    }, []);

    return (
        <div className="settings-widget">
            <h1>Mito AI Settings</h1>
            <div className="db-connections">
                <h2>Database Connections</h2>
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