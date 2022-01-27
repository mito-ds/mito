// Copyright (c) Mito

import React from 'react';
import { IconVariant } from '../toolbar/utils';

const UndoIcon = (props: {variant?: IconVariant}): JSX.Element => {
    if (props.variant === 'light') {
        return (
            <svg width="18" height="15" viewBox="0 0 18 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 4.68262L3.76376 8.78878L7.86993 6.02502" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M10.2841 13.9679C13.8836 13.9679 16.7987 11.0528 16.7987 7.45331C16.7987 3.85383 13.8836 0.938721 10.2841 0.938721C6.68464 0.938721 3.76953 3.85383 3.76953 7.45331" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
            </svg>
        )
    } else {
        return (
            <svg width="18" height="15" viewBox="0 0 18 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.32422 4.71448L4.08798 8.82064L8.19415 6.05688" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M10.6103 13.9999C14.2098 13.9999 17.1249 11.0848 17.1249 7.48529C17.1249 3.88582 14.2098 0.970703 10.6103 0.970703C7.01082 0.970703 4.0957 3.88582 4.0957 7.48529" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
            </svg>
        )
    }    
}

export default UndoIcon;

