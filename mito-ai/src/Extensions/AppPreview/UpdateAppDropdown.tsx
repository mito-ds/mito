import React from 'react';

/**
 * React component for the update app dropdown.
 */
interface UpdateAppDropdownProps {
    onSubmit: (message: string) => void;
    onClose: () => void;
}

const UpdateAppDropdown: React.FC<UpdateAppDropdownProps> = ({ onSubmit, onClose }) => {
    const [message, setMessage] = React.useState('');

    const handleSubmit = () => {
        if (message.trim()) {
            onSubmit(message);
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <div
            style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                zIndex: 1000,
                backgroundColor: 'var(--jp-layout-color1)',
                border: '1px solid var(--jp-border-color1)',
                borderRadius: '3px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                minWidth: '300px',
                maxWidth: '500px'
            }}
            onKeyDown={handleKeyDown}
        >
            <div style={{ padding: '12px' }}>
                <label
                    htmlFor="update-description"
                    style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '500',
                        color: 'var(--jp-ui-font-color1)',
                        fontSize: 'var(--jp-ui-font-size1)'
                    }}
                >
                    How would you like to modify the app?
                </label>
                <textarea
                    id="update-description"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your changes (e.g., Change the title, Remove a plot, etc.)"
                    style={{
                        width: '100%',
                        minHeight: '100px',
                        padding: '8px',
                        border: '1px solid var(--jp-border-color1)',
                        borderRadius: '3px',
                        fontFamily: 'var(--jp-ui-font-family)',
                        fontSize: 'var(--jp-ui-font-size1)',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                        backgroundColor: 'var(--jp-input-background)',
                        color: 'var(--jp-ui-font-color1)'
                    }}
                    autoFocus
                />
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '8px',
                    marginTop: '12px'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '4px 8px',
                            border: 'none',
                            borderRadius: '3px',
                            backgroundColor: 'var(--jp-layout-color2)',
                            color: 'var(--jp-ui-font-color1)',
                            cursor: 'pointer',
                            fontFamily: 'var(--jp-ui-font-family)',
                            fontSize: 'var(--jp-ui-font-size0)'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!message.trim()}
                        style={{
                            padding: '4px 8px',
                            border: 'none',
                            borderRadius: '3px',
                            backgroundColor: message.trim() ? 'var(--purple-300)' : 'var(--jp-layout-color2)',
                            color: message.trim() ? 'var(--purple-700)' : 'var(--jp-ui-font-color2)',
                            cursor: message.trim() ? 'pointer' : 'not-allowed',
                            fontFamily: 'var(--jp-ui-font-family)',
                            fontSize: 'var(--jp-ui-font-size0)'
                        }}
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpdateAppDropdown;