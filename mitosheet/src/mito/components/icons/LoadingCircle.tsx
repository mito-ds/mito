/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import React from 'react';

const LoadingCircle = (): JSX.Element => {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="7.25" fill="#F5F5F5" stroke="var(--mito-highlight)" strokeWidth="0.5"/>
            <path d="M15 8C15 7.0256 14.7966 6.06193 14.4027 5.17067C14.0089 4.27941 13.4333 3.48019 12.7128 2.82416L8 8H15Z" fill="var(--mito-highlight)">
                <animateTransform attributeName="transform"
                    attributeType="XML"
                    type="rotate"
                    from="0 8 8"
                    to="360 8 8"
                    dur="1s"
                    repeatCount="indefinite"/>
            </path>
            <circle cx="8" cy="8" r="5" fill="white" stroke="var(--mito-highlight)" strokeWidth="0.5"/>
        </svg>
    )
}

export default LoadingCircle;