/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Notification, showDialog, Dialog } from '@jupyterlab/apputils';
import { parseChartConfig } from './utils/parser';
import { addChartField, logEvent } from '../../restAPI/RestAPI';
import { removeMarkdownCodeFormatting, PYTHON_CODE_BLOCK_START_WITH_NEW_LINE } from '../../utils/strings';
import '../../../style/AddFieldButton.css';

interface AddFieldButtonProps {
    code: string | null;
    onFieldAdded: (updatedCode: string) => void;
    clearPendingUpdate: () => void;
    onLoadingStateChange: (isLoading: boolean) => void;
}

/**
 * Component that renders a button to add a new field to the chart configuration.
 * When clicked, prompts the user for a description and uses LLM to add the field.
 */
const AddFieldButton: React.FC<AddFieldButtonProps> = ({
    code,
    onFieldAdded,
    clearPendingUpdate,
    onLoadingStateChange
}) => {

    /**
     * Handles adding a new field to the chart configuration.
     */
    const handleAddField = useCallback(async (): Promise<void> => {
        if (!code) {
            Notification.emit(
                'No source code available',
                'error',
                {
                    autoClose: 3000
                }
            );
            return;
        }

        // Create a component that manages its own input state
        // Use a ref to store the value so we can access it after dialog closes
        const inputValueRef = { current: '' };

        const InputDialogBody: React.FC = () => {
            const [value, setValue] = useState('');
            const textareaRef = React.useRef<HTMLTextAreaElement>(null);

            useEffect(() => {
                // Focus the textarea when component mounts
                // Use a small timeout to ensure the dialog is fully rendered and focusable
                const timeoutId = setTimeout(() => {
                    if (textareaRef.current) {
                        textareaRef.current.focus();
                        // Also select any existing text for better UX
                        textareaRef.current.select();
                    }
                }, 100);

                return () => clearTimeout(timeoutId);
            }, []);

            const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
                const newValue = e.target.value;
                setValue(newValue);
                inputValueRef.current = newValue;
            };

            return (
                <div>
                    <p>Describe what field you would like to add to the chart configuration:</p>
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={handleChange}
                        placeholder="e.g., font size for the title, background color, grid visibility..."
                        className="add-field-dialog-textarea"
                    />
                </div>
            );
        };

        // Show dialog to get user description
        const result = await showDialog({
            title: 'Add New Field',
            body: <InputDialogBody />,
            buttons: [
                Dialog.cancelButton({ label: 'Cancel' }),
                Dialog.okButton({ label: 'Add Field' })
            ],
            defaultButton: 1
        });

        if (!result.button.accept) {
            return;
        }

        // Get the input value from the ref
        const description = inputValueRef.current.trim();

        if (!description) {
            Notification.emit(
                'Please provide a description of the field you want to add',
                'warning',
                {
                    autoClose: 3000
                }
            );
            return;
        }

        // Log the field addition event with user input
        void logEvent('chart_wizard_add_chart_field', {
            user_input: description
        });

        // Clear any pending debounced updates
        clearPendingUpdate();

        onLoadingStateChange(true);
        try {
            // Get existing variable names
            const parsed = parseChartConfig(code);
            const existingVariables = parsed ? parsed.variables.map(v => v.name) : [];

            const response = await addChartField(code, description, existingVariables);
            if (response.updated_code) {
                // Check if the response contains a code block
                // If no code block is found, the AI couldn't add the field
                const hasCodeBlock = response.updated_code.includes(PYTHON_CODE_BLOCK_START_WITH_NEW_LINE);
                
                if (!hasCodeBlock) {
                    // AI couldn't add the field and didn't return a code block
                    console.log('AI response does not contain a code block - field addition was not possible.');
                    Notification.emit(
                        'Unable to add the requested field. Please try a different description or ensure your request is clear and applicable to chart configuration.',
                        'warning',
                        {
                            autoClose: 5000
                        }
                    );
                    return;
                }

                // Extract code from markdown code blocks if present
                const extractedCode = removeMarkdownCodeFormatting(response.updated_code);
                // Validate that extracted code is not empty
                if (!extractedCode || extractedCode.trim().length === 0) {
                    console.error('Error: Extracted code is empty. Cannot update notebook cell.');
                    Notification.emit(
                        'Failed to add field: The updated code is empty. Please try again.',
                        'error',
                        {
                            autoClose: 5000
                        }
                    );
                    return;
                }
                // Notify parent component of the updated code
                onFieldAdded(extractedCode);

                Notification.emit(
                    'Field added successfully!',
                    'success',
                    {
                        autoClose: 3000
                    }
                );
            } else {
                // Handle case where updated_code is missing, null, or empty
                console.error('Error: No updated code returned from server.');
                Notification.emit(
                    'Failed to add field: The server did not return updated code. Please try again.',
                    'error',
                    {
                        autoClose: 5000
                    }
                );
            }
        } catch (error) {
            console.error('Error adding field:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            Notification.emit(
                `Failed to add field: ${errorMessage}. Please try again.`,
                'error',
                {
                    autoClose: 5000
                }
            );
        } finally {
            onLoadingStateChange(false);
        }
    }, [code, onFieldAdded, clearPendingUpdate, onLoadingStateChange]);

    return (
        <div className="add-field-container">
            <button
                className="button-base button-purple add-field-button"
                onClick={handleAddField}
                type="button"
            >
                + Add New Field
            </button>
        </div>
    );
};

export default AddFieldButton;
