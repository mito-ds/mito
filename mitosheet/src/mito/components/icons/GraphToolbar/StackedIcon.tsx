/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


import React from 'react';

const StackedIcon = (props: { axis?: 'x' | 'y' }): JSX.Element => {
    return (
        <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
            {
                (props.axis === undefined || props.axis === 'x') ? 
                    <>
                        <path d="M7 30C7 29.4477 7.44772 29 8 29H16C16.5523 29 17 29.4477 17 30V44H7V30Z" fill="var(--mito-highlight-medium)" stroke="var(--mito-highlight)"/>
                        <path d="M7 17C7 16.4477 7.44772 16 8 16H16C16.5523 16 17 16.4477 17 17V29H7V17Z" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight)"/>
                        <path d="M17 23C17 22.4477 17.4477 22 18 22H26C26.5523 22 27 22.4477 27 23V44H17V23Z" fill="var(--mito-highlight-medium)" stroke="var(--mito-highlight)"/>
                        <path d="M17 8C17 7.44772 17.4477 7 18 7H26C26.5523 7 27 7.44772 27 8V22H17V8Z" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight)"/>
                        <path d="M27 28C27 27.4477 27.4477 27 28 27H36C36.5523 27 37 27.4477 37 28V44H27V28Z" fill="var(--mito-highlight-medium)" stroke="var(--mito-highlight)"/>
                        <path d="M27 17C27 16.4477 27.4477 16 28 16H36C36.5523 16 37 16.4477 37 17V27.3514H27V17Z" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight)"/>
                    </>
                    : <>
                        <path d="M16.6641 10.4375V20.4375L1.02344 20.4375L1.02344 10.4375L16.6641 10.4375Z" fill="var(--mito-highlight-medium)" stroke="var(--mito-highlight)"/>
                        <path d="M28.6641 10.4375C29.2163 10.4375 29.6641 10.8852 29.6641 11.4375V19.4375C29.6641 19.9898 29.2163 20.4375 28.6641 20.4375H16.6641V10.4375L28.6641 10.4375Z" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight)"/>
                        <rect x="24.0039" y="21" width="10" height="23" transform="rotate(90 24.0039 21)" fill="var(--mito-highlight-medium)" stroke="var(--mito-highlight)"/>
                        <path d="M37.5234 20.5C38.0757 20.5 38.5234 20.9477 38.5234 21.5V29.5C38.5234 30.0523 38.0757 30.5 37.5234 30.5H23.5234V20.5L37.5234 20.5Z" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight)"/>
                        <rect x="18.0078" y="31" width="10" height="17" transform="rotate(90 18.0078 31)" fill="var(--mito-highlight-medium)" stroke="var(--mito-highlight)"/>
                        <path d="M28.5098 31C29.062 31 29.5098 31.4477 29.5098 32V40C29.5098 40.5523 29.0621 41 28.5098 41H18.0032V31L28.5098 31Z" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight)"/>
                    </>
            }
            <path d="M1 0V44H45" stroke="var(--mito-text-medium)"/>
        </svg>
    )
}

export default StackedIcon;