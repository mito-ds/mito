/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';

const ExpandIcon: React.FC<{
    isExpanded: boolean;
}> = ({
    isExpanded
}) => (
    <svg width="1em" height="1em" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g fill="currentColor">
            {isExpanded ? (
                <path d="M5 0L9.33013 4.33013L8.66025 5L5 1.33975L1.33975 5L0.669873 4.33013L5 0Z" />
            ) : (
                <path d="M5 10L0.669873 5.66987L1.33975 5L5 8.66025L8.66025 5L9.33013 5.66987L5 10Z" />
            )}
        </g>
    </svg>
);

export default ExpandIcon; 