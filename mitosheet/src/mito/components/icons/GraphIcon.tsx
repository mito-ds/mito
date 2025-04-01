/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { IconVariant } from '../toolbar/Toolbar';

const GraphIcon = (props: {variant?: IconVariant; isToolbar?: boolean}): JSX.Element => {
    if (props.isToolbar === true || props.isToolbar === undefined) {
        return (
            <svg width="14" height="18" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.93689" y="9.57031" width="4" height="7" fill="var(--mito-text-light)" stroke="var(--mito-text)"/>
                <rect x="8.93689" y="5.57031" width="4" height="11" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight)"/>
                <rect x="4.93689" y="0.570312" width="4" height="16" fill="var(--mito-background-off)" stroke="var(--mito-text)"/>
            </svg>
        )
    }
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