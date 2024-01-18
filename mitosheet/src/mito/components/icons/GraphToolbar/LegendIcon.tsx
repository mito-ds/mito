// Copyright (c) Mito

import React from 'react';

const LegendIcon = (props: { orientation?: 'horizontal' | 'vertical' | 'none' }): JSX.Element => {
    return (
        <svg width="14" height="20" viewBox="0 0 14 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5.5" y="9.5" width="5" height="10" fill="#F5F5F5" stroke="#C2C2C2"/>
            <rect x="0.5" y="4.5" width="5" height="15" fill="white" stroke="#767180"/>
            <path d="M7.5 0.5H13.5V7H7.5V0.5Z" fill="white" stroke="#9D6CFF"/>
            <path d="M8.5 1.5H10.5V3.5H8.5V1.5Z" fill="#9D6CFF"/>
            <rect x="8.5" y="4" width="2" height="2" fill="#9D6CFF"/>
            <path d="M11 2.5H12.5V3.5H11V2.5Z" fill="#9D6CFF"/>
            <path d="M11 5H12.5V6H11V5Z" fill="#9D6CFF"/>
        </svg>
    )
}

export default LegendIcon;