import React from 'react';
import { IconVariant } from '../toolbar/utils';

const GraphIcon = (props: {variant?: IconVariant}): JSX.Element => {
    if (props.variant === 'light') {
        return (
            <svg width="13" height="15" viewBox="0 0 13 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 5.5874V14.3589" stroke="var(--mito-background)" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M4.64453 9.67969V14.3588" stroke="var(--mito-background)" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M8.28906 1V14.3588" stroke="var(--mito-background)" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M11.9336 5.5874V14.3589" stroke="var(--mito-background)" strokeMiterlimit="10" strokeLinecap="round"/>
            </svg>
        )
    } else {
        return (
            <svg width="13" height="15" viewBox="0 0 13 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 5.61938V14.3908" stroke="var(--mito-text)" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M4.64453 9.71167V14.3908" stroke="var(--mito-text)" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M8.28906 1.03198V14.3908" stroke="var(--mito-text)" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M11.9336 5.61938V14.3908" stroke="var(--mito-text)" strokeMiterlimit="10" strokeLinecap="round"/>
            </svg>
        )
    }
}

export default GraphIcon