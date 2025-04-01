/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import React from 'react';

const CopyIcon = (props: { success?: boolean }): JSX.Element => {
    if (props.success) {
        return (
            <svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.5" y="2.56641" width="14" height="18" rx="1.5" stroke="var(--mito-highlight)"/>
                <path d="M1.49219 2.96094C1.49219 1.85637 2.38762 0.960938 3.49219 0.960938H14.4922C15.5968 0.960938 16.4922 1.85637 16.4922 2.96094V17.9609C16.4922 19.0655 15.5968 19.9609 14.4922 19.9609H3.49219C2.38762 19.9609 1.49219 19.0655 1.49219 17.9609V2.96094Z" fill="var(--mito-background-off)"/>
                <rect x="2.48438" y="0.5" width="14" height="18" rx="1.5" stroke="var(--mito-text)"/>
                <path d="M6 11L9.2371 14.2371C9.36264 14.3626 9.57538 14.321 9.64428 14.1573L13.5 5" stroke="var(--mito-status-success)" strokeWidth="1.5" strokeLinecap="square"/>
            </svg>
        )
    }
    return (
        <svg width="18" height="22" viewBox="0 1 18 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1.00781" y="3.03516" width="14" height="18" rx="1.5" stroke="var(--mito-highlight)"/>
            <path d="M2 3.42969C2 2.32512 2.89543 1.42969 4 1.42969H15C16.1046 1.42969 17 2.32512 17 3.42969V18.4297C17 19.5343 16.1046 20.4297 15 20.4297H4C2.89543 20.4297 2 19.5343 2 18.4297V3.42969Z" fill="var(--mito-background-off)"/>
            <rect x="2.99219" y="0.96875" width="14" height="18" rx="1.5" stroke="var(--mito-text)"/>
        </svg>
    )

}

export default CopyIcon;