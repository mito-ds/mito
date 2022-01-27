// Copyright (c) Mito

import React from 'react';
import { IconVariant } from '../toolbar/utils';

const PivotIcon = (props: {variant?: IconVariant}): JSX.Element => {
    if (props.variant === 'light') {
        return (
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 1.35864H1V14.3586H14V1.35864Z" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M4.5625 1.67969V14.2032" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M1.23828 4.99438H13.7721" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M10.7165 7.86377V10.9299H7.75391" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M9.74219 8.78565L10.747 7.77051L11.731 8.74421" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M8.01123 11.9244L6.99609 10.9093L7.9698 9.93555" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
            </svg>
        )
    } else {
        return (
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 1.39062H1V14.3906H14V1.39062Z" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M4.56445 1.71179V14.2353" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M1.24023 5.02649H13.7741" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M10.7165 7.89587V10.962H7.75391" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M9.74219 8.81775L10.747 7.80261L11.731 8.77632" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M8.01123 11.9564L6.99609 10.9412L7.9698 9.96753" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
            </svg>
        )
    }
}

export default PivotIcon;

