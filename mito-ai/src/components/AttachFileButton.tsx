/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import IconButton from './IconButton';
import DatabaseOutlineIcon from '../icons/DatabaseOutlineIcon';
import { JupyterFrontEnd } from '@jupyterlab/application';

interface AttachFileButtonProps {
    app: JupyterFrontEnd;
}

const AttachFileButton: React.FC<AttachFileButtonProps> = ({ app }) => {
    const handleClick = (): void => {
        console.log('Attach file button clicked');
    };

    return (
        <IconButton
            icon={<DatabaseOutlineIcon />}
            title='Attach File'
            onClick={handleClick}
            className='icon-button-hover'
            style={{
                height: 'var(--chat-context-button-height)'
            }}
        />
    );
};

export default AttachFileButton; 