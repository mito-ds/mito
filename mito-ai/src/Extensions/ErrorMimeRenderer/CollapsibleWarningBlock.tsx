/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';

interface CollapsibleWarningBlockProps {
    message: string;
}

export const CollapsibleWarningBlock = ({ message }: CollapsibleWarningBlockProps): JSX.Element => {
    const [isExpanded, setIsExpanded] = useState(false);

    const lines = message.split('\n');
    const warningCount = lines.filter(line => line.includes("Warning: ")).length;

    return (
        <div className="output-block">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setIsExpanded(!isExpanded)}>
                <button className="collapse-button">
                    {isExpanded ? '▼' : '▶'}
                </button>
                <pre style={{ margin: 0, display: 'inline' }}>Warning ({warningCount})</pre>
            </span>

            {isExpanded &&
                <div className="output-block-expanded">
                    <pre style={{ marginTop: '10px' }}>{message}</pre>
                </div>
            }
        </div>
    );
}