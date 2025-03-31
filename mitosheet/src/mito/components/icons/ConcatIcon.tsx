/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


import React from 'react';

const ConcatIcon = (): JSX.Element => {
    return (
        <svg width="18" height="24" viewBox="0 0 18 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8.5" cy="8.5" r="8" transform="matrix(0 1 1 0 0.103516 0.894531)" fill="var(--mito-background-off)" stroke="var(--mito-text)"/>
            <circle cx="8.5" cy="8.5" r="8" transform="matrix(0 1 1 0 0.103516 6.10156)" fill="var(--mito-background-off)" stroke="var(--mito-text)"/>
            <mask id="mask0_7507_341" style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x="0" y="7" width="17" height="16">
                <path d="M8.5 22.5C12.9473 22.5 16.5 19.114 16.5 15C16.5 10.886 12.9473 7.5 8.5 7.5C4.05273 7.5 0.5 10.886 0.5 15C0.5 19.114 4.05273 22.5 8.5 22.5Z" fill="var(--mito-highlight)" stroke="var(--mito-text)"/>
            </mask>
            <g mask="url(#mask0_7507_341)">
                <circle cx="8.5" cy="8.5" r="8" transform="matrix(0 1 1 0 0.103516 1.89453)" fill="var(--mito-highlight)" stroke="var(--mito-text)"/>
            </g>
            <circle cx="8.5" cy="8.5" r="8" transform="matrix(0 1 1 0 0.103516 6.10156)" stroke="var(--mito-text)"/>
        </svg>
    )
}

export default ConcatIcon;