/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';

const NotepadIcon: React.FC = () => (
    <svg width="14" height="14" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Back paper (shadow/stack effect) */}
        <rect 
            x="18" 
            y="18" 
            width="64" 
            height="72" 
            rx="8" 
            ry="8" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            opacity="0.3"
        />
        {/* Front paper */}
        <rect 
            x="10" 
            y="10" 
            width="64" 
            height="72" 
            rx="8" 
            ry="8" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        />
        {/* Text lines */}
        <line x1="24" y1="35" x2="60" y2="35" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
        <line x1="24" y1="48" x2="60" y2="48" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
        <line x1="24" y1="61" x2="60" y2="61" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
    </svg>
);

export default NotepadIcon;
