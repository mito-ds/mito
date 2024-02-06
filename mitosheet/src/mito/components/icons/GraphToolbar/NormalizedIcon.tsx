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
                        <path d="M17 15C17 14.4477 17.4477 14 18 14H26C26.5523 14 27 14.4477 27 15V44H17V15Z" fill="var(--mito-highlight-medium)" stroke="var(--mito-highlight)"/>
                        <path d="M17 8C17 7.44772 17.4477 7 18 7H26C26.5523 7 27 7.44772 27 8V16H17V8Z" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight)"/>
                        <path d="M27 19.9961C27 19.4438 27.4477 18.9961 28 18.9961H36C36.5523 18.9961 37 19.4438 37 19.9961V43.9961H27V19.9961Z" fill="var(--mito-highlight-medium)" stroke="var(--mito-highlight)"/>
                        <path d="M27 8C27 7.44772 27.4477 7 28 7H36C36.5523 7 37 7.44772 37 8V37H27V8Z" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight)"/>
                    </>
                    : <>
                        <path d="M15 9.00391C15.5523 9.00391 16 9.45162 16 10.0039L16 18.0039C16 18.5562 15.5523 19.0039 15 19.0039L1 19.0039L1 9.00391L15 9.00391Z" fill="var(--mito-highlight-medium)" stroke="var(--mito-highlight)"/>
                        <path d="M40 9.00391C40.5523 9.00391 41 9.45162 41 10.0039V18.0039C41 18.5562 40.5523 19.0039 40 19.0039L14 19.0039L14 9.00391L40 9.00391Z" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight)"/>
                        <path d="M27.0273 27.0039C27.5796 27.0039 28.0273 27.4516 28.0273 28.0039V36.0039C28.0273 36.5562 27.5796 37.0039 27.0273 37.0039L1.00032 37.0039L1.00032 27.0039L27.0273 27.0039Z" fill="var(--mito-highlight-medium)" stroke="var(--mito-highlight)"/>
                        <path d="M40 27.0039C40.5523 27.0039 41 27.4516 41 28.0039V36.0039C41 36.5562 40.5523 37.0039 40 37.0039H24.7838L24.7838 27.0039L40 27.0039Z" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight)"/>
                    </>
            }
            <path d="M1 0V44H45" stroke="var(--mito-text-medium)"/>
        </svg>
    )
}

export default NormalizedIcon;