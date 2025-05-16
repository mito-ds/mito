import React, { useState } from 'react';
import { DBConnections } from './types';

interface ConnectionListProps {
    connections: DBConnections;
    loading: boolean;
    error: string | null;
    onDelete: (name: string) => void;
}

export const ConnectionList: React.FC<ConnectionListProps> = ({
    connections,
    loading,
    error,
    onDelete
}) => {
    const [clickedDelete, setClickedDelete] = useState<string | null>(null);

    if (loading) {
        return <p>Loading connections...</p>;
    }

    if (error) {
        return <p className="error">Error: {error}</p>;
    }

    if (Object.keys(connections).length === 0) {
        return <p>No database connections found.</p>;
    }

    return (
        <div className="connections-grid">
            {Object.entries(connections).map(([name, connection]) => (
                <div key={name} className="connection-card">
                    <div className="connection-card-header">
                        <h3>{name}</h3>
                    </div>
                    <div className="connection-type">
                        {connection.type}
                    </div>
                    <div className="connection-details">
                        <p><strong>Username:</strong> {connection.username}</p>
                        <p><strong>Account:</strong> {connection.account}</p>
                        <p><strong>Warehouse:</strong> {connection.warehouse}</p>
                    </div>
                    <div className="connection-actions">
                        {clickedDelete === name ? (
                            <div className="confirmation-buttons">
                                <button
                                    className="button-base button-red"
                                    onClick={() => onDelete(name)}
                                >
                                    Yes, I want to delete
                                </button>
                                <button
                                    className="button-base button-gray"
                                    onClick={() => setClickedDelete(null)}
                                >
                                    Nevermind
                                </button>
                            </div>
                        ) : (
                            <button
                                className="button-base button-red"
                                onClick={() => setClickedDelete(name)}
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