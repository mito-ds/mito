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
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g fill="currentColor">
            {isExpanded ? (
                <path d="M6 2L10 6L9 7L6 4L3 7L2 6L6 2Z" />
            ) : (
                <path d="M6 10L2 6L3 5L6 8L9 5L10 6L6 10Z" />
            )}
        </g>
    </svg>
);

export default ExpandIcon; 