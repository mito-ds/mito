/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


import React from 'react';

export const OpenFullscreenIcon = (): JSX.Element => {
    return (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.09898 9.01562L1.07178 14.0713" stroke="var(--mito-text)" strokeMiterlimit="10" strokeLinecap="round"/>
            <path d="M13.9999 1.07031L8.97266 6.126" stroke="var(--mito-text)" strokeMiterlimit="10" strokeLinecap="round"/>
            <path d="M1.07178 9.01562V14.0713H6.09898" stroke="var(--mito-text)" strokeMiterlimit="10" strokeLinecap="round"/>
            <path d="M13.9999 6.126V1.07031H8.97266" stroke="var(--mito-text)" strokeMiterlimit="10" strokeLinecap="round"/>
        </svg>
    )
}


export const CloseFullscreenIcon = (): JSX.Element => {
    return (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.05555 8.94434L1 13.9999" stroke="var(--mito-text)" strokeMiterlimit="10" strokeLinecap="round"/>
            <path d="M8.94445 6.05566L14 1.00011" stroke="var(--mito-text)" strokeMiterlimit="10" strokeLinecap="round"/>
            <path d="M6.05469 13.9998V8.9442H0.999135" stroke="var(--mito-text)" strokeMiterlimit="10" strokeLinecap="round"/>
            <path d="M8.94445 1.00011V6.05566H14" stroke="var(--mito-text)" strokeMiterlimit="10" strokeLinecap="round"/>
        </svg>
    )
}
