// Copyright (c) Mito

import React from 'react';

const PivotIcon = (): JSX.Element => {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1.43689" y="0.570312" width="16" height="16" fill="var(--mito-background-off)" stroke="var(--mito-text)"/>
            <rect x="3.18689" y="2.32031" width="2.5" height="2.5" fill="var(--mito-text-medium)" stroke="var(--mito-text)" strokeWidth="0.5"/>
            <rect x="7.18689" y="2.32031" width="8.5" height="2.5" fill="var(--mito-text-medium)" stroke="var(--mito-text)" strokeWidth="0.5"/>
            <rect x="3.18689" y="6.32031" width="2.5" height="8.5" fill="var(--mito-text-medium)" stroke="var(--mito-text)" strokeWidth="0.5"/>
            <path d="M13.5526 7.07031V12.4957H8.17548M13.5526 7.07031L11.8801 8.75347M13.5526 7.07031L15.1752 8.75347M8.17548 12.4957L9.72413 14.0703M8.17548 12.4957L9.72413 11.0586" stroke="var(--mito-highlight)" strokeMiterlimit="10" strokeLinecap="round"/>
        </svg>
    )
}

export default PivotIcon;