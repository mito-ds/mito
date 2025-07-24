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
    alertText?: string;  // Optional HTML content for alerts/notifications
    fields: DatabaseField[];
}

const ALIAS_PLACEHOLDER = 'Enter a nickname for this database';

export const databaseConfigs: Record<string, DatabaseConfig> = {
    mssql: {
        type: 'mssql',
        displayName: 'Microsoft SQL Server',
        alertText: 'Microsoft SQL Server requires an additional driver. If you\'ve already installed it, you can safely ignore this message. For more info, consult the <a href="https://docs.trymito.io/mito-ai/database-connectors/microsoft-sql-server" target="_blank">Mito docs</a>.',
        fields: [
            {
                name: 'alias',
                type: 'text',
                label: 'Alias',
                placeholder: ALIAS_PLACEHOLDER,
                required: true
            },
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
                placeholder: '1433',
                required: true
            },
            {
                name: 'database',
                type: 'text',
                label: 'Database',
                placeholder: 'mydb',
                required: true
            },
            {
                name: 'odbc_driver_version',
                type: 'text',
                label: 'ODBC Driver Version',
                placeholder: '18',
                required: true
            }
        ]
    },
    mysql: {
        type: 'mysql',
        displayName: 'MySQL',
        fields: [
            {
                name: 'alias',
                type: 'text',
                label: 'Alias',
                placeholder: ALIAS_PLACEHOLDER,
                required: true
            },
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
    oracle: {
        type: 'oracle',
        displayName: 'Oracle',
        fields: [
            {
                name: 'alias',
                type: 'text',
                label: 'Alias',
                placeholder: ALIAS_PLACEHOLDER,
                required: true
            },
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
                placeholder: '1521',
                required: true
            },
            {
                name: 'service_name',
                type: 'text',
                label: 'Service Name',
                placeholder: 'xe',
                required: true
            }
        ]
    },
    postgres: {
        type: 'postgres',
        displayName: 'PostgreSQL',
        fields: [
            {
                name: 'alias',
                type: 'text',
                label: 'Alias',
                placeholder: ALIAS_PLACEHOLDER,
                required: true
            },
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
                name: 'alias',
                type: 'text',
                label: 'Alias',
                placeholder: ALIAS_PLACEHOLDER,
                required: true
            },
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
                name: 'alias',
                type: 'text',
                label: 'Alias',
                placeholder: ALIAS_PLACEHOLDER,
                required: true
            },
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