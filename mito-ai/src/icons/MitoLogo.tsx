/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';

const MitoLogo: React.FC<{
    height?: string;
    width?: string;
}> = ({
    height = '30',
    width = '60',
}) => (
    <svg width={width} height={height} viewBox="0 0 60 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="56" height="26" rx="13" fill="#DECEFF" stroke="#9D6CFF" strokeWidth="4"/>
        <path d="M17 29V13" stroke="#9D6CFF" strokeWidth="4"/>
        <ellipse cx="17" cy="13" rx="2" ry="1" fill="#9D6CFF"/>
        <path d="M43 29V13" stroke="#9D6CFF" strokeWidth="4"/>
        <ellipse cx="43" cy="13" rx="2" ry="1" fill="#9D6CFF"/>
        <path d="M30 0.999999V17" stroke="#9D6CFF" strokeWidth="4"/>
        <ellipse rx="2" ry="1" transform="matrix(1 0 0 -1 30 17)" fill="#9D6CFF"/>
    </svg>
);

export default MitoLogo; 