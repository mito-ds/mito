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
}

const DatabaseButton: React.FC<DatabaseButtonProps> = ({app}) => {
    const [databaseConnections, setDatabaseConnections] = useState<Record<string, any>>({});
    const [isIconVisible, setIsIconVisible] = useState<boolean>(true);

    // Fetch database connections
    const fetchDatabaseConnections = async (): Promise<void> => {
        const databaseConnections = await getDatabaseConnections();
        setDatabaseConnections(databaseConnections);
    };

    // Fetch database connections
    useEffect(() => {
        void fetchDatabaseConnections();
    }, []);

    // Determine notification dot type based on connections
    const getNotificationDotType = (): 'success' | 'warning' | null => {
        if (!isIconVisible) {
            return null;
        }
        return Object.keys(databaseConnections).length > 0 ? 'success' : 'warning';
    };

    return (
        <IconButton
            icon={<DatabaseOutlineIcon />}
            title='Add Database'
            onClick={() => {
                void app.commands.execute(COMMAND_MITO_AI_SETTINGS);
                setIsIconVisible(false);
            }}
            notificationDotType={getNotificationDotType()}
            className='icon-button-hover'
            style={{
                height: 'var(--chat-context-button-height)'
            }}
        />
    );
};

export default DatabaseButton; 