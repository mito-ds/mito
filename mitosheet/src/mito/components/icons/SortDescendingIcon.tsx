/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */



// Copyright (c) Mito

import React from 'react';


const SortDescendingIcon = (props: { aColor?: 'purple' | 'black' }): JSX.Element => {
    const aColor = props.aColor === 'black' ? 'var(--mito-text)' : 'var(--mito-highlight)';
    return (
        <svg width="15" height="15" viewBox="0 0 17 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.3536 18.4239C13.1583 18.6191 12.8417 18.6191 12.6464 18.4239L9.46447 15.2419C9.2692 15.0466 9.2692 14.73 9.46447 14.5348C9.65973 14.3395 9.97631 14.3395 10.1716 14.5348L13 17.3632L15.8284 14.5348C16.0237 14.3395 16.3403 14.3395 16.5355 14.5348C16.7308 14.73 16.7308 15.0466 16.5355 15.2419L13.3536 18.4239ZM13.5 0.0703125V18.0703H12.5V0.0703125L13.5 0.0703125Z" fill="var(--mito-text)"/>
            <path d="M8.54492 7.22705V8.07031H3.24902V7.22705H8.54492ZM8.37305 1.00195L3.49609 8.07031H2.85693V7.29688L7.72852 0.25H8.37305V1.00195ZM7.93262 0.25V1.09863H2.92676V0.25H7.93262Z" fill="var(--mito-text)"/>
            <path d="M5.90234 10.9429L3.31348 18.0703H2.25537L5.23633 10.25H5.91846L5.90234 10.9429ZM8.07227 18.0703L5.47803 10.9429L5.46191 10.25H6.14404L9.13574 18.0703H8.07227ZM7.93799 15.1753V16.0239H3.54443V15.1753H7.93799Z" fill={aColor}/>
        </svg>
    );
}

export default SortDescendingIcon;
