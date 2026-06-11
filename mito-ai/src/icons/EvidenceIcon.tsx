/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';

const EvidenceIcon: React.FC = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle
            cx="8"
            cy="8"
            r="6"
            stroke="currentColor"
            strokeWidth="1.5"
        />
        <path
            d="M6 6.5C6 5.67 6.67 5 8 5C9.33 5 10 5.67 10 6.5C10 7.5 8.75 7.75 8.75 9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
    </svg>
);

export default EvidenceIcon;
