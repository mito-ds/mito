/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


import React from 'react';


const SearchNavigateIcon = (props: {direction: 'up' | 'down', strokeColor?: string, disabled?: boolean, strokeWidth?: number; width?: string, height?: string }): JSX.Element => {

    const stroke = props.strokeColor ?? (props.disabled ? '#C3C0CA' : "#767180");

    if (props.direction === 'up') {
        return (
            <svg width="15" height="18" viewBox="0 0 15 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.5 1.50009L0.5 8M7.5 1.50009L14.5 8M7.5 1.50009L7.5 17.5" stroke={stroke} strokeWidth={props.strokeWidth ?? '2'}/>
            </svg>
        )
    } else {
        return (
            <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 15.9999L15 9.5M8 15.9999L1 9.5M8 15.9999L8 0" stroke={stroke} strokeWidth={props.strokeWidth ?? '2'}/>
            </svg>
        )
    }
}

export default SearchNavigateIcon;

