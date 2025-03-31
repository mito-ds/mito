/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


import React from 'react';


const ScheduleIcon = (): JSX.Element => {

    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="7.5" fill="var(--mito-background-off)" stroke="var(--mito-text)"/>
            <line x1="8" y1="8.875" x2="12" y2="8.875" stroke="var(--mito-highlight)" strokeWidth="1.25"/>
            <line x1="7.875" y1="9.5" x2="7.875" y2="3.5" stroke="var(--mito-highlight)" strokeWidth="1.25"/>
        </svg>

    )
}

export default ScheduleIcon;

