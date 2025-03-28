/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import React from 'react';

const MergeIcon = (): JSX.Element => {
    return (
        <svg width="26" height="17" viewBox="0 0 26 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8.5" cy="8.5" r="8" transform="matrix(-1 0 0 1 25.2068 0)" fill="var(--mito-background-off)" stroke="var(--mito-text)"/>
            <circle cx="8.5" cy="8.5" r="8" transform="matrix(-1 0 0 1 17 0)" fill="var(--mito-background-off)" stroke="var(--mito-text)"/>
            <mask id="mask0_7507_327" style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="17" height="17">
                <circle cx="8.5" cy="8.5" r="8" transform="matrix(-1 0 0 1 17 0)" fill="var(--mito-highlight)" stroke="var(--mito-text)"/>
            </mask>
            <g mask="url(#mask0_7507_327)">
                <circle cx="8.5" cy="8.5" r="8" transform="matrix(-1 0 0 1 25.2068 0)" fill="var(--mito-highlight)" stroke="var(--mito-text)"/>
            </g>
            <circle cx="8.5" cy="8.5" r="8" transform="matrix(-1 0 0 1 17 0)" stroke="var(--mito-text)"/>
        </svg>
    )
}

export default MergeIcon;