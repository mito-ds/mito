/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';

const AIIcon: React.FC<{
    fill?: string;
    height?: number;
    width?: number;
}> = ({
    height = '20',
    width = '20',
    fill = 'currentColor'
}) => (
    <svg
        data-testid="ai-icon"
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox="0 0 24 24"
        fill="none"
        stroke={fill}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M8.5 4a4 4 0 0 0-4 4v1a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2v1a4 4 0 0 0 8 0M15.5 4a4 4 0 0 1 4 4v1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2v1a4 4 0 0 1-8 0" />
        <path d="M17.5 10v7M6.5 10v7M12 4v3M12 18v2M13 15a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
        <circle cx="20.5" cy="7" r="1" fill={fill} />
        <circle cx="20.5" cy="12" r="1" fill={fill} />
        <circle cx="20.5" cy="17" r="1" fill={fill} />
        <circle cx="3.5" cy="7" r="1" fill={fill} />
        <circle cx="3.5" cy="12" r="1" fill={fill} />
        <circle cx="3.5" cy="17" r="1" fill={fill} />
    </svg>
);

export default AIIcon;