// Copyright (c) Mito

import React from 'react';
import { IconVariant } from '../toolbar/utils';


const CatchUpIcon = (props: {variant?: IconVariant}): JSX.Element => {
    if (props.variant === 'light') {
        return (
            <svg width="16" height="15" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 14L7.5 7.96429L1 1V14Z" stroke="white" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8.42578 14L14.9258 7.96429L8.42578 1V14Z" stroke="white" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        )
    } else {
        return (
            <svg width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 12.2L6.6 7L1 1V12.2Z" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7.39844 12.2L12.9984 7L7.39844 1V12.2Z" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        )
    }
}

export default CatchUpIcon;