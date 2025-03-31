/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


import React from 'react';

const NonLoadingCircle = (): JSX.Element => {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 15.25C12.0041 15.25 15.25 12.0041 15.25 8C15.25 3.99594 12.0041 0.75 8 0.75C3.99593 0.75 0.75 3.99594 0.75 8C0.75 12.0041 3.99593 15.25 8 15.25Z" fill="#E8EBF8" stroke="#ACACAD" strokeWidth="0.5"/>
        </svg>
    )
}

export default NonLoadingCircle;