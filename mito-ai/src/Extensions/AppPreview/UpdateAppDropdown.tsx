/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '../../../style/EditAppDropdown.css';
import { classNames } from '../../utils/classNames';

/**
 * React component for the update app dropdown.
 */
interface UpdateAppDropdownProps {
    onSubmit: (message: string) => void;
    onClose: () => void;
}

const UpdateAppDropdown: React.FC<UpdateAppDropdownProps> = ({ onSubmit, onClose }) => {
    const [message, setMessage] = React.useState('');

    const handleSubmit = (): void => {
        if (message.trim()) {
            onSubmit(message);
            onClose();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent): void => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    const disabled = message.trim() === '';

    return (
        <div
            className="update-app-dropdown"
            onKeyDown={handleKeyDown}
        >
            <div className="update-app-dropdown-content">
                <label
                    htmlFor="update-description"
                    className="update-app-dropdown-label"
                >
                    How would you like to modify the app?
                </label>
                <textarea
                    id="update-description"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your changes (e.g., Change the title, Remove a plot, etc.)"
                    className="update-app-dropdown-textarea"
                    autoFocus
                />
                <div className="update-app-dropdown-buttons">
                    <button
                        onClick={onClose}
                        className={classNames("update-app-dropdown-button", "update-app-dropdown-button-cancel")}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={disabled}
                        className={classNames('update-app-dropdown-button', 'update-app-dropdown-button-submit', {'disabled': disabled})}
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpdateAppDropdown;