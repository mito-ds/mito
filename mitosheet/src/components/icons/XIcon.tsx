// Copyright (c) Mito

import React from 'react';
import { IconVariant } from '../toolbar/utils';


const XIcon = (
    props: {
        variant?: IconVariant,
        width?: string, 
        height?: string,
        onClick?: () => void
    }): JSX.Element => {
    const stroke = props.variant === 'light' ? 'var(--mito-white)' : 'var(--mito-legacy-gray)';

    return (
        <svg width={props.width || "18"} onClick={props.onClick} height={props.height || "18"} viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="0.707107" y1="1.29289" x2="11.3136" y2="11.8994" stroke={stroke} strokeWidth="2"/>
            <line x1="0.7072" y1="11.8995" x2="11.3137" y2="1.29297" stroke={stroke} strokeWidth="2"/>
        </svg>
    )
}

export default XIcon;

