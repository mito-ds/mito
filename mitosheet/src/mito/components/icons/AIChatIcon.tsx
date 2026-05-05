/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';

const AIChatIcon = (props: { color?: string }): JSX.Element => {
    const color = props.color ?? 'var(--mito-highlight)';

    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(16 0) scale(-1 1)">
                <path
                    d="M3.2 3.1H12.8C13.4627 3.1 14 3.63726 14 4.3V10.7C14 11.3627 13.4627 11.9 12.8 11.9H7.5L4.3 14V11.9H3.2C2.53726 11.9 2 11.3627 2 10.7V4.3C2 3.63726 2.53726 3.1 3.2 3.1Z"
                    stroke={color}
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <circle cx="5.6" cy="7.5" r="0.9" fill={color} />
                <circle cx="8" cy="7.5" r="0.9" fill={color} />
                <circle cx="10.4" cy="7.5" r="0.9" fill={color} />
            </g>
        </svg>
    );
};

export default AIChatIcon;
