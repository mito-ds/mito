// Copyright (c) Mito

import React from 'react';


const SelectDropdownIcon = (props: {purpleOrDarkOrWhite?: 'purple' | 'dark' | 'white'}): JSX.Element => {
    if (props.purpleOrDarkOrWhite === 'purple') {
        return (
            <svg width="6" height="4" viewBox="0 0 6 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0L3.00283 4L6 0" fill="#9D6CFF"/>
            </svg>
        )
    } else if (props.purpleOrDarkOrWhite === 'white') {
        return (
            <svg width="6" height="4" viewBox="0 0 6 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0L3.00283 4L6 0" fill="white"/>
            </svg>
        )
    } else {
        return (
            <svg width="6" height="4" viewBox="0 0 6 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0L3.00283 4L6 0" fill="#343434"/>
            </svg>
        )
    }
}

export default SelectDropdownIcon;







