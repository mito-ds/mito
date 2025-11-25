/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';

const BrainIcon: React.FC<{
    height?: number;
    width?: number;
    fill?: string;
}> = ({
    height = 14,
    width = 14,
    fill = 'currentColor'
}) => (
    <svg
        width={width}
        height={height}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        stroke={fill}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M12 5a3 3 0 1 0-5.997.142 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588 4 4 0 0 0 7.636 2.106 3.2 3.2 0 0 0 .164-.546c.628-.5 1.2-1.1 1.7-1.8a3.2 3.2 0 0 0 .164-.546 4 4 0 0 0 7.636-2.106 4 4 0 0 0 .556-6.588 4 4 0 0 0-2.526-5.77A3 3 0 1 0 12 5Z" />
        <path d="M8 12h.01M12 12h.01M16 12h.01M8 8h.01M12 8h.01M16 8h.01M8 16h.01M12 16h.01M16 16h.01" />
    </svg>
);

export default BrainIcon;

