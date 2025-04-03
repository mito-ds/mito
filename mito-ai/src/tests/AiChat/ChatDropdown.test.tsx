/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '@testing-library/jest-dom'
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ChatDropdown from '../../Extensions/AiChat/ChatMessage/ChatDropdown';
import { ExpandedVariable } from '../../Extensions/AiChat/ChatMessage/ChatInput';

// Helper function to create mock variables
const createMockVariables = (): ExpandedVariable[] => {
    return [
        {
            variable_name: 'df',
            type: '<class \'pandas.core.frame.DataFrame\'>',
            value: {}, // Value is not used in the dropdown
        },
        {
            variable_name: 'series',
            type: '<class \'pandas.core.series.Series\'>',
            value: {},
        },
        {
            variable_name: 'number',
            type: '<class \'int\'>',
            value: 42,
        },
        {
            variable_name: 'text',
            type: '<class \'str\'>',
            value: 'hello',
        },
        {
            variable_name: 'column',
            type: '<class \'pandas.core.series.Series\'>',
            value: {},
            parent_df: 'df',
        }
    ];
};

// Helper function to create mock props
const createMockProps = (overrides = {}) => ({
    options: createMockVariables(),
    onSelect: jest.fn(),
    filterText: '',
    maxDropdownItems: 10,
    ...overrides
});

// Helper function to render the component
const renderChatDropdown = (props = {}) => {
    cleanup(); // Clean up previous renders
    return render(<ChatDropdown {...createMockProps(props)} />);
};

describe('ChatDropdown Component', () => {
    let onSelectMock: jest.Mock;
    let defaultProps: ReturnType<typeof createMockProps>;

    beforeEach(() => {
        // Clear any previous renders
        cleanup();

        // Create fresh mocks for each test
        onSelectMock = jest.fn();
        defaultProps = createMockProps({ onSelect: onSelectMock });
    });

    afterEach(() => {
        cleanup();
    });

    describe('Rendering', () => {
        it('renders the dropdown with all options', () => {
            // Render with default props
            renderChatDropdown({ onSelect: onSelectMock });

            // Verify the dropdown container is in the document
            const dropdown = screen.getByTestId('chat-dropdown');
            expect(dropdown).toBeInTheDocument();

            // Verify all list items are rendered (not counting spans or other elements with similar test IDs)
            const options = screen.getAllByTestId(/^chat-dropdown-item-(?!type|name)/);
            expect(options).toHaveLength(defaultProps.options.length);

            // Check individual items
            expect(screen.getByTestId('chat-dropdown-item-df')).toBeInTheDocument();
            expect(screen.getByTestId('chat-dropdown-item-series')).toBeInTheDocument();
            expect(screen.getByTestId('chat-dropdown-item-number')).toBeInTheDocument();
            expect(screen.getByTestId('chat-dropdown-item-text')).toBeInTheDocument();
            expect(screen.getByTestId('chat-dropdown-item-column')).toBeInTheDocument();
        });

        it('displays the correct shortened types', () => {
            // Render with default props
            renderChatDropdown({ onSelect: onSelectMock });

            // Check the shortened types are displayed correctly
            expect(screen.getByTestId('chat-dropdown-item-type-df').textContent).toBe('df');
            expect(screen.getByTestId('chat-dropdown-item-type-series').textContent).toBe('s');
            expect(screen.getByTestId('chat-dropdown-item-type-number').textContent).toBe('int');
            expect(screen.getByTestId('chat-dropdown-item-type-text').textContent).toBe('str');
        });

        it('displays "No variables found" when no options match', () => {
            // Re-render with a filter that matches nothing
            renderChatDropdown({ filterText: 'nonexistent' });

            // Check the empty message is displayed
            expect(screen.getByTestId('chat-dropdown-empty-item')).toBeInTheDocument();
            expect(screen.getByTestId('chat-dropdown-empty-item').textContent).toBe('No variables found');
        });
    });

    describe('Filtering', () => {
        it('filters options based on filterText', () => {
            // Re-render with a filter
            renderChatDropdown({ filterText: 'df' });

            // Only the 'df' option should be present (not 'column' since its parent_df is 'df', not its name)
            expect(screen.getByTestId('chat-dropdown-item-df')).toBeInTheDocument();
            expect(screen.queryByTestId('chat-dropdown-item-series')).not.toBeInTheDocument();
            expect(screen.queryByTestId('chat-dropdown-item-number')).not.toBeInTheDocument();
            expect(screen.queryByTestId('chat-dropdown-item-text')).not.toBeInTheDocument();
        });

        it('is case insensitive when filtering', () => {
            // Re-render with uppercase filter
            renderChatDropdown({ filterText: 'DF' });

            // 'df' should still match
            expect(screen.getByTestId('chat-dropdown-item-df')).toBeInTheDocument();
        });
    });

    describe('Selection', () => {
        it('calls onSelect with correct parameters when clicking an option', () => {
            // Render with default props
            renderChatDropdown({ onSelect: onSelectMock });

            // Click the 'df' option
            fireEvent.click(screen.getByTestId('chat-dropdown-item-df'));

            // Check onSelect was called with the right parameters
            expect(onSelectMock).toHaveBeenCalledWith('df', undefined);

            // Reset mocks and re-render
            onSelectMock.mockReset();
            renderChatDropdown({ onSelect: onSelectMock });

            // Click the 'column' option (which has a parent_df)
            fireEvent.click(screen.getByTestId('chat-dropdown-item-column'));

            // Check onSelect was called with the right parameters including parent_df
            expect(onSelectMock).toHaveBeenCalledWith('column', 'df');
        });

        it('limits the number of displayed options to maxDropdownItems', () => {
            // Create options that exceed the max
            const manyOptions = Array.from({ length: 15 }, (_, i) => ({
                variable_name: `var${i}`,
                type: '<class \'int\'>',
                value: i
            }));

            // Re-render with more options and a lower max
            renderChatDropdown({
                options: manyOptions,
                maxDropdownItems: 5
            });

            // Only 5 options should be displayed (count only list items)
            const options = screen.getAllByRole('listitem');
            expect(options).toHaveLength(5);
        });
    });

    describe('Keyboard Navigation', () => {
        it('selects options with arrow keys and triggers selection with Enter', () => {
            // Render with default props
            renderChatDropdown({ onSelect: onSelectMock });

            // Initially, first item should be selected
            const firstItem = screen.getByTestId('chat-dropdown-item-df');
            expect(firstItem).toHaveClass('selected');

            // Press down arrow to select the next item
            fireEvent.keyDown(document, { key: 'ArrowDown' });
            expect(firstItem).not.toHaveClass('selected');
            expect(screen.getByTestId('chat-dropdown-item-series')).toHaveClass('selected');

            // Press down again
            fireEvent.keyDown(document, { key: 'ArrowDown' });
            expect(screen.getByTestId('chat-dropdown-item-number')).toHaveClass('selected');

            // Press up arrow to go back
            fireEvent.keyDown(document, { key: 'ArrowUp' });
            expect(screen.getByTestId('chat-dropdown-item-series')).toHaveClass('selected');

            // Press Enter to select the current option
            fireEvent.keyDown(document, { key: 'Enter' });
            expect(onSelectMock).toHaveBeenCalledWith('series', undefined);

            // Reset mocks and re-render
            onSelectMock.mockReset();
            renderChatDropdown({ onSelect: onSelectMock });

            // Tab should also trigger selection
            fireEvent.keyDown(document, { key: 'Tab' });
            expect(onSelectMock).toHaveBeenCalledWith('df', undefined);
        });

        it('wraps selection when navigating past the first or last option', () => {
            // Render with default props
            renderChatDropdown({ onSelect: onSelectMock });

            // Press up arrow when first item is selected to go to the last item
            fireEvent.keyDown(document, { key: 'ArrowUp' });
            expect(screen.getByTestId('chat-dropdown-item-column')).toHaveClass('selected');

            // Press down arrow when last item is selected to go to the first item
            fireEvent.keyDown(document, { key: 'ArrowDown' });
            expect(screen.getByTestId('chat-dropdown-item-df')).toHaveClass('selected');
        });
    });
}); 