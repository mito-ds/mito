
// Copyright (c) Mito

import React from 'react';

const ConditionalFormatIcon = (): JSX.Element => {
    return (
        <svg width="38" height="30" viewBox="0 0 38 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4.5" y="6.57031" width="29" height="16" fill="#F4F4F4" stroke="var(--mito-text)"/>
            <rect x="4.5" y="11.5703" width="29" height="6" stroke="#797774"/>
            <rect x="4.5" y="6.57031" width="29" height="16" stroke="var(--mito-text)"/>
            <rect x="12" y="11.5703" width="6.5" height="6" fill="#9D6CFF" stroke="#6229AB"/>
            <rect x="12" y="6.57031" width="11.5" height="5" fill="#F0969A" stroke="var(--mito-status-error)"/>
            <rect x="12" y="17.5703" width="14" height="5" fill="#F0969A" stroke="var(--mito-status-error)"/>
            <line x1="28.25" y1="7.07031" x2="28.25" y2="22.0703" stroke="#797775"/>
        </svg>
    )
}

export default ConditionalFormatIcon;