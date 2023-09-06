
// Copyright (c) Mito

import React from 'react';

const SuggestedStyleIcon = (props: {
    headerColor: string,
    evenRowColor: string,
    oddRowColor: string,
}): JSX.Element => {
    return (
        <svg width="52" height="54" viewBox="0 0 64 54" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="60" height="10" transform="translate(2 2)" fill={props.headerColor}/>
            <rect width="60" height="10" transform="translate(2 12)" fill={props.evenRowColor}/>
            <rect width="60" height="10" transform="translate(2 22)" fill={props.oddRowColor}/>
            <rect width="60" height="10" transform="translate(2 32)" fill={props.evenRowColor}/>
            <rect width="60" height="10" transform="translate(2 42)" fill={props.oddRowColor}/>
            <rect x="1" y="1" width="62" height="52" stroke='var(--mito-highlight)' strokeWidth="2"/>
        </svg>
    )
}

export default SuggestedStyleIcon;