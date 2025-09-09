/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '@testing-library/jest-dom'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import ChatDropdown from '../../Extensions/AiChat/ChatMessage/ChatDropdown';
import { ExpandedVariable } from '../../Extensions/AiChat/ChatMessage/ChatInput';

// Mock the RestAPI functions
jest.mock('../../restAPI/RestAPI', () => ({
  ...jest.requireActual('../../restAPI/RestAPI'), // Import and retain default behavior
  getRules: jest.fn().mockResolvedValue(['Data Analysis', 'Visualization', 'Machine Learning']),
  getDatabaseConnections: jest.fn().mockResolvedValue({
    'conn-1': { alias: 'production_db', database: 'prod_data', type: 'postgres' },
    'conn-2': { alias: 'analytics_db', database: 'analytics', type: 'snowflake' },
    'conn-3': { alias: 'test_db', database: 'test_data', type: 'mysql' }
  })
}));

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
        it('renders the dropdown with max 3 of each type at the top', async () => {
            // Render with default props
            renderChatDropdown({ onSelect: onSelectMock });

            // Wait for rules to be loaded and rendered
            await waitFor(() => {
                expect(screen.getByText('Data Analysis')).toBeInTheDocument();
            });

            // Verify the dropdown container is in the document
            const dropdown = screen.getByTestId('chat-dropdown');
            expect(dropdown).toBeInTheDocument();

            // Verify all list items are rendered (not counting spans or other elements with similar test IDs)
            const options = screen.getAllByTestId(/^chat-dropdown-item-(?!type|name)/);
            // Expect 3 rules + 3 database connections + 5 variables (all variables are shown, extras moved to bottom)
            expect(options).toHaveLength(11);

            // Check individual items in the correct order - first 3 of each type at top, then extras at bottom
            expect(screen.getByTestId('chat-dropdown-item-Data Analysis')).toBeInTheDocument();
            expect(screen.getByTestId('chat-dropdown-item-Visualization')).toBeInTheDocument();
            expect(screen.getByTestId('chat-dropdown-item-Machine Learning')).toBeInTheDocument();
            expect(screen.getByTestId('chat-dropdown-item-production_db')).toBeInTheDocument();
            expect(screen.getByTestId('chat-dropdown-item-analytics_db')).toBeInTheDocument();
            expect(screen.getByTestId('chat-dropdown-item-test_db')).toBeInTheDocument();
            expect(screen.getByTestId('chat-dropdown-item-column')).toBeInTheDocument();
            expect(screen.getByTestId('chat-dropdown-item-df')).toBeInTheDocument();
            expect(screen.getByTestId('chat-dropdown-item-series')).toBeInTheDocument();
            
            // Verify that 'number' and 'text' variables are at the bottom of the list
            expect(screen.queryByTestId('chat-dropdown-item-number')).toBeInTheDocument();
            expect(screen.queryByTestId('chat-dropdown-item-text')).toBeInTheDocument();
            const numberItem = screen.getByTestId('chat-dropdown-item-number');
            const textItem = screen.getByTestId('chat-dropdown-item-text');
            expect(options[options.length - 2]).toBe(numberItem);
            expect(options[options.length - 1]).toBe(textItem);
        });

        

        it('displays the correct shortened types', async () => {
            // Render with default props
            renderChatDropdown({ onSelect: onSelectMock });

            // Wait for rules to be loaded and rendered
            await waitFor(() => {
                expect(screen.getByText('Data Analysis')).toBeInTheDocument();
            });

            // Check the shortened types are displayed correctly
            expect(screen.getByTestId('chat-dropdown-item-type-df').textContent).toBe('df');
            expect(screen.getByTestId('chat-dropdown-item-type-series').textContent).toBe('s');
            // Note: 'number' and 'text' variables are not shown due to 3-per-type limit
            // so we can't test them in this basic rendering test
        });

        it('displays "No variables found" when no options match', async () => {
            // Re-render with a filter that matches nothing
            renderChatDropdown({ filterText: 'nonexistent' });

            // Wait for rules to be loaded and filtered (or not found)
            await waitFor(() => {
                expect(screen.getByTestId('chat-dropdown-empty-item')).toBeInTheDocument();
            });

            // Check the empty message is displayed
            expect(screen.getByTestId('chat-dropdown-empty-item').textContent).toBe('No variables found');
        });
    });

    describe('Filtering', () => {
        it('filters options based on filterText', async () => {
            // Re-render with a filter
            renderChatDropdown({ filterText: 'df' });

            // Wait for rules to be loaded and filtered
            await waitFor(() => {
                expect(screen.queryByText('Data Analysis')).not.toBeInTheDocument();
            });

            // Only the 'df' option should be present (not 'column' since its parent_df is 'df', not its name)
            expect(screen.getByTestId('chat-dropdown-item-df')).toBeInTheDocument();
            expect(screen.queryByTestId('chat-dropdown-item-series')).not.toBeInTheDocument();
            expect(screen.queryByTestId('chat-dropdown-item-number')).not.toBeInTheDocument();
            expect(screen.queryByTestId('chat-dropdown-item-text')).not.toBeInTheDocument();
        });

        it('is case insensitive when filtering', async () => {
            // Re-render with uppercase filter
            renderChatDropdown({ filterText: 'DF' });

            // Wait for rules to be loaded and filtered
            await waitFor(() => {
                expect(screen.queryByText('Data Analysis')).not.toBeInTheDocument();
            });

            // 'df' should still match
            expect(screen.getByTestId('chat-dropdown-item-df')).toBeInTheDocument();
        });

        it('filters database connections by alias', async () => {
            // Re-render with database search
            renderChatDropdown({ filterText: 'production' });

            // Wait for database connections to be loaded and filtered
            await waitFor(() => {
                expect(screen.queryByText('Data Analysis')).not.toBeInTheDocument();
            });

            // Should find database by alias
            expect(screen.getByTestId('chat-dropdown-item-production_db')).toBeInTheDocument();
            expect(screen.queryByTestId('chat-dropdown-item-analytics_db')).not.toBeInTheDocument();
            expect(screen.queryByTestId('chat-dropdown-item-test_db')).not.toBeInTheDocument();
        });

        it('filters database connections by type', async () => {
            // Re-render with database type search
            renderChatDropdown({ filterText: 'postgres' });

            // Wait for database connections to be loaded and filtered
            await waitFor(() => {
                expect(screen.queryByText('Data Analysis')).not.toBeInTheDocument();
            });

            // Should find database by type
            expect(screen.getByTestId('chat-dropdown-item-production_db')).toBeInTheDocument();
            expect(screen.queryByTestId('chat-dropdown-item-analytics_db')).not.toBeInTheDocument();
            expect(screen.queryByTestId('chat-dropdown-item-test_db')).not.toBeInTheDocument();
        });

        it('shows all matches when searching (not limited to 3 per type)', async () => {
            // Create more variables to test the search behavior
            const manyVariables = [
                ...createMockVariables(),
                { variable_name: 'var1', type: '<class \'int\'>', value: 1 },
                { variable_name: 'var2', type: '<class \'int\'>', value: 2 },
                { variable_name: 'var3', type: '<class \'int\'>', value: 3 },
                { variable_name: 'var4', type: '<class \'int\'>', value: 4 },
            ];

            // Re-render with search text that matches multiple variables
            renderChatDropdown({ 
                options: manyVariables,
                filterText: 'var' 
            });

            // Wait for options to be loaded and filtered
            await waitFor(() => {
                expect(screen.getByTestId('chat-dropdown-item-var1')).toBeInTheDocument();
            });

            // Should show all variables that match 'var', not just 3
            expect(screen.getByTestId('chat-dropdown-item-var1')).toBeInTheDocument();
            expect(screen.getByTestId('chat-dropdown-item-var2')).toBeInTheDocument();
            expect(screen.getByTestId('chat-dropdown-item-var3')).toBeInTheDocument();
            expect(screen.getByTestId('chat-dropdown-item-var4')).toBeInTheDocument();
            
            // Should not show other variables that don't match
            expect(screen.queryByTestId('chat-dropdown-item-df')).not.toBeInTheDocument();
            expect(screen.queryByTestId('chat-dropdown-item-series')).not.toBeInTheDocument();
        });
    });

    describe('Selection', () => {
        it('calls onSelect with correct parameters when clicking an option', async () => {
            // Render with default props
            renderChatDropdown({ onSelect: onSelectMock });

            // Wait for rules to be loaded
            await waitFor(() => {
                expect(screen.getByText('Data Analysis')).toBeInTheDocument();
            });

            // Click the 'df' option
            fireEvent.click(screen.getByTestId('chat-dropdown-item-df'));

            // Check onSelect was called with the right parameters
            expect(onSelectMock).toHaveBeenCalledWith({
                type: 'variable',
                variable: defaultProps.options.find(v => v.variable_name === 'df')
            });

            // Reset mocks and re-render
            onSelectMock.mockClear();
            renderChatDropdown({ onSelect: onSelectMock });

            // Wait for rules to be loaded again after re-render
            await waitFor(() => {
                expect(screen.getByText('Data Analysis')).toBeInTheDocument();
            });

            // Click the 'column' option (which has a parent_df)
            fireEvent.click(screen.getByTestId('chat-dropdown-item-column'));

            // Check onSelect was called with the right parameters including parent_df
            expect(onSelectMock).toHaveBeenCalledWith({
                type: 'variable',
                variable: defaultProps.options.find(v => v.variable_name === 'column')
            });
        });
    });

    describe('Keyboard Navigation', () => {
        it('selects options with arrow keys and triggers selection with Enter', async () => {
            // Render with default props
            renderChatDropdown({ onSelect: onSelectMock });

            // Wait for rules to be loaded
            await waitFor(() => {
                expect(screen.getByText('Data Analysis')).toBeInTheDocument();
            });

            // Initially, first item should be selected (which is the first rule: "Data Analysis")
            const firstItem = screen.getByTestId('chat-dropdown-item-Data Analysis');
            expect(firstItem).toHaveClass('selected');

            // Press down arrow to select the next item (second rule: "Visualization")
            fireEvent.keyDown(document, { key: 'ArrowDown' });
            expect(firstItem).not.toHaveClass('selected');
            expect(screen.getByTestId('chat-dropdown-item-Visualization')).toHaveClass('selected');

            // Press down again to select the third rule
            fireEvent.keyDown(document, { key: 'ArrowDown' });
            expect(screen.getByTestId('chat-dropdown-item-Machine Learning')).toHaveClass('selected');

            // Press down again to select the first database (production_db)
            fireEvent.keyDown(document, { key: 'ArrowDown' });
            expect(screen.getByTestId('chat-dropdown-item-production_db')).toHaveClass('selected');

            // Press down again to select the second database (analytics_db)
            fireEvent.keyDown(document, { key: 'ArrowDown' });
            expect(screen.getByTestId('chat-dropdown-item-analytics_db')).toHaveClass('selected');

            // Press down again to select the third database (test_db)
            fireEvent.keyDown(document, { key: 'ArrowDown' });
            expect(screen.getByTestId('chat-dropdown-item-test_db')).toHaveClass('selected');

            // Press down again to select the first variable (column)
            fireEvent.keyDown(document, { key: 'ArrowDown' });
            expect(screen.getByTestId('chat-dropdown-item-column')).toHaveClass('selected');

            // Press down again to select df
            fireEvent.keyDown(document, { key: 'ArrowDown' });
            expect(screen.getByTestId('chat-dropdown-item-df')).toHaveClass('selected');

            // Press up arrow to go back to column
            fireEvent.keyDown(document, { key: 'ArrowUp' });
            expect(screen.getByTestId('chat-dropdown-item-column')).toHaveClass('selected');

            // Press Enter to select the current option (column)
            fireEvent.keyDown(document, { key: 'Enter' });
            expect(onSelectMock).toHaveBeenCalledWith({
                type: 'variable',
                variable: defaultProps.options.find(v => v.variable_name === 'column')
            });

            // Reset mocks and re-render
            onSelectMock.mockClear();
            renderChatDropdown({ onSelect: onSelectMock });

            // Wait for rules to be loaded again
            await waitFor(() => {
                expect(screen.getByText('Data Analysis')).toBeInTheDocument();
            });

            // Tab should also trigger selection of the first item (Data Analysis rule)
            fireEvent.keyDown(document, { key: 'Tab' });
            expect(onSelectMock).toHaveBeenCalledWith({
                type: 'rule',
                rule: 'Data Analysis'
            });
        });

        it('wraps selection when navigating past the first or last option', async () => {
            // Render with default props
            renderChatDropdown({ onSelect: onSelectMock });

            // Wait for rules to be loaded
            await waitFor(() => {
                expect(screen.getByText('Data Analysis')).toBeInTheDocument();
            });

            // Press up arrow when first item is selected to go to the last item
            fireEvent.keyDown(document, { key: 'ArrowUp' });
            // The last item should be the last variable (series) due to 3-per-type limit
            expect(screen.getByTestId('chat-dropdown-item-text')).toHaveClass('selected');

            // Press down arrow when last item is selected to go to the first item
            fireEvent.keyDown(document, { key: 'ArrowDown' });
            expect(screen.getByTestId('chat-dropdown-item-Data Analysis')).toHaveClass('selected');
        });
    });
}); 