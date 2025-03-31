/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import React from 'react';

const UnpivotIcon = (): JSX.Element => {
    return (
        <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.5" y="0.570312" width="8.16667" height="4.83333" fill="var(--mito-background-off)" stroke="var(--mito-text)"/>
            <line x1="0.833252" y1="2.90234" x2="8.33325" y2="2.90234" stroke="var(--mito-text)"/>
            <rect x="0.833252" y="0.90625" width="7.5" height="1.66667" fill="var(--mito-highlight)"/>
            <rect x="9.66675" y="14.5703" width="8.16667" height="4.83333" transform="rotate(-90 9.66675 14.5703)" fill="var(--mito-background-off)" stroke="var(--mito-text)"/>
            <line x1="12" y1="14.2344" x2="12" y2="6.73438" stroke="var(--mito-text)"/>
            <rect x="10" y="14.2344" width="7.5" height="1.66667" transform="rotate(-90 10 14.2344)" fill="var(--mito-highlight)"/>
            <path d="M3.01878 7.57031V12.0915H7.49974M3.01878 7.57031L4.41257 8.97294M3.01878 7.57031L1.66667 8.97294M7.49974 12.0915L6.2092 13.4036M7.49974 12.0915L6.2092 10.8939" stroke="var(--mito-highlight)" strokeMiterlimit="10" strokeLinecap="round"/>
        </svg>
    )
}

export default UnpivotIcon;
