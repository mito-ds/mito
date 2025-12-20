/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RulesForm } from '../../Extensions/SettingsManager/rules/RulesForm';
import { Rule } from '../../Extensions/SettingsManager/rules/models';

// Mock the LoadingCircle component
jest.mock('../../components/LoadingCircle', () => {
    return {
        __esModule: true,
        default: jest.fn(() => <div data-testid="loading-circle">Loading...</div>)
    };
});

// Mock the classNames utility
jest.mock('../../utils/classNames', () => ({
    classNames: jest.fn((...args) => args.filter(Boolean).join(' '))
}));

describe('RulesForm Component', () => {
    const mockRule: Rule = {
        name: '',
        description: '',
        ruleType: 'manual'
    };

    const defaultProps = {
        formData: mockRule,
        formError: null,
        onInputChange: jest.fn(),
        onSubmit: jest.fn(),
        onClose: jest.fn(),
        isEditing: false,
        onGoogleDriveUrlChange: jest.fn(),
        onFetchGoogleDriveContent: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Clear the DOM between tests to prevent multiple renders
        document.body.innerHTML = '';
    });

    describe('Form Rendering', () => {
        it('renders all form fields correctly', () => {
            render(<RulesForm {...defaultProps} />);

            // Check for required form elements
            expect(screen.getByLabelText('Rule Name')).toBeInTheDocument();
            expect(screen.getByLabelText('Rule Source')).toBeInTheDocument();
            expect(screen.getByLabelText('Rule Content')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Add Rule' })).toBeInTheDocument();
        });

        it('displays form error when provided', () => {
            const errorMessage = 'This is a test error';
            render(<RulesForm {...defaultProps} formError={errorMessage} />);

            expect(screen.getByText(errorMessage)).toBeInTheDocument();
            expect(screen.getByText(errorMessage)).toHaveClass('error');
        });

        it('shows correct button text for editing mode', () => {
            render(<RulesForm {...defaultProps} isEditing={true} />);

            expect(screen.getByRole('button', { name: 'Update Rule' })).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'Add Rule' })).not.toBeInTheDocument();
        });
    });

    describe('Input Handling', () => {
        it('calls onInputChange when rule name is changed', () => {
            const mockOnInputChange = jest.fn();
            render(<RulesForm {...defaultProps} onInputChange={mockOnInputChange} />);

            const nameInput = screen.getByLabelText('Rule Name');
            fireEvent.change(nameInput, { target: { value: 'Test Rule' } });

            expect(mockOnInputChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    target: expect.objectContaining({
                        name: 'name'
                    })
                })
            );
        });

        it('calls onInputChange when rule content is changed', () => {
            const mockOnInputChange = jest.fn();
            render(<RulesForm {...defaultProps} onInputChange={mockOnInputChange} />);

            const contentTextarea = screen.getByLabelText('Rule Content');
            fireEvent.change(contentTextarea, { target: { value: 'Test content' } });

            expect(mockOnInputChange).toHaveBeenCalledWith(
                expect.objectContaining({
                    target: expect.objectContaining({
                        name: 'description'
                    })
                })
            );
        });

        it('calls onSubmit when form is submitted', async () => {
            const mockOnSubmit = jest.fn().mockResolvedValue(undefined);
            render(<RulesForm {...defaultProps} onSubmit={mockOnSubmit} />);

            const form = screen.getByRole('button', { name: 'Add Rule' }).closest('form');
            fireEvent.submit(form!);

            await waitFor(() => {
                expect(mockOnSubmit).toHaveBeenCalled();
            });
        });

        it('calls onClose when cancel button is clicked', () => {
            const mockOnClose = jest.fn();
            render(<RulesForm {...defaultProps} onClose={mockOnClose} />);

            const cancelButton = screen.getByRole('button', { name: 'Cancel' });
            fireEvent.click(cancelButton);

            expect(mockOnClose).toHaveBeenCalled();
        });
    });

    describe('Rule Source Switching', () => {
        it('shows Google Docs section when Google Docs source is selected', () => {
            render(<RulesForm {...defaultProps} />);

            const sourceSelect = screen.getByLabelText('Rule Source');
            fireEvent.change(sourceSelect, { target: { value: 'google_doc' } });

            expect(screen.getByLabelText('Google Docs URL')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Fetch Content' })).toBeInTheDocument();
        });

        it('hides Google Docs section when manual source is selected', () => {
            render(<RulesForm {...defaultProps} />);

            // First switch to Google Docs
            const sourceSelect = screen.getByLabelText('Rule Source');
            fireEvent.change(sourceSelect, { target: { value: 'google_doc' } });

            // Then switch back to manual
            fireEvent.change(sourceSelect, { target: { value: 'manual' } });

            expect(screen.queryByLabelText('Google Docs URL')).not.toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'Fetch Content' })).not.toBeInTheDocument();
        });

        it('calls onGoogleDriveUrlChange when Google Docs URL is changed', () => {
            const mockOnGoogleDriveUrlChange = jest.fn();
            render(<RulesForm {...defaultProps} onGoogleDriveUrlChange={mockOnGoogleDriveUrlChange} />);

            // Switch to Google Docs source first
            const sourceSelect = screen.getByLabelText('Rule Source');
            fireEvent.change(sourceSelect, { target: { value: 'google_doc' } });

            const urlInput = screen.getByLabelText('Google Docs URL');
            fireEvent.change(urlInput, { target: { value: 'https://docs.google.com/document/d/test' } });

            expect(mockOnGoogleDriveUrlChange).toHaveBeenCalledWith('https://docs.google.com/document/d/test');
        });
    });

    describe('Google Docs URL Validation', () => {
        it('shows validation error for invalid Google Docs URL', () => {
            const formDataWithInvalidUrl = {
                ...mockRule,
                googleDriveUrl: 'https://invalid-url.com'
            };

            render(<RulesForm {...defaultProps} formData={formDataWithInvalidUrl} />);

            // Switch to Google Docs source
            const sourceSelect = screen.getByLabelText('Rule Source');
            fireEvent.change(sourceSelect, { target: { value: 'google_doc' } });

            expect(screen.getByText('Please enter a valid Google Docs URL')).toBeInTheDocument();
        });

        it('does not show validation error for valid Google Docs URL', () => {
            const formDataWithValidUrl = {
                ...mockRule,
                googleDriveUrl: 'https://docs.google.com/document/d/valid-doc-id'
            };

            render(<RulesForm {...defaultProps} formData={formDataWithValidUrl} />);

            // Switch to Google Docs source
            const sourceSelect = screen.getByLabelText('Rule Source');
            fireEvent.change(sourceSelect, { target: { value: 'google_doc' } });

            expect(screen.queryByText('Please enter a valid Google Docs URL')).not.toBeInTheDocument();
        });

        it('disables fetch button for invalid URL', () => {
            const formDataWithInvalidUrl = {
                ...mockRule,
                googleDriveUrl: 'https://invalid-url.com'
            };

            render(<RulesForm {...defaultProps} formData={formDataWithInvalidUrl} />);

            // Switch to Google Docs source
            const sourceSelect = screen.getByLabelText('Rule Source');
            fireEvent.change(sourceSelect, { target: { value: 'google_doc' } });

            const fetchButtons = screen.getAllByRole('button', { name: 'Fetch Content' });
            expect(fetchButtons[0]).toBeDisabled();
        });
    });

    describe('Loading States', () => {
        it('shows loading state during form submission', async () => {
            const mockOnSubmit = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
            render(<RulesForm {...defaultProps} onSubmit={mockOnSubmit} />);

            const form = screen.getByRole('button', { name: 'Add Rule' }).closest('form');
            fireEvent.submit(form!);

            // Check for loading state
            expect(screen.getByText('Adding Rule...')).toBeInTheDocument();
            expect(screen.getByTestId('loading-circle')).toBeInTheDocument();

            await waitFor(() => {
                expect(screen.queryByText('Adding Rule...')).not.toBeInTheDocument();
            });
        });

        it('shows loading state during Google Docs fetch', async () => {
            const mockOnFetchGoogleDriveContent = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
            const formDataWithValidUrl = {
                ...mockRule,
                googleDriveUrl: 'https://docs.google.com/document/d/valid-doc-id'
            };

            render(
                <RulesForm 
                    {...defaultProps} 
                    formData={formDataWithValidUrl}
                    onFetchGoogleDriveContent={mockOnFetchGoogleDriveContent}
                />
            );

            // Switch to Google Docs source
            const sourceSelect = screen.getByLabelText('Rule Source');
            fireEvent.change(sourceSelect, { target: { value: 'google_doc' } });

            const fetchButton = screen.getByRole('button', { name: 'Fetch Content' });
            fireEvent.click(fetchButton);

            // Check for loading state
            expect(screen.getByText('Fetching...')).toBeInTheDocument();
            expect(screen.getByTestId('loading-circle')).toBeInTheDocument();

            await waitFor(() => {
                expect(screen.queryByText('Fetching...')).not.toBeInTheDocument();
            });
        });
    });
});
