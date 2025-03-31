/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


import React from 'react';

const RangeSliderIcon = (props: { hasRangeSlider?: boolean }): JSX.Element => {
    return (
        <svg width="11" height="25" viewBox="0 0 11 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            {(props.hasRangeSlider === undefined || props.hasRangeSlider) && <path d="M1 17V15M1 17V19M1 17H9M9 17V15M9 17V19" stroke="var(--mito-highlight)" transform='translate(0 3)' strokeWidth="0.75" strokeLinecap="round"/>}
            <rect x="5.5" y="5.5" width="5" height="10" fill="var(--mito-background-off)" stroke="#C2C2C2"/>
            <rect x="0.5" y="0.5" width="5" height="15" fill="var(--mito-background)" stroke="var(--mito-text-medium)"/>
        </svg>
    )
}

export default RangeSliderIcon;