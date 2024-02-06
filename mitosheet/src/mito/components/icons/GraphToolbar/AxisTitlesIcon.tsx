// Copyright (c) Mito

import React from 'react';

const AxisTitlesIcon = (props: { axis?: 'horizontal' | 'vertical' }): JSX.Element => {
    return (
        <svg width="15" height="20" viewBox="0 0 15 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="9.5" y="5.5" width="5" height="10" fill="var(--mito-background-off)" stroke="#C2C2C2"/>
            <rect x="4.5" y="0.5" width="5" height="15" fill="var(--mito-background)" stroke="var(--mito-text-medium)"/>
            {(props.axis === undefined || props.axis === 'horizontal') && <rect x="4.5" y="17.5" width="10" height="2" fill="var(--mito-background)" stroke="var(--mito-highlight)"/>}
            {(props.axis === undefined || props.axis === 'vertical') && <rect x="0.5" y="0.5" width="2" height="14" fill="var(--mito-background)" stroke="var(--mito-highlight)"/>}
        </svg>
    )
}

export default AxisTitlesIcon;