/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


import React from 'react';

const GroupIcon = (props: { axis?: 'x' | 'y' }): JSX.Element => {
    return (
        <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
            {
                (props.axis === undefined || props.axis === 'x') ? 
                    <>
                        <path d="M4.38477 17.5195C4.38477 16.9672 4.83248 16.5195 5.38477 16.5195H10.6003C11.1526 16.5195 11.6003 16.9672 11.6003 17.5195V44.0018H4.38477V17.5195Z" fill="var(--mito-highlight-medium)" stroke="var(--mito-highlight)"/>
                        <path d="M11.5996 5.74219C11.5996 5.1899 12.0473 4.74219 12.5996 4.74219H17.8152C18.3675 4.74219 18.8152 5.1899 18.8152 5.74219V44.0026H11.5996V5.74219Z" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight-medium)"/>
                        <path d="M25 11.0234C25 10.4712 25.4477 10.0234 26 10.0234H31.1223C31.6746 10.0234 32.1223 10.4712 32.1223 11.0234V43.9943H25V11.0234Z" fill="var(--mito-highlight-medium)" stroke="var(--mito-highlight)"/>
                        <path d="M32.123 29.8867C32.123 29.3344 32.5708 28.8867 33.123 28.8867H38.5845C39.1368 28.8867 39.5845 29.3344 39.5845 29.8867V43.9849H32.123V29.8867Z" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight-medium)"/>
                    </>
                    : <>
                        <path d="M39.5879 4.00391C40.1402 4.00391 40.5879 4.45162 40.5879 5.00391V10.2195C40.5879 10.7718 40.1402 11.2195 39.5879 11.2195L1.32745 11.2195V4.00391L39.5879 4.00391Z" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight)"/>
                        <path d="M27.4824 11.0039C28.0347 11.0039 28.4824 11.4516 28.4824 12.0039V17.2195C28.4824 17.7718 28.0347 18.2195 27.4824 18.2195L1.00011 18.2195V11.0039L27.4824 11.0039Z" fill="var(--mito-highlight-medium)" stroke="var(--mito-highlight-medium)"/>
                        <path d="M16.0977 26.0039C16.6499 26.0039 17.0977 26.4516 17.0977 27.0039V32.4654C17.0977 33.0177 16.6499 33.4654 16.0977 33.4654H1.99951L1.99951 26.0039L16.0977 26.0039Z" fill="var(--mito-highlight-light)" stroke="var(--mito-highlight)"/>
                        <path d="M33.9707 33.0039C34.523 33.0039 34.9707 33.4516 34.9707 34.0039V39.1262C34.9707 39.6785 34.523 40.1262 33.9707 40.1262L0.999874 40.1262V33.0039L33.9707 33.0039Z" fill="var(--mito-highlight-medium)" stroke="var(--mito-highlight-medium)"/>
                    </>
            }
            <path d="M1 0V44H45" stroke="var(--mito-text-medium)"/>
        </svg>
    )
}

export default GroupIcon;