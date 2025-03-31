/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


import React from 'react';


const EditIcon = (props: {height?: string, width?: string}): JSX.Element => {
    return (
        <svg width={props.width || "25"} height={props.height || "25"} viewBox="0 0 13 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8.67323" y="2.56851" width="2.27778" height="9.93478" transform="rotate(36.5296 8.67323 2.56851)" stroke="var(--mito-text)" strokeWidth="0.5"/>
            <rect x="0.349697" y="-0.0520781" width="2.27778" height="2.1087" transform="matrix(0.80355 0.595237 0.595237 -0.80355 8.33261 2.44081)" stroke="var(--mito-text)" strokeWidth="0.5"/>
            <path d="M1.9732 13.5266L4.22513 12.7599L2.05046 11.149L1.9732 13.5266Z" fill="var(--mito-text)"/>
        </svg>
    )
}

export default EditIcon;


