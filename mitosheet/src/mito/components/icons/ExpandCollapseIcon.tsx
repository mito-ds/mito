/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import React from 'react';


const ExpandCollapseIcon = (props: {action: 'expand' | 'collapse', strokeColor?: string, disabled?: boolean, strokeWidth?: number; }): JSX.Element => {

    const stroke = props.strokeColor ?? (props.disabled ? '#C3C0CA' : "#767180");

    if (props.action === 'expand') {
        return (
            <svg width="9" height="15" viewBox="0 0 11 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L10 7.75862L1 14" stroke={stroke} strokeWidth={props.strokeWidth ?? '2'} strokeLinejoin="round"/>
            </svg>
        )
    } else {
        return (
            <svg width="15" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.5588 1L9.11256 10.8736L1.00003 1.27663" stroke={stroke} strokeWidth={props.strokeWidth ?? '2'} strokeLinejoin="round"/>
            </svg>
        )
    }
}

export default ExpandCollapseIcon;
