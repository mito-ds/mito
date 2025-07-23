/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState, useEffect } from 'react';
import IconButton from './IconButton';
import DatabaseOutlineIcon from '../icons/DatabaseOutlineIcon';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { COMMAND_MITO_AI_SETTINGS } from '../Extensions/SettingsManager/SettingsManagerPlugin';
import { getDatabaseConnections } from '../restAPI/RestAPI';

interface DatabaseButtonProps {
    app: JupyterFrontEnd;
    title?: string;
}

const DatabaseButton: React.FC<DatabaseButtonProps> = ({
    app,
    title = 'Add Database'
}) => {
    const [databaseConnections, setDatabaseConnections] = useState<Record<string, any>>({});

    // Fetch database connections
    useEffect(() => {
        const fetchDatabaseConnections = async (): Promise<void> => {
            const databaseConnections = await getDatabaseConnections();
            setDatabaseConnections(databaseConnections);
        };
        void fetchDatabaseConnections();
    }, []);

    // Determine notification dot type based on connections
    const getNotificationDotType = (): 'success' | 'warning' | null => {
        return Object.keys(databaseConnections).length > 0 ? 'success' : 'warning';
    };

    return (
        <IconButton
            icon={<DatabaseOutlineIcon />}
            title={title}
            onClick={() => {
                app.commands.execute(COMMAND_MITO_AI_SETTINGS);
            }}
            notificationDotType={getNotificationDotType()}
        />
    );
};

export default DatabaseButton; 