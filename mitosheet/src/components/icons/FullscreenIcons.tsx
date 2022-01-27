// Copyright (c) Mito

import React from 'react';
import { IconVariant } from '../toolbar/utils';


export const OpenFullscreenIcon = (props: {variant?: IconVariant}): JSX.Element => {
    if (props.variant === 'light') {
        return (
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.05571 9.08911L1 14.1448" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M14.001 1.14478L8.94531 6.20048" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M1 9.08911V14.1448H6.05571" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M14.001 6.20048V1.14478H8.94531" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
            </svg>
        )
    } else {
        return (
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.05571 9.08911L1 14.1448" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M14.001 1.14478L8.94531 6.20048" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M1 9.08911V14.1448H6.05571" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M14.001 6.20048V1.14478H8.94531" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
            </svg>
        )
    }
}


export const CloseFullscreenIcon = (props: {variant?: IconVariant}): JSX.Element => {
    if (props.variant === 'light') {
        return (
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.05555 8.94434L1 13.9999" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M8.94445 6.05566L14 1.00011" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M6.05469 13.9998V8.9442H0.999135" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M8.94445 1.00011V6.05566H14" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
            </svg>
        )
    } else {
        return (
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.05555 8.94434L1 13.9999" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M8.94445 6.05566L14 1.00011" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M6.05469 13.9998V8.9442H0.999135" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M8.94445 1.00011V6.05566H14" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
            </svg>
        )
    }
}
