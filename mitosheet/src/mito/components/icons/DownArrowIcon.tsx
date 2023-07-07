
// Copyright (c) Mito

import React from 'react';
import { IconVariant } from '../toolbar/utils';

const DownArrowIcon = (props: {variant?: IconVariant}): JSX.Element => {
    const stroke = props.variant === 'light' ? 'var(--mito-white)' : 'var(--mito-legacy-gray)';
    return (
        <svg width="19" height="11" viewBox="0 0 19 11" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 1.94141L9.49199 8.94141L1 1.94141" stroke={stroke} strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round"/>
        </svg>

    )
}

export default DownArrowIcon;