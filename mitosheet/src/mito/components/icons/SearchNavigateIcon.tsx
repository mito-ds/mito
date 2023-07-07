// Copyright (c) Mito

import React from 'react';


const SearchNavigateIcon = (props: {upOrDown: 'up' | 'down', disabled?: boolean}): JSX.Element => {

    const stroke = props.disabled ? '#C3C0CA' : "#767180";

    if (props.upOrDown === 'up') {
        return (
            <svg width="13" height="7" viewBox="0 0 13 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.8284 6.41421L6.17157 0.757355L0.514716 6.41421" stroke={stroke} strokeWidth={2}/>
            </svg>
        )
    } else {
        return (
            <svg width="13" height="7" viewBox="0 0 13 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.8285 0.585791L6.17163 6.24265L0.514777 0.585791" stroke={stroke} strokeWidth={2}/>
            </svg>
        )
    }
}

export default SearchNavigateIcon;

