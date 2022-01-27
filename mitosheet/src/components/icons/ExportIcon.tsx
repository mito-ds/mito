// Copyright (c) Mito

import React from 'react';
import { IconVariant } from '../toolbar/utils';


const ExportIcon = (props: {variant?: IconVariant}): JSX.Element => {
    if (props.variant === 'light') {
        return (
            <svg width="13" height="15" viewBox="0 0 13 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.58211 4.78446L6.50199 1.70288L3.42188 4.78446" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M12 10.0737L11.9883 12.3531C11.9839 13.3251 11.1934 14.1127 10.2213 14.1127H2.76697C1.79052 14.1113 1 13.3193 1 12.3428L1.00146 10.0737" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M6.5 10.5347V2.69971" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
            </svg>
        )
    } else {
        return (
            <svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.58016 3.81644L6.50004 0.734863L3.41992 3.81644" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M12 9.10571L11.9883 11.3851C11.9839 12.3571 11.1934 13.1447 10.2213 13.1447H2.76697C1.79052 13.1432 1 12.3513 1 11.3748L1.00146 9.10571" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M6.5 9.56679V1.73181" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
            </svg>
        )
    }
}

export default ExportIcon;

