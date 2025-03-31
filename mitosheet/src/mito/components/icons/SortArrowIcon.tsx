/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */




import React from 'react';


const SortArrowIcon = (props: {direction?: 'ascending' | 'descending'}): JSX.Element => {
    if (props.direction === 'ascending') {
        return (
            <svg width="8" height="4" viewBox="0 0 8 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.00073 4L0.536631 0.25H7.46483L4.00073 4Z" fill="#C4C4C4"/>
            </svg>
        )
    } else {
        return (
            <svg width="8" height="4" viewBox="0 0 8 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.00073 0L0.536631 3.75H7.46483L4.00073 0Z" fill="#C4C4C4"/>
            </svg>
        )
    }
}

export default SortArrowIcon;
