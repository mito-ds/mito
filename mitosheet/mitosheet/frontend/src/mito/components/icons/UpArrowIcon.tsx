
// Copyright (c) Mito

import React from 'react';
import { IconVariant } from '../toolbar/utils';

const UpArrowIcon = (props: {variant?: IconVariant}): JSX.Element => {
    const stroke = props.variant === 'light' ? 'var(--mito-white)' : 'var(--mito-legacy-gray)';

    return (
        <svg width="19" height="10" viewBox="0 0 19 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 8.94141L9.50801 1.94141L18 8.94141" stroke={stroke} strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round"/>
        </svg>
    )
}

export default UpArrowIcon;