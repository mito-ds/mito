/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { classNames } from '../../utils/classNames';

interface AssumptionToolUIProps {
    assumption: string;
}

const AssumptionToolUI: React.FC<AssumptionToolUIProps> = ({
    assumption,
}): JSX.Element => {
    return (
        <div
            className={classNames('agent-component-header')}
            style={{
                borderColor: 'var(--jp-cell-editor-border-color)',
                marginTop: '15px',
                marginBottom: '15px',
                position: 'relative',
                padding: '20px 15px 15px 15px',
                borderRadius: 'var(--chat-taskpane-item-border-radius)',
                backgroundColor: 'var(--jp-layout-color0)',
            }}
        >
            {/* Assumption Header Label */}
            <div
                style={{
                    position: 'absolute',
                    top: '-8px',
                    left: '12px',
                    backgroundColor: 'var(--jp-layout-color0)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: 'var(--jp-ui-font-color2)',
                    fontStyle: 'italic',
                }}
            >
                Assumption
            </div>
            
            <span 
                className="agent-component-header-content"
                style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    color: 'var(--jp-ui-font-color2)',
                    fontSize: '14px',
                    lineHeight: '1.4',
                }}
            >
                <div style={{ flex: 1 }}>
                    {assumption}
                </div>
            </span>
        </div>
    );
};

export default AssumptionToolUI;