// Copyright (c) Mito

import React from 'react';
import { IconVariant } from '../toolbar/utils';


const AddColumnIcon = (props: {variant?: IconVariant}): JSX.Element => {
    if (props.variant === 'light') {
        return (
            <svg width="11" height="15" viewBox="0 0 11 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.44262 12.3405V13.6421C7.44262 14.0366 7.12049 14.3587 6.72604 14.3587H1.71657C1.32213 14.3587 1 14.0366 1 13.6421V2.04543C1 1.65099 1.32213 1.32886 1.71657 1.32886H6.72604C7.12049 1.32886 7.44262 1.65099 7.44262 2.04543V3.20905" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M7.44141 5.37842V10.309" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M9.91371 7.84375H4.97656" stroke="white" strokeMiterlimit="10" strokeLinecap="round"/>
            </svg>
        )
    } else {
        return (
            <svg width="11" height="15" viewBox="0 0 11 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.44262 12.3725V13.6741C7.44262 14.0686 7.12049 14.3907 6.72604 14.3907H1.71657C1.32213 14.3907 1 14.0686 1 13.6741V2.07742C1 1.68297 1.32213 1.36084 1.71657 1.36084H6.72604C7.12049 1.36084 7.44262 1.68297 7.44262 2.07742V3.24103" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M7.44141 5.41052V10.3411" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
                <path d="M9.91371 7.87573H4.97656" stroke="#343434" strokeMiterlimit="10" strokeLinecap="round"/>
            </svg>
        )
    }
}

export default AddColumnIcon;

