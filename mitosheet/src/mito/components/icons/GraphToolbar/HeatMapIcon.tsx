/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


import React from 'react';

const HeatMapIcon = (props: { width?: string }): JSX.Element => {
    return (
        <svg width={props.width ?? "10"} height={props.width ?? "10"} viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="5" height="5" fill="#F2C94C"/>
            <rect x="5" y="5" width="5" height="5" fill="#EB5757"/>
            <rect y="5" width="5" height="5" fill="#F2994A"/>
            <rect x="5" width="5" height="5" fill="#F2994A"/>
        </svg>
    )
}

export default HeatMapIcon;