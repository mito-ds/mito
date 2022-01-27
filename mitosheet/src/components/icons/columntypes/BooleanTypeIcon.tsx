// Copyright (c) Mito

import React from 'react';


const BooleanTypeIcon = (props: {purpleOrDark?: 'dark' | 'purple'}): JSX.Element => {

    if (props.purpleOrDark === 'purple') {
        return (
            <svg width="12" height="15" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.952 3.224L5.144 2.328H0.712L0.52 3.224H2.288L1.28 8H2.24L3.256 3.224H4.952Z" fill="var(--mito-purple)"/>
                <path d="M8.04 13L8.528 10.712H10.8L10.984 9.824H8.712L9.048 8.232H11.584L11.776 7.328H8.28L7.08 13H8.04Z" fill="var(--mito-purple)"/>
                <line x1="8.44721" y1="2.22361" x2="3.44721" y2="12.2236" stroke="var(--mito-purple)"/>
            </svg>
        ) 
    }

    return (
        <svg width="12" height="15" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.952 3.224L5.144 2.328H0.712L0.52 3.224H2.288L1.28 8H2.24L3.256 3.224H4.952Z" fill="#343434"/>
            <path d="M8.04 13L8.528 10.712H10.8L10.984 9.824H8.712L9.048 8.232H11.584L11.776 7.328H8.28L7.08 13H8.04Z" fill="#343434"/>
            <line x1="8.44721" y1="2.22361" x2="3.44721" y2="12.2236" stroke="#343434"/>
        </svg>
    )
}

export default BooleanTypeIcon;
