// Copyright (c) Mito

import React from 'react';

const ChartTitleIcon = (): JSX.Element => {
    return (
        <svg width="11" height="22" viewBox="0 0 11 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5.5" y="11.5" width="5" height="10" fill="var(--mito-background-off)" stroke="#C2C2C2"/>
            <rect x="0.5" y="6.5" width="5" height="15" fill="var(--mito-background)" stroke="var(--mito-text-medium)"/>
            <rect x="0.5" y="0.5" width="10" height="4" fill="var(--mito-background)" stroke="var(--mito-highlight)"/>
            <path d="M2 2.5H9" stroke="var(--mito-highlight)"/>
        </svg>
    )
}

export default ChartTitleIcon;