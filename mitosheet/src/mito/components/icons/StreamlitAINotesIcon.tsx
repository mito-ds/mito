/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';

/**
 * Streamlit AI notes toolbar icon: hex frame + isometric data core, inspired by a
 * neon tech badge; colors use Mito tokens (purple highlight + light blue / lilac accents).
 */
const StreamlitAINotesIcon = (): JSX.Element => {
    return (
        <svg
            className="mito-streamlit-ai-notes-toolbar-svg"
            width="24"
            height="24"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
        >
            <defs>
                <linearGradient id="streamlitAiNotesTop" x1="7" y1="5.5" x2="11" y2="8.5" gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--mito-light-purple, #D0B9FE)" />
                    <stop offset="1" stopColor="var(--mito-medium-purple, #BA9BF8)" />
                </linearGradient>
                <linearGradient id="streamlitAiNotesLeft" x1="7" y1="8" x2="9" y2="11" gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--mito-medium-purple, #BA9BF8)" stopOpacity="0.95" />
                    <stop offset="1" stopColor="var(--mito-purple, #9D6CFF)" stopOpacity="0.55" />
                </linearGradient>
                <linearGradient id="streamlitAiNotesRight" x1="11" y1="8" x2="9" y2="11" gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--mito-highlight, #9D6CFF)" stopOpacity="0.75" />
                    <stop offset="1" stopColor="var(--mito-purple, #9D6CFF)" stopOpacity="0.4" />
                </linearGradient>
            </defs>

            {/* Soft outer glow (purple, reference outer magenta ring) */}
            <path
                d="M14.4 9L11.7 4.32L6.3 4.32L3.6 9L6.3 13.68L11.7 13.68Z"
                stroke="var(--mito-highlight, #9D6CFF)"
                strokeWidth="2.4"
                strokeLinejoin="round"
                opacity="0.28"
            />
            {/* Outer hex stroke */}
            <path
                d="M14.4 9L11.7 4.32L6.3 4.32L3.6 9L6.3 13.68L11.7 13.68Z"
                stroke="var(--mito-highlight, #9D6CFF)"
                strokeWidth="1.05"
                strokeLinejoin="round"
            />
            {/* Inner hex (lighter accent ring — theme-aware so it reads on dark + light toolbars) */}
            <path
                d="M13.35 9L11.14 5.17L6.86 5.17L4.65 9L6.86 12.83L11.14 12.83Z"
                stroke="var(--mito-highlight-light, var(--mito-light-purple, #D0B9FE))"
                strokeWidth="0.75"
                strokeLinejoin="round"
                opacity="0.95"
            />

            {/* Isometric data block */}
            <path
                d="M9 5.85L11.35 7.2L9 8.55L6.65 7.2Z"
                fill="url(#streamlitAiNotesTop)"
                stroke="var(--mito-light-purple, #D0B9FE)"
                strokeWidth="0.45"
                strokeLinejoin="round"
            />
            <path
                d="M6.65 7.2L9 8.55V11.25L6.65 9.9Z"
                fill="url(#streamlitAiNotesLeft)"
                stroke="var(--mito-medium-purple, #BA9BF8)"
                strokeWidth="0.4"
                strokeLinejoin="round"
                opacity="0.95"
            />
            <path
                d="M11.35 7.2L9 8.55V11.25L11.35 9.9Z"
                fill="url(#streamlitAiNotesRight)"
                stroke="var(--mito-highlight, #9D6CFF)"
                strokeWidth="0.4"
                strokeLinejoin="round"
                opacity="0.95"
            />
            {/* Top-edge highlight strip */}
            <path
                d="M9 5.85L11.35 7.2L9 7.95L6.65 7.2Z"
                fill="var(--mito-white, #FFFFFF)"
                opacity="0.22"
            />
        </svg>
    );
};

export default StreamlitAINotesIcon;
