// Copyright (c) Mito

import React from 'react';
import { IconVariant } from '../toolbar/utils';


const ImportIcon = (props: {variant?: IconVariant}): JSX.Element => {
    if (props.variant === 'light') {
        return (
            <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.57812 6.85498L6.87116 10.1418L10.158 6.85498" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M12.7458 9.65161L12.7334 12.0888C12.7272 13.1307 11.8838 13.9679 10.8482 13.9679H2.88532C1.84345 13.9679 0.993832 13.1245 1.00003 12.0764V9.65161" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M6.875 0.709229V9.08137" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
            </svg>
        )
    } else {
        return (
            <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.58008 6.88696L6.87312 10.1738L10.16 6.88696" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M12.7458 9.68372L12.7334 12.1209C12.7272 13.1628 11.8838 14 10.8482 14H2.88532C1.84345 14 0.993832 13.1566 1.00003 12.1085V9.68372" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M6.87305 0.741211V9.11335" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
            </svg>
        )
    }
}

export default ImportIcon;

