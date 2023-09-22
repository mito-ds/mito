// Copyright (c) Mito

import React from 'react';


const SearchNavigateIcon = (props: {direction: 'up' | 'down' | 'right', strokeColor?: string, disabled?: boolean, strokeWidth?: number}): JSX.Element => {

    const stroke = props.disabled ? '#C3C0CA' : "#767180";

    if (props.direction === 'up') {
        return (
            <svg width="13" height="7" viewBox="0 0 13 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.8284 6.41421L6.17157 0.757355L0.514716 6.41421" stroke={props.strokeColor ?? stroke} strokeWidth={props.strokeWidth ?? 2}/>
            </svg>
        )
    } else if (props.direction === 'down') {
        return (
            <svg width="13" height="7" viewBox="0 0 13 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.8285 0.585791L6.17163 6.24265L0.514777 0.585791" stroke={props.strokeColor ?? stroke} strokeWidth={props.strokeWidth ?? 2}/>
            </svg>
        )
    } else {
        return (
            <svg width="11" height="14" viewBox="0 0 11 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L10 7.23873L1 13" stroke={props.strokeColor ?? stroke} strokeWidth={props.strokeWidth ?? 2}/>
            </svg>
        )
    }
}

export default SearchNavigateIcon;

