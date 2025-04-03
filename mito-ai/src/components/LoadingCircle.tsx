/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import React from 'react';

/*
    A spinning circle loading indicator that inherits its color from the parent component.
*/
const LoadingCircle = (): JSX.Element => {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" opacity="0.25"/>
            <path 
                d="M8 1C11.866 1 15 4.13401 15 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            >
                <animateTransform
                    attributeName="transform"
                    attributeType="XML"
                    type="rotate"
                    from="0 8 8"
                    to="360 8 8"
                    dur="1s"
                    repeatCount="indefinite"
                />
            </path>
        </svg>
    )
}

export default LoadingCircle;