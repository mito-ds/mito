import React from 'react';

interface DeleteConfirmationProps {
    connectionName: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
    connectionName,
    onConfirm,
    onCancel
}) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content delete-confirm">
                <div className="modal-header">
                    <h2>Delete Connection</h2>
                    <button
                        className="jp-mod-styled jp-mod-reject"
                        onClick={onCancel}
                    >
                        ×
                    </button>
                </div>
                <p>Are you sure you want to delete the connection "{connectionName}"?</p>
                <p className="warning">This action cannot be undone.</p>
                <div className="form-actions">
                    <button
                        type="button"
                        className="jp-mod-styled jp-mod-reject"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="jp-mod-styled jp-mod-reject delete-confirm-button"
                        onClick={onConfirm}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}; 