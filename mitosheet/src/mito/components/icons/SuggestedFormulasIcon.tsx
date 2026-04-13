/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import React from 'react';

/** Toolbar icon: tile + ghost column + fx (matches Delete / Insert icon footprint). */
const SuggestedFormulasIcon = (): JSX.Element => {
    return (
        <svg width="18" height="25" viewBox="0 0 22 26" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <rect
                x="0.75"
                y="0.5"
                width="20.5"
                height="25"
                rx="3.25"
                fill="var(--mito-background-off)"
                stroke="var(--mito-text)"
                strokeWidth="0.9"
            />
            <path
                d="M16.8 1.35l0.32 0.95 0.95 0.14-0.74 0.66 0.22 0.92-0.86-0.55-0.86 0.55 0.22-0.92-0.74-0.66 0.95-0.14 0.32-0.95z"
                fill="var(--mito-highlight)"
            />
            <rect x="2.85" y="2.55" width="4.15" height="8.4" rx="0.4" fill="var(--mito-text)" opacity="0.1" />
            <rect x="7.35" y="2.55" width="4.15" height="8.4" rx="0.4" fill="var(--mito-text)" opacity="0.06" />
            <rect
                x="11.85"
                y="2.55"
                width="6.3"
                height="8.4"
                rx="0.4"
                fill="var(--mito-highlight-medium)"
                opacity="0.4"
                stroke="var(--mito-highlight)"
                strokeWidth="0.8"
                strokeDasharray="2 1.5"
            />
            <line x1="11.9" y1="6.7" x2="18.05" y2="6.7" stroke="var(--mito-text-medium)" strokeWidth="0.45" opacity="0.45" />
            {/* fx — bold formula mark */}
            <g stroke="var(--mito-highlight)" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" fill="none">
                <path d="M3.85 14.85h2.35M3.85 14.85v7.35M3.85 18.35h2.05" />
                <path d="M8.35 15l3.45 6.85M11.8 15l-3.45 6.85" />
            </g>
        </svg>
    );
};

export default SuggestedFormulasIcon;
