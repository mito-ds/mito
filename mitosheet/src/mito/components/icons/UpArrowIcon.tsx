
// Copyright (c) Mito

import React from 'react';

const UpArrowIcon = ( props: { width?: string }): JSX.Element => {

    return (
        <svg width={props.width ?? "19"} height="10" viewBox="0 0 19 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 8.94141L9.50801 1.94141L18 8.94141" stroke='var(--mito-text)' strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round"/>
        </svg>
    )
}

export default UpArrowIcon;