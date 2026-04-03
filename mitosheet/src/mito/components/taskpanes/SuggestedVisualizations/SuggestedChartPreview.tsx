/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import React from 'react';

const VB = '0 0 56 40';

/**
 * Minimal decorative SVG per chart type (not real data — thumbnail only).
 */
const SuggestedChartPreview = (props: { graphType: string }): JSX.Element => {
    const t = props.graphType.trim().toLowerCase();

    switch (t) {
        case 'line':
            return (
                <svg className="suggested-viz-preview-svg" viewBox={VB} aria-hidden>
                    <path
                        d="M 6 28 L 14 22 L 22 24 L 30 14 L 38 18 L 46 10 L 50 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            );
        case 'scatter':
            return (
                <svg className="suggested-viz-preview-svg" viewBox={VB} aria-hidden>
                    <circle cx="12" cy="22" r="2.2" fill="currentColor" />
                    <circle cx="20" cy="14" r="2.2" fill="currentColor" />
                    <circle cx="28" cy="18" r="2.2" fill="currentColor" />
                    <circle cx="36" cy="10" r="2.2" fill="currentColor" />
                    <circle cx="44" cy="16" r="2.2" fill="currentColor" />
                    <circle cx="18" cy="28" r="2" fill="currentColor" opacity="0.55" />
                </svg>
            );
        case 'histogram':
            return (
                <svg className="suggested-viz-preview-svg" viewBox={VB} aria-hidden>
                    <rect x="8" y="22" width="7" height="12" rx="1" fill="currentColor" opacity="0.35" />
                    <rect x="16" y="16" width="7" height="18" rx="1" fill="currentColor" opacity="0.5" />
                    <rect x="24" y="12" width="7" height="22" rx="1" fill="currentColor" opacity="0.65" />
                    <rect x="32" y="14" width="7" height="20" rx="1" fill="currentColor" opacity="0.55" />
                    <rect x="40" y="20" width="7" height="14" rx="1" fill="currentColor" opacity="0.4" />
                </svg>
            );
        case 'box':
            return (
                <svg className="suggested-viz-preview-svg" viewBox={VB} aria-hidden>
                    <line x1="10" y1="14" x2="10" y2="26" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="46" y1="18" x2="46" y2="24" stroke="currentColor" strokeWidth="1.5" />
                    <rect x="18" y="16" width="20" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="2" />
                    <line x1="18" y1="22" x2="38" y2="22" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
                </svg>
            );
        case 'violin':
            return (
                <svg className="suggested-viz-preview-svg" viewBox={VB} aria-hidden>
                    <path
                        d="M 28 8 C 38 12 38 28 28 32 C 18 28 18 12 28 8 Z"
                        fill="currentColor"
                        fillOpacity="0.2"
                        stroke="currentColor"
                        strokeWidth="1.5"
                    />
                    <line x1="28" y1="12" x2="28" y2="28" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
                </svg>
            );
        case 'strip':
            return (
                <svg className="suggested-viz-preview-svg" viewBox={VB} aria-hidden>
                    <line x1="8" y1="22" x2="48" y2="22" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
                    <circle cx="14" cy="22" r="2.5" fill="currentColor" />
                    <circle cx="24" cy="22" r="2.5" fill="currentColor" />
                    <circle cx="34" cy="22" r="2.5" fill="currentColor" />
                    <circle cx="42" cy="22" r="2.5" fill="currentColor" />
                </svg>
            );
        case 'density heatmap':
            return (
                <svg className="suggested-viz-preview-svg" viewBox={VB} aria-hidden>
                    <rect x="8" y="8" width="9" height="9" rx="1" fill="currentColor" opacity="0.2" />
                    <rect x="19" y="8" width="9" height="9" rx="1" fill="currentColor" opacity="0.45" />
                    <rect x="30" y="8" width="9" height="9" rx="1" fill="currentColor" opacity="0.65" />
                    <rect x="41" y="8" width="9" height="9" rx="1" fill="currentColor" opacity="0.35" />
                    <rect x="8" y="19" width="9" height="9" rx="1" fill="currentColor" opacity="0.5" />
                    <rect x="19" y="19" width="9" height="9" rx="1" fill="currentColor" opacity="0.75" />
                    <rect x="30" y="19" width="9" height="9" rx="1" fill="currentColor" opacity="0.4" />
                    <rect x="41" y="19" width="9" height="9" rx="1" fill="currentColor" opacity="0.55" />
                    <rect x="8" y="30" width="9" height="9" rx="1" fill="currentColor" opacity="0.35" />
                    <rect x="19" y="30" width="9" height="9" rx="1" fill="currentColor" opacity="0.5" />
                    <rect x="30" y="30" width="9" height="9" rx="1" fill="currentColor" opacity="0.3" />
                    <rect x="41" y="30" width="9" height="9" rx="1" fill="currentColor" opacity="0.6" />
                </svg>
            );
        case 'density contour':
            return (
                <svg className="suggested-viz-preview-svg" viewBox={VB} aria-hidden>
                    <ellipse cx="28" cy="20" rx="22" ry="14" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
                    <ellipse cx="28" cy="20" rx="14" ry="9" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.55" />
                    <ellipse cx="28" cy="20" rx="7" ry="5" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.75" />
                </svg>
            );
        case 'ecdf':
            return (
                <svg className="suggested-viz-preview-svg" viewBox={VB} aria-hidden>
                    <path
                        d="M 8 30 L 8 26 L 16 26 L 16 20 L 24 20 L 24 16 L 32 16 L 32 12 L 40 12 L 40 8 L 48 8 L 48 6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="miter"
                    />
                </svg>
            );
        case 'bar':
        default:
            return (
                <svg className="suggested-viz-preview-svg" viewBox={VB} aria-hidden>
                    <rect x="10" y="20" width="8" height="14" rx="1" fill="currentColor" opacity="0.45" />
                    <rect x="22" y="12" width="8" height="22" rx="1" fill="currentColor" opacity="0.65" />
                    <rect x="34" y="16" width="8" height="18" rx="1" fill="currentColor" opacity="0.55" />
                </svg>
            );
    }
};

export default SuggestedChartPreview;
