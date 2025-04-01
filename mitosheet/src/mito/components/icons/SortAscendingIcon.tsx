/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */



// Copyright (c) Mito

import React from 'react';


const SortAscendingIcon = (props: { aColor?: 'purple' | 'black' }): JSX.Element => {
    const aColor = props.aColor === 'black' ? 'var(--mito-text)' : 'var(--mito-highlight)';
    return (
        <svg width="15" height="15" viewBox="0 0 17 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.90234 0.942871L3.31348 8.07031H2.25537L5.23633 0.25H5.91846L5.90234 0.942871ZM8.07227 8.07031L5.47803 0.942871L5.46191 0.25H6.14404L9.13574 8.07031H8.07227ZM7.93799 5.17529V6.02393H3.54443V5.17529H7.93799Z" fill={aColor}/>
            <path d="M8.54492 17.2271V18.0703H3.24902V17.2271H8.54492ZM8.37305 11.002L3.49609 18.0703H2.85693V17.2969L7.72852 10.25H8.37305V11.002ZM7.93262 10.25V11.0986H2.92676V10.25H7.93262Z" fill="var(--mito-text)"/>
            <path d="M12.6464 18.4239C12.8417 18.6191 13.1583 18.6191 13.3536 18.4239L16.5355 15.2419C16.7308 15.0466 16.7308 14.73 16.5355 14.5348C16.3403 14.3395 16.0237 14.3395 15.8284 14.5348L13 17.3632L10.1716 14.5348C9.97631 14.3395 9.65973 14.3395 9.46447 14.5348C9.2692 14.73 9.2692 15.0466 9.46447 15.2419L12.6464 18.4239ZM12.5 0.0703125V18.0703H13.5V0.0703125L12.5 0.0703125Z" fill="var(--mito-text)"/>
        </svg>
    )
}

export default SortAscendingIcon;
