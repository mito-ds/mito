/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { ConnectionList } from '../../Extensions/SettingsManager/database/ConnectionList';
import { DBConnections } from '../../Extensions/SettingsManager/database/model';

describe('ConnectionList', () => {
    it('should not display password fields', () => {
        // Create a mock connection with a password field
        const mockConnections: DBConnections = {
            'test-connection': {
                type: 'postgres',
                host: 'localhost',
                port: '5432',
                database: 'testdb',
                username: 'testuser',
                password: 'secretpassword' // This should not be displayed
            }
        };

        const mockOnDelete = jest.fn();

        render(
            <ConnectionList
                connections={mockConnections}
                loading={false}
                error={null}
                onDelete={mockOnDelete}
            />
        );

        // Verify that password is not displayed
        expect(screen.queryByText('secretpassword')).not.toBeInTheDocument();
        
        // Verify that other fields are displayed
        expect(screen.getByText('localhost')).toBeInTheDocument();
        expect(screen.getByText('5432')).toBeInTheDocument();
        expect(screen.queryAllByText('testdb').length).toBeGreaterThan(0);
        expect(screen.getByText('testuser')).toBeInTheDocument();
    });
});
