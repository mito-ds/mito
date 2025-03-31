/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


import React from 'react';

const LegendIcon = (props: { orientation?: 'horizontal' | 'vertical' | 'none' }): JSX.Element => {
    return (
        <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="5.5" y="9.5" width="5" height="10" fill="var(--mito-background-off)" stroke="#C2C2C2"/>
            <rect x="0.5" y="4.5" width="5" height="15" fill="var(--mito-background)" stroke="var(--mito-text-medium)"/>
            {(props.orientation === undefined || props.orientation === 'vertical' || props.orientation === 'none') && 
                <>
                    <path d="M7.5 0.5H13.5V7H7.5V0.5Z" fill="var(--mito-background)" stroke="var(--mito-highlight)"/>
                    <path d="M8.5 1.5H10.5V3.5H8.5V1.5Z" fill="var(--mito-highlight)"/>
                    <rect x="8.5" y="4" width="2" height="2" fill="var(--mito-highlight)"/>
                    <path d="M11 2.5H12.5V3.5H11V2.5Z" fill="var(--mito-highlight)"/>
                    <path d="M11 5H12.5V6H11V5Z" fill="var(--mito-highlight)"/>
                </>
            }
            {props.orientation === 'horizontal' &&
                <>
                    <path d="M0.5 0.5H11.5V4.5H0.5V0.5Z" fill="var(--mito-background)" stroke="var(--mito-highlight)"/>
                    <path d="M6.5 1.5H8.5V3.5H6.5V1.5Z" fill="var(--mito-highlight)"/>
                    <path d="M9 2.5H10.5V3.5H9V2.5Z" fill="var(--mito-highlight)"/>
                    <path d="M1.5 1.5H3.5V3.5H1.5V1.5Z" fill="var(--mito-highlight)"/>
                    <path d="M4 2.5H5.5V3.5H4V2.5Z" fill="var(--mito-highlight)"/>
                </>}
            {(props.orientation === 'none') && <path d="M11 5L15 9.5M11 9.5L15 5" stroke="#CF0000" strokeLinecap="round"/>}
        </svg>
    )
}

export default LegendIcon;