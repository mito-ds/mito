// Copyright (c) Mito

import React from 'react';
import { IconVariant } from '../toolbar/utils';


const StepsIcon = (props: {variant?: IconVariant}): JSX.Element => {
    if (props.variant === 'light') {
        return (
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.6916 13.9999H2.30835C1.58458 13.9999 1 13.4724 1 12.8192V12.5806C1 11.9274 1.58458 11.3999 2.30835 11.3999H12.6916C13.4154 11.3999 14 11.9274 14 12.5806V12.8192C14 13.4724 13.4154 13.9999 12.6916 13.9999Z" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M12.6916 8.79995H2.30835C1.58458 8.79995 1 8.27495 1 7.62495V7.37495C1 6.72495 1.58458 6.19995 2.30835 6.19995H12.6916C13.4154 6.19995 14 6.72495 14 7.37495V7.61245C14 8.27495 13.4154 8.79995 12.6916 8.79995Z" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M12.6916 3.6H2.30835C1.58458 3.6 1 3.07246 1 2.41932V2.18068C1 1.52754 1.58458 1 2.30835 1H12.6916C13.4154 1 14 1.52754 14 2.18068V2.41932C14 3.07246 13.4154 3.6 12.6916 3.6Z" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
            </svg>
        )
    } else {
        return (
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.6916 13.5156H2.30835C1.58458 13.5156 1 12.9881 1 12.335V12.0963C1 11.4432 1.58458 10.9156 2.30835 10.9156H12.6916C13.4154 10.9156 14 11.4432 14 12.0963V12.335C14 12.9881 13.4154 13.5156 12.6916 13.5156Z" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M12.6916 8.31558H2.30835C1.58458 8.31558 1 7.79058 1 7.14058V6.89058C1 6.24058 1.58458 5.71558 2.30835 5.71558H12.6916C13.4154 5.71558 14 6.24058 14 6.89058V7.12808C14 7.79058 13.4154 8.31558 12.6916 8.31558Z" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M12.6916 3.11563H2.30835C1.58458 3.11563 1 2.58809 1 1.93495V1.6963C1 1.04316 1.58458 0.515625 2.30835 0.515625H12.6916C13.4154 0.515625 14 1.04316 14 1.6963V1.93495C14 2.58809 13.4154 3.11563 12.6916 3.11563Z" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
            </svg>
        )
    }
}

export default StepsIcon;



