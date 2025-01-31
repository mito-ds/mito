import React, { useState, useEffect } from 'react';

interface OutputBlockProps {
    message: string;
}

export const OutputBlock = ({ message }: OutputBlockProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [lastMessage, setLastMessage] = useState('');

    const extractError = (message: string) => {
        // Split message into lines
        const lines = message.split('\n');

        for (const line of lines) {
            if (line.includes("Warning: ")) {
                // Find any warning prefix (e.g., "UserWarning: ", "DeprecationWarning: ")
                const warningMatch = line.match(/(\w+Warning:\s*)/);
                const warningIndex = line.indexOf("Warning:");

                // If there's a prefix, return from the start of the prefix
                if (warningMatch && warningMatch.index !== undefined) {
                    return line.substring(warningMatch.index);
                }
                // Otherwise return from "Warning:"
                return line.substring(warningIndex);
            }
        }

        // As a fallback, return the entire message
        return message;
    }

    useEffect(() => {
        const lastMessage = extractError(message);
        setLastMessage(lastMessage || '');
    }, [message]);

    return (
        <div className="output-block">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <pre style={{ margin: 0, display: 'inline' }}>{lastMessage}</pre>
                <button className="collapse-button" onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded ? 'Show Less' : 'Show More'}
                </button>
            </span>

            {isExpanded && <pre>{message}</pre>}
        </div>
    );
}