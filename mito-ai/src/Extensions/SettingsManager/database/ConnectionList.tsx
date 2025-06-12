/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import { DBConnections, databaseConfigs } from './model';

interface ConnectionListProps {
    connections: DBConnections;
    loading: boolean;
    error: string | null;
    onDelete: (id: string) => void;
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
            {Object.entries(connections).map(([id, connection]) => (
                <div key={id} className="connection-card">
                    <div className="connection-card-header">
                        <h3>{connection.type}</h3>
                    </div>
                    <div className="connection-details">
                        {databaseConfigs[connection.type]?.fields.map(field => {
                            // Skip password fields for security
                            if (field.type === 'password') return null;
                            
                            const value = connection[field.name];
                            // Only show fields that have values
                            if (value === undefined || value === '') return null;
                            
                            return (
                                <p key={field.name}>
                                    <strong>{field.label}:</strong> {value}
                                </p>
                            );
                        })}
                    </div>
                    <div className="connection-actions">
                        {clickedDelete === id ? (
                            <div className="confirmation-buttons">
                                <button
                                    className="button-base button-red"
                                    onClick={() => onDelete(id)}
                                >
                                    Yes, I want to delete
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