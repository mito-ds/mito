/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { classNames } from '../../utils/classNames';
import StarIcon from '../../icons/StarIcon';

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
                boxShadow: '0 0 15px rgba(147, 51, 234, 0.4), 0 0 25px rgba(147, 51, 234, 0.3), 0 0 35px rgba(147, 51, 234, 0.2)',
                borderColor: 'rgba(147, 51, 234, 0.5)',
                marginTop: '15px',
                marginBottom: '15px',
                position: 'relative',
                padding: '20px 15px 15px 15px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
            }}
        >
            {/* Assumption Header Label */}
            <div
                style={{
                    position: 'absolute',
                    top: '-8px',
                    left: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: 'rgba(147, 51, 234, 0.8)',
                    fontStyle: 'italic',
                    border: '1px solid rgba(147, 51, 234, 0.3)',
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
                    color: 'rgba(147, 51, 234, 0.7)',
                    fontSize: '14px',
                    lineHeight: '1.4',
                }}
            >
                <div style={{ marginTop: '2px', flexShrink: 0 }}>
                    <StarIcon />
                </div>
                <div style={{ flex: 1 }}>
                    {assumption}
                </div>
            </span>
        </div>
    );
};

export default AssumptionToolUI; 