// Copyright (c) Mito

import React from 'react';
import { IconVariant } from '../toolbar/utils';


const DeleteColumnIcon = (props: {variant?: IconVariant}): JSX.Element => {
    if (props.variant === 'light') {
        return (
            <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.27212 14.3515H4.67728C3.65756 14.3515 2.82599 13.526 2.83206 12.5002L2.83813 3.91748H11.1598L11.1173 12.5123C11.1173 13.532 10.2919 14.3515 9.27212 14.3515Z" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M1 3.91748H13" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M8.35474 1.38062H5.63547C5.21665 1.38062 4.88281 1.72052 4.88281 2.13327V3.91779H9.11347V2.13327C9.11347 1.72052 8.77356 1.38062 8.35474 1.38062Z" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M5.42969 6.66772V11.3475" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M8.38281 6.66772V11.3475" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
            </svg>
        )
    } else {
        return (
            <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.27408 14.3835H4.67924C3.65951 14.3835 2.82795 13.558 2.83402 12.5322L2.84009 3.94946H11.1618L11.1193 12.5443C11.1193 13.564 10.2938 14.3835 9.27408 14.3835Z" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M1 3.94946H13" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M8.35669 1.4126H5.63742C5.21861 1.4126 4.88477 1.75251 4.88477 2.16525V3.94977H9.11542V2.16525C9.11542 1.75251 8.77551 1.4126 8.35669 1.4126Z" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M5.43164 6.69983V11.3796" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M8.38477 6.69983V11.3796" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
            </svg>
        )
    }
}

export default DeleteColumnIcon;

