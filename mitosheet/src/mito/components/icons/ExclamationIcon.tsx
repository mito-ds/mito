/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import React from 'react';

const ExclamationIcon = (props: { color?: string; width?: string; height?: string }): JSX.Element => {
    const color = props.color ?? 'var(--mito-text)';
    return (
        <svg width={props.width ?? '14'} height={props.height ?? '14'} viewBox='0 0 14 14' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <circle cx='7' cy='7' r='6.25' stroke={color} strokeWidth='1.5' />
            <rect x='6.25' y='3' width='1.5' height='5.5' rx='0.75' fill={color} />
            <circle cx='7' cy='10.5' r='1' fill={color} />
        </svg>
    );
}

export default ExclamationIcon;
