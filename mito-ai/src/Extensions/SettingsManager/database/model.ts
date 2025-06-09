/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

export interface DBConnection {
    type: string;
    [key: string]: string | number | undefined;
}

export interface DBConnections {
    [key: string]: DBConnection;  // key is now UUID
}

export interface DatabaseField {
    name: string;
    type: 'text' | 'password' | 'number' | 'select';
    label: string;
    placeholder?: string;
    required: boolean;
    options?: Array<{ value: string; label: string }>;
}

export interface DatabaseConfig {
    type: string;
    displayName: string;
    fields: DatabaseField[];
}

export const databaseConfigs: Record<string, DatabaseConfig> = {
    mysql: {
        type: 'mysql',
        displayName: 'MySQL',
        fields: [
            {
                name: 'username',
                type: 'text',
                label: 'Username',
                placeholder: 'john.doe',
                required: true
            },
            {
                name: 'password',
                type: 'password',
                label: 'Password',
                placeholder: 'Enter your password',
                required: true
            },
            {
                name: 'host',
                type: 'text',
                label: 'Host',
                placeholder: 'localhost',
                required: true
            },
            {
                name: 'port',
                type: 'number',
                label: 'Port',
                placeholder: '3306',
                required: true
            },
            {
                name: 'database',
                type: 'text',
                label: 'Database',
                placeholder: 'mydb',
                required: true
            }
        ]
    },
    postgres: {
        type: 'postgres',
        displayName: 'PostgreSQL',
        fields: [
            {
                name: 'username',
                type: 'text',
                label: 'Username',
                placeholder: 'john.doe',
                required: true
            },
            {
                name: 'password',
                type: 'password',
                label: 'Password',
                placeholder: 'Enter your password',
                required: true
            },
            {
                name: 'host',
                type: 'text',
                label: 'Host',
                placeholder: 'localhost',
                required: true
            },
            {
                name: 'port',
                type: 'number',
                label: 'Port',
                placeholder: '5432',
                required: true
            },
            {
                name: 'database',
                type: 'text',
                label: 'Database',
                placeholder: 'mydb',
                required: true
            }
        ]
    },
    snowflake: {
        type: 'snowflake',
        displayName: 'Snowflake',
        fields: [
            {
                name: 'username',
                type: 'text',
                label: 'Username',
                placeholder: 'john.doe',
                required: true
            },
            {
                name: 'password',
                type: 'password',
                label: 'Password',
                placeholder: 'Enter your password',
                required: true
            },
            {
                name: 'account',
                type: 'text',
                label: 'Account',
                placeholder: 'tudbfdr-ab12345',
                required: true
            },
            {
                name: 'warehouse',
                type: 'text',
                label: 'Warehouse',
                placeholder: 'COMPUTE_WH',
                required: true
            }
        ]
    },
    sqlite: {
        type: 'sqlite',
        displayName: 'SQLite',
        fields: [
            {
                name: 'database',
                type: 'text',
                label: 'Path to database',
                placeholder: '/Users/jake/db.sqlite3',
                required: true
            }
        ]
    }
}; 