// Copyright (c) Mito

import React from 'react';

const OverlayIcon = (props: { axis?: 'x' | 'y' }): JSX.Element => {
    return <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
        {(props.axis === undefined || props.axis === 'x') ?
            <>
                <path d="M7 26C7 25.4477 7.44772 25 8 25H16C16.5523 25 17 25.4477 17 26V38H7V26Z" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight)"/>
                <path d="M7 30C7 29.4477 7.44772 29 8 29H16C16.5523 29 17 29.4477 17 30V44H7V30Z" fill="var(--mito-highlight-medium)" stroke="var(--mito-highlight)"/>
                <path d="M17 13C17 12.4477 17.4477 12 18 12H26C26.5523 12 27 12.4477 27 13V27H17V13Z" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight)"/>
                <path d="M17 20C17 19.4477 17.4477 19 18 19H26C26.5523 19 27 19.4477 27 20V44H17V20Z" fill="var(--mito-highlight-medium)" stroke="var(--mito-highlight)"/>
                <path d="M27 23C27 22.4477 27.4477 22 28 22H36C36.5523 22 37 22.4477 37 23V33.3514H27V23Z" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight)"/>
                <path d="M27 26.0781C27 25.5258 27.4477 25.0781 28 25.0781H36C36.5523 25.0781 37 25.5258 37 26.0781V43.997H27V26.0781Z" fill="var(--mito-highlight-medium)" stroke="var(--mito-highlight)"/>
            </>: 
            <>
                <path d="M18.8965 10.0703C19.4488 10.0703 19.8965 10.518 19.8965 11.0703V19.0703C19.8965 19.6226 19.4488 20.0703 18.8965 20.0703H6.89648L6.89648 10.0703L18.8965 10.0703Z" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight)"/>
                <path d="M14.8965 10.0703C15.4488 10.0703 15.8965 10.518 15.8965 11.0703L15.8965 19.0703C15.8965 19.6226 15.4488 20.0703 14.8965 20.0703H1L1.0002 10.0703L14.8965 10.0703Z" fill="var(--mito-highlight-medium)" stroke="var(--mito-highlight)"/>
                <path d="M32.0039 20C32.5562 20 33.0039 20.4477 33.0039 21V29C33.0039 29.5523 32.5562 30 32.0039 30H18.0039V20L32.0039 20Z" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight)"/>
                <path d="M25.0039 20C25.5562 20 26.0039 20.4477 26.0039 21V29C26.0039 29.5523 25.5562 30 25.0039 30L1.00391 30V20L25.0039 20Z" fill="var(--mito-highlight-medium)" stroke="var(--mito-highlight)"/>
                <path d="M23.1113 30.0547C23.6636 30.0547 24.1113 30.5024 24.1113 31.0547V39.0547C24.1113 39.607 23.6636 40.0547 23.1113 40.0547H12.131L12.131 30.0547H23.1113Z" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight)"/>
                <path d="M19.8633 30.0547C20.4156 30.0547 20.8633 30.5024 20.8633 31.0547V39.0547C20.8633 39.607 20.4156 40.0547 19.8633 40.0547H0.999531V30.0547L19.8633 30.0547Z" fill="var(--mito-highlight-medium)" stroke="var(--mito-highlight)"/>
            </>}
        <path d="M1 0V44H45" stroke="var(--mito-text-medium)"/>
    </svg>
    
}

export default OverlayIcon;