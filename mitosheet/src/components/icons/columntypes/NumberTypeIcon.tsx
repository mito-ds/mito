// Copyright (c) Mito

import React from 'react';


const NumberTypeIcon = (props: {purpleOrDark?: 'dark' | 'purple'}): JSX.Element => {

    if (props.purpleOrDark === 'purple') {
        return (
            <svg width="15" height="11" viewBox="0 0 15 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line y1="-0.5" x2="10.0396" y2="-0.5" transform="matrix(-0.0944568 0.995529 -0.999748 -0.0224389 4.51965 0)" stroke="var(--mito-purple)"/>
                <line y1="-0.5" x2="10.0395" y2="-0.5" transform="matrix(-0.09438 0.995536 -0.999749 -0.0224205 10.1404 0.00488281)" stroke="var(--mito-purple)"/>
                <line y1="-0.5" x2="13.3982" y2="-0.5" transform="matrix(-0.999424 0.0339259 -0.060929 -0.998142 14 2.72754)" stroke="var(--mito-purple)"/>
                <line y1="-0.5" x2="14.0074" y2="-0.5" transform="matrix(-0.999473 0.0324504 -0.0582855 -0.9983 14 6.36328)" stroke="var(--mito-purple)"/>
            </svg>
        ) 
    }

    return (
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line y1="-0.5" x2="10.0396" y2="-0.5" transform="matrix(-0.0944568 0.995529 -0.999748 -0.0224389 4.51965 0)" stroke="#343434"/>
            <line y1="-0.5" x2="10.0395" y2="-0.5" transform="matrix(-0.09438 0.995536 -0.999749 -0.0224205 10.1404 0.00488281)" stroke="#343434"/>
            <line y1="-0.5" x2="13.3982" y2="-0.5" transform="matrix(-0.999424 0.0339259 -0.060929 -0.998142 14 2.72754)" stroke="#343434"/>
            <line y1="-0.5" x2="14.0074" y2="-0.5" transform="matrix(-0.999473 0.0324504 -0.0582855 -0.9983 14 6.36328)" stroke="#343434"/>
        </svg>
    )
}

export default NumberTypeIcon;

