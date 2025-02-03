import React, { useState, useEffect } from 'react';

interface CollapsibleWarningBlockProps {
    message: string;
}

export const CollapsibleWarningBlock = ({ message }: CollapsibleWarningBlockProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [warningCount, setWarningCount] = useState(0);

    const countWarnings = (message: string) => {
        const lines = message.split('\n');
        const warningCount = lines.filter(line => line.includes("Warning: ")).length;
        setWarningCount(warningCount);
    }

    useEffect(() => {
        countWarnings(message);
    }, [message]);

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