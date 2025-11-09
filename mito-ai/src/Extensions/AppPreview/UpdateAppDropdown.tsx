/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '../../../style/EditAppDropdown.css';
import { classNames } from '../../utils/classNames';
import { createRoot } from 'react-dom/client';
import { startStreamlitPreviewAndNotify } from './utils';
import { NotebookPanel } from '@jupyterlab/notebook';
import { getNotebookIDAndSetIfNonexistant } from '../../utils/notebookMetadata';

/**
 * Show the update app dropdown.
 */
export const showUpdateAppDropdown = (
    buttonElement: HTMLElement, 
    notebookPanel: NotebookPanel
): void => {
    // Remove any existing dropdown
    const existingDropdown = document.querySelector('.update-app-dropdown');
    if (existingDropdown) {
        existingDropdown.remove();
    }

    const notebookPath = notebookPanel.context.path;
    const notebookID = getNotebookIDAndSetIfNonexistant(notebookPanel)

    // Create dropdown container
    const dropdownContainer = document.createElement('div');
    dropdownContainer.className = 'update-app-dropdown';

    // Position the dropdown below the button
    const buttonRect = buttonElement.getBoundingClientRect();
    dropdownContainer.style.top = `${buttonRect.bottom + 4}px`;
    dropdownContainer.style.left = `${buttonRect.left}px`;

    // Add to document
    document.body.appendChild(dropdownContainer);

    // Render the React component
    createRoot(dropdownContainer).render(
        <UpdateAppDropdown
            onSubmit={async (message) => {
                // Save the notebook first to ensure app reads up to date version
                await notebookPanel.context.save();
                await startStreamlitPreviewAndNotify(notebookPath, notebookID, true, message, 'Updating app...', 'App updated successfully!');
                dropdownContainer.remove();
            }}
            onClose={() => {
                dropdownContainer.remove();
            }}
        />
    );

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent): void => {
        if (!dropdownContainer.contains(event.target as Node) &&
            !buttonElement.contains(event.target as Node)) {
            dropdownContainer.remove();
            document.removeEventListener('mousedown', handleClickOutside);
        }
    };

    // Add click outside listener after a small delay to avoid immediate closure
    setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
    }, 100);
}


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
                        className={classNames('update-app-dropdown-button', 'update-app-dropdown-button-submit', { 'disabled': disabled })}
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpdateAppDropdown;