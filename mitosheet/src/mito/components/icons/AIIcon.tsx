
// Copyright (c) Mito

import React from 'react';

const AIIcon = (): JSX.Element => {
    return (
        <svg width="15" height="15" viewBox="0 0 11 7" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.5 3.5C10.5 1.84315 9.15685 0.5 7.5 0.5H3.5C1.84315 0.5 0.5 1.84315 0.5 3.5V3.5C0.5 5.15685 1.84315 6.5 3.5 6.5H7.5C9.15685 6.5 10.5 5.15685 10.5 3.5V3.5Z" fill="var(--mito-text)" stroke="var(--mito-text)" strokeWidth="0.600361" strokeMiterlimit="10" strokeLinecap="round"/>
            <circle cx="3" cy="3.5" r="1" transform="rotate(-90 3 3.5)" fill="var(--mito-highlight)"/>
            <circle cx="8" cy="3.5" r="1" transform="rotate(-90 8 3.5)" fill="var(--mito-highlight)"/>
        </svg>

    )
}

export default AIIcon;