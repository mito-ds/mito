// Copyright (c) Mito

import React from 'react';

const NormalizedIcon = (props: { axis?: 'x' | 'y' }): JSX.Element => {
    return (
        <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
            {
                (props.axis === undefined || props.axis === 'x') ? 
                    <>
                        <path d="M7 25.1797C7 24.6274 7.44772 24.1797 8 24.1797H16C16.5523 24.1797 17 24.6274 17 25.1797V44.0011H7V25.1797Z" fill="var(--mito-highlight-medium)" stroke="var(--mito-highlight)"/>
                        <path d="M7 8C7 7.44771 7.44772 7 8 7H16C16.5523 7 17 7.44772 17 8V24.1786H7V8Z" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight)"/>
                        <path d="M17 17C17 16.4477 17.4477 16 18 16H26C26.5523 16 27 16.4477 27 17V44H17V17Z" fill="var(--mito-highlight-medium)" stroke="var(--mito-highlight)"/>
                        <path d="M17 8C17 7.44772 17.4477 7 18 7H26C26.5523 7 27 7.44772 27 8V16H17V8Z" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight)"/>
                        <path d="M27 38C27 37.4477 27.4477 37 28 37H36C36.5523 37 37 37.4477 37 38V44H27V38Z" fill="var(--mito-highlight-medium)" stroke="var(--mito-highlight)"/>
                        <path d="M27 8C27 7.44772 27.4477 7 28 7H36C36.5523 7 37 7.44772 37 8V37H27V8Z" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight)"/>
                    </>
                    : <>
                        <rect x="20.8457" y="10.5" width="10" height="19.8075" transform="rotate(90 20.8457 10.5)" fill="var(--mito-highlight-medium)" stroke="var(--mito-highlight)"/>
                        <path d="M37.0117 10.5C37.564 10.5 38.0117 10.9477 38.0117 11.5V19.5C38.0117 20.0523 37.564 20.5 37.0117 20.5H20.8452V10.5L37.0117 10.5Z" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight)"/>
                        <rect x="28.0117" y="21" width="10" height="27" transform="rotate(90 28.0117 21)" fill="var(--mito-highlight-medium)" stroke="var(--mito-highlight)"/>
                        <path d="M37.0117 21C37.564 21 38.0117 21.4477 38.0117 22V30C38.0117 30.5523 37.564 31 37.0117 31H28.0117V21H37.0117Z" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight)"/>
                        <rect x="7.94141" y="31" width="10" height="6.92397" transform="rotate(90 7.94141 31)" fill="var(--mito-highlight-medium)" stroke="var(--mito-highlight)"/>
                        <path d="M37.0117 31C37.564 31 38.0117 31.4477 38.0117 32V40C38.0117 40.5523 37.564 41 37.0117 41L7.937 41V31L37.0117 31Z" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight)"/>
                    </>
            }
            <path d="M1 0V44H45" stroke="var(--mito-text-medium)"/>
        </svg>
    )
}

export default NormalizedIcon;