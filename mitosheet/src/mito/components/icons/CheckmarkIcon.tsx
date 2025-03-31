/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


// Copyright (c) Mito

import React from 'react';

const CheckmarkIcon = (props: { paddingRight?: string; color?: string; width?: string; height?: string }): JSX.Element => {
    return (
        <svg style={{ paddingRight: props.paddingRight }} width={props.width ?? "15"} height={props.height ?? "12"} viewBox="0 1 15 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.80396 7.58667L5.13903 10.4804C5.3476 10.6613 5.66339 10.6389 5.84436 10.4304L13.2045 1.94761" stroke={props.color ?? "white"} strokeWidth="2" strokeLinecap="round"/>
        </svg>
    )
}

export default CheckmarkIcon;