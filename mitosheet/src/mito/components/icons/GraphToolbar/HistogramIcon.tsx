/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


import React from 'react';

const HistogramIcon = (): JSX.Element => {
    return (
        <svg width="11" height="10" viewBox="0 0 11 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="4.69922" width="2.25" height="4.8" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight)"/>
            <rect x="3.25" y="0.5" width="2.25" height="9" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight)"/>
            <rect x="5.5" y="3.5" width="2.25" height="6" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight)"/>
            <rect x="7.75" y="6.5" width="2.25" height="3" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight)"/>
        </svg>
    )
}

export default HistogramIcon;