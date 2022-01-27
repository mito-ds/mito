// Copyright (c) Mito

import React from 'react';


const TimedeltaTypeIcon = (props: {purpleOrDark?: 'dark' | 'purple'}): JSX.Element => {

    if (props.purpleOrDark === 'purple') {
        return (
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="6.5" cy="6.5" r="6" stroke="var(--mito-purple)"/>
                <line x1="6.25" y1="7.5" x2="6.25" y2="3" stroke="var(--mito-purple)"/>
                <line x1="6.45" y1="7.1" x2="8.85" y2="5.3" stroke="var(--mito-purple)"/>
            </svg>
        )
    }

    return (
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="6.5" cy="6.5" r="6" stroke="#343434"/>
            <line x1="6.25" y1="7.5" x2="6.25" y2="3" stroke="#343434"/>
            <line x1="6.45" y1="7.1" x2="8.85" y2="5.3" stroke="#343434"/>
        </svg>
    )
}

export default TimedeltaTypeIcon;

