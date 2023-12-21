// Copyright (c) Mito

import React from 'react';

const TriangleExpandCollapseIcon = (props: {action: 'expand' | 'collapse' }): JSX.Element => {

    if (props.action === 'collapse') {
        return (
            <svg width="25px" height="25px" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.72339 6L0.259287 0L7.18749 0L3.72339 6Z" fill="var(--mito-status-warning-dark)"/>
            </svg>
        )
    } else {
        return (
            <svg width="25px" height="25px" viewBox="0 0 7 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.723389 4L6.72339 0.535898L6.72339 7.4641L0.723389 4Z" fill="var(--mito-status-warning-dark)"/>
            </svg>
        )
    }
}

export default TriangleExpandCollapseIcon;
