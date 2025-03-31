/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import React from 'react';

const ScatterPlotIcon = (): JSX.Element => {
    return (
        <svg width="15" height="15" viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="0.25" y1="0.0703125" x2="0.25" y2="8.07031" stroke="var(--mito-text)" strokeWidth="0.5"/>
            <line y1="7.82031" x2="9" y2="7.82031" stroke="var(--mito-text)" strokeWidth="0.5"/>
            <rect x="2" y="1.07031" width="1" height="1" fill="var(--mito-highlight)"/>
            <rect x="4" y="3.07031" width="1" height="1" fill="var(--mito-highlight)"/>
            <rect x="6" y="5.07031" width="1" height="1" fill="var(--mito-highlight)"/>
            <rect x="2" y="5.07031" width="1" height="1" fill="var(--mito-text)"/>
            <rect x="7" y="0.0703125" width="1" height="1" fill="var(--mito-text)"/>
        </svg>
    )
}

export default ScatterPlotIcon;
