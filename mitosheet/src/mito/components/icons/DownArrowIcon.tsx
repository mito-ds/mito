
// Copyright (c) Mito

import React from 'react';

const DownArrowIcon = ( props: { width?: string; height?: string }): JSX.Element => {
    return (
        <svg width={props.width ?? "19"} height={props.height ?? "11"} viewBox="0 0 19 11" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 1.94141L9.49199 8.94141L1 1.94141" stroke='var(--mito-text)' strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round"/>
        </svg>

    )
}

export default DownArrowIcon;