/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import CTACarousel from '../../Extensions/AiChat/CTACarousel';

// Mock the JupyterFrontEnd
const mockApp = {
    commands: {
        execute: jest.fn()
    }
} as any;

describe('CTACarousel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders with a message', () => {
        render(<CTACarousel app={mockApp} />);

        // Check if any message is rendered
        const messageContainer = screen.getByTestId('cta-message');
        expect(messageContainer).toBeInTheDocument();
        expect(messageContainer.textContent).toBeTruthy();
    });

    it('renders navigation dots', () => {
        render(<CTACarousel app={mockApp} />);

        // Should have dots for navigation
        const dots = screen.getAllByRole('button', { name: '' });
        expect(dots.length).toBeGreaterThan(0);
    });

    it('changes message when clicking navigation dots', () => {
        render(<CTACarousel app={mockApp} />);

        // Get initial message
        const initialMessage = screen.getByTestId('cta-message').textContent;

        // Test clicking each dot
        const dots = screen.getAllByRole('button', { name: '' });
        dots.forEach((dot, index) => {
            if (index === 0) return; // Skip first dot as it's already shown

            fireEvent.click(dot);
            const newMessage = screen.getByTestId('cta-message').textContent;
            expect(newMessage).not.toBe(initialMessage);
        });
    });
});
