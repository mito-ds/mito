// Copyright (c) Mito

import React from 'react';

const CopyIcon = (): JSX.Element => {
    return (
        <svg width="18" height="18" viewBox="0 0 15 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.88889 2.57031L8.22222 1.07031H6.55556H1V15.0703H3.5" stroke="var(--mito-text)"/>
            <path d="M5.5 3.57031H10.5556H12.0304L13.5352 4.92467L14.5 5.99264V16.5703H5.5V3.57031Z" fill="var(--mito-background-off)" stroke="var(--mito-text)"/>
            <line x1="10.5" y1="4.07031" x2="10.5" y2="8.07031" stroke="var(--mito-text)"/>
            <line x1="10" y1="7.57031" x2="14" y2="7.57031" stroke="var(--mito-text)"/>
            <line x1="8" y1="11.5703" x2="12" y2="11.5703" stroke="var(--mito-text-light"/>
            <path d="M8 13.5703H12" stroke="var(--mito-text-light"/>
        </svg>
    )

}

export default CopyIcon;