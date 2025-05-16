import React from 'react';
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
        <>
            {Object.entries(connections).map(([name, connection]) => (
                <div key={name} className="connection-card">
                    <div className="connection-card-header">
                        <h3>{name}</h3>
                        <button
                            className="jp-mod-styled jp-mod-reject delete-button"
                            onClick={() => onDelete(name)}
                        >
                            Delete
                        </button>
                    </div>
                    <div className="connection-details">
                        <p><strong>Type:</strong> {connection.type}</p>
                        <p><strong>Username:</strong> {connection.username}</p>
                        <p><strong>Account:</strong> {connection.account}</p>
                        <p><strong>Warehouse:</strong> {connection.warehouse}</p>
                    </div>
                </div>
            ))}
        </>
    );
}; 