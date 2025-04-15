/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import React from 'react';



const SelectDropdownIcon = (props: {variant: 'select' | 'dropdown button', disabled?: boolean}): JSX.Element => {
    const fill = props.disabled === true ? 'var(--mito-text-light)' : props.variant === 'select' ? 'var(--mito-background)' : 'var(--mito-highlight)'
    
    return (
        <svg width="6" height="4" viewBox="0 0 6 4" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0L3.00283 4L6 0" fill={fill}/>
        </svg>
    )
}

export default SelectDropdownIcon;







