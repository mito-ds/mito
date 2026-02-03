/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { classNames } from '../../utils/classNames';
import featureSquaresStyles from './FeatureSquares.module.css';
import pageStyles from '../../styles/Page.module.css';

interface FeatureCardData {
    id: string;
    title: string;
    description: string;
    link?: { href: string; label: string };
    videoSrc: string;
    posterSrc?: string;
    isHero?: boolean;
}

/* Realistic line graph points with upward trend and volatility */
const LINE_POINTS = '0,78 3,76 6,80 9,75 12,77 15,72 18,74 21,70 24,73 27,68 30,72 33,65 36,70 39,62 42,58 45,65 48,55 51,60 54,50 57,58 60,52 63,48 66,55 69,45 72,50 75,42 78,48 81,38 84,45 87,35 90,40 93,30 96,35 100,25';
/* Area fill polygon: same points + bottom corners */
const AREA_POINTS = LINE_POINTS + ' 100,100 0,100';

function SmartDebuggingPreview({ isHovered }: { isHovered: boolean }) {
    return (
        <div className={featureSquaresStyles.smart_debugging_preview}>
            <div className={featureSquaresStyles.smart_debugging_container}>
                {/* Error message - always visible behind */}
                <div className={featureSquaresStyles.smart_debugging_error}>
                    <span className={featureSquaresStyles.smart_debugging_error_text}>
                        NameError: name
                    </span>
                    <span className={featureSquaresStyles.smart_debugging_error_text}>
                        &apos;pandas&apos; is not defined
                    </span>
                </div>
                {/* Correct code - swings down and slides in front on hover */}
                <div
                    className={classNames(
                        featureSquaresStyles.smart_debugging_fix,
                        { [featureSquaresStyles.smart_debugging_fix_active]: isHovered }
                    )}
                >
                    <span className={featureSquaresStyles.smart_debugging_fix_text}>
                        import pandas as pd
                    </span>
                    <span className={featureSquaresStyles.smart_debugging_fix_text}>
                        df = pd.read_csv(&apos;data.csv&apos;)
                    </span>
                </div>
            </div>
        </div>
    );
}

function ChartWizardPreview({ isHovered }: { isHovered: boolean }) {
    return (
        <div className={featureSquaresStyles.chart_wizard_preview}>
            <div className={featureSquaresStyles.chart_wizard_graph}>
                {/* Axes */}
                <div className={featureSquaresStyles.chart_wizard_axes} aria-hidden />
                <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className={featureSquaresStyles.chart_wizard_svg}
                    aria-hidden
                >
                    {/* Area fill under the line */}
                    <polygon
                        points={AREA_POINTS}
                        className={classNames(
                            featureSquaresStyles.chart_wizard_area,
                            { [featureSquaresStyles.chart_wizard_area_active]: isHovered }
                        )}
                    />
                    {/* Line stroke */}
                    <polyline
                        points={LINE_POINTS}
                        className={classNames(
                            featureSquaresStyles.chart_wizard_line,
                            { [featureSquaresStyles.chart_wizard_line_active]: isHovered }
                        )}
                        fill="none"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
            <div className={featureSquaresStyles.chart_wizard_sliders}>
                <div className={featureSquaresStyles.chart_wizard_slider}>
                    <div
                        className={classNames(
                            featureSquaresStyles.chart_wizard_slider_track,
                            { [featureSquaresStyles.chart_wizard_slider_track_active]: isHovered }
                        )}
                    >
                        <div
                            className={classNames(
                                featureSquaresStyles.chart_wizard_slider_thumb,
                                { [featureSquaresStyles.chart_wizard_slider_thumb_active]: isHovered }
                            )}
                        />
                    </div>
                </div>
                <div className={featureSquaresStyles.chart_wizard_slider}>
                    <div className={featureSquaresStyles.chart_wizard_slider_track}>
                        <div className={featureSquaresStyles.chart_wizard_slider_thumb} />
                    </div>
                </div>
                <div className={featureSquaresStyles.chart_wizard_slider}>
                    <div className={featureSquaresStyles.chart_wizard_slider_track}>
                        <div className={featureSquaresStyles.chart_wizard_slider_thumb} />
                    </div>
                </div>
            </div>
            {isHovered && (
                <div className={featureSquaresStyles.chart_wizard_cursor} aria-hidden>
                    <svg
                        viewBox="0 0 24 24"
                        width={20}
                        height={20}
                        className={featureSquaresStyles.chart_wizard_cursor_icon}
                    >
                        <path
                            fill="currentColor"
                            d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z"
                        />
                    </svg>
                </div>
            )}
        </div>
    );
}

const FEATURES: FeatureCardData[] = [
    {
        id: 'jupyter-agent',
        title: 'Jupyter Agent',
        description: 'ChatGPT in Jupyter. Your personal coding assistant that sees your and data, writes Python with you.',
        link: { href: 'https://docs.trymito.io/mito-ai/agent', label: 'Learn more about Mito AI →' },
        videoSrc: '/bitcoin-candlestick-chart.mov',
        posterSrc: '/features/ai-chat.png',
        isHero: true,
    },
    {
        id: 'smart-debugging',
        title: 'Smart Debugging',
        description: 'One-click fix and explanation for any error.',
        videoSrc: '/smart-debug-1080-website.mp4',
        posterSrc: '/features/smart-debugging.png',
    },
    {
        id: 'chart-wizard',
        title: 'Chart Wizard',
        description: 'Point-and-click charts, exported as Python.',
        videoSrc: '/mitosheet-1080-website.mp4',
        posterSrc: '/visualizations_vertical.png',
    },
    {
        id: 'spreadsheet-editor',
        title: 'Spreadsheet Editor',
        description: 'Formulas, pivots, and graphs — every edit becomes Python.',
        link: { href: 'https://docs.trymito.io/how-to/importing-data-to-mito', label: 'View 100+ transformations →' },
        videoSrc: '/mitosheet-1080-website.mp4',
        posterSrc: '/features/spreadsheet-editor.png',
    },
    {
        id: 'mito-desktop',
        title: 'Mito Desktop App',
        description: 'Standalone desktop app. No Jupyter required.',
        videoSrc: '/mitosheet-1080-website.mp4',
        posterSrc: '/Mito_in_jupyter.png',
    },
    {
        id: 'app-mode',
        title: 'App Mode',
        description: 'Deploy as a Streamlit app. Share dashboards in one click.',
        videoSrc: '/data-app/data-verification-app.mp4',
        posterSrc: '/data-app/script-to-app.png',
    },
];

function FeatureCard({ feature }: { feature: FeatureCardData }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isInView, setIsInView] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const isChartWizard = feature.id === 'chart-wizard';
    const isSmartDebugging = feature.id === 'smart-debugging';

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setIsInView(true);
            },
            { rootMargin: '100px', threshold: 0 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const handlePlay = useCallback(() => {
        if (isChartWizard || isSmartDebugging) {
            setIsHovered(true);
            return;
        }
        if (videoRef.current && feature.videoSrc) {
            if (feature.isHero) {
                videoRef.current.playbackRate = 2;
            }
            videoRef.current.play().catch(() => {});
        }
    }, [feature.videoSrc, feature.isHero, isChartWizard, isSmartDebugging]);

    const handlePause = useCallback(() => {
        if (isChartWizard || isSmartDebugging) {
            setIsHovered(false);
            return;
        }
        if (videoRef.current) {
            videoRef.current.pause();
        }
    }, [isChartWizard, isSmartDebugging]);

    const cardClassName = classNames(
        featureSquaresStyles.feature_card,
        { [featureSquaresStyles.feature_card_hero]: feature.isHero },
        { [featureSquaresStyles.feature_card_chart_wizard]: isChartWizard },
        { [featureSquaresStyles.feature_card_smart_debugging]: isSmartDebugging }
    );

    return (
        <div
            ref={containerRef}
            className={cardClassName}
            onMouseEnter={handlePlay}
            onMouseLeave={handlePause}
        >
            <div className={featureSquaresStyles.feature_card_header}>
                <div className={featureSquaresStyles.feature_card_text_container}>
                    <h2>{feature.title}</h2>
                    <p>{feature.description}</p>
                </div>
            </div>
            {feature.link && (
                <a
                    href={feature.link.href}
                    target="_blank"
                    rel="noreferrer"
                    className={pageStyles.link}
                >
                    {feature.link.label}
                </a>
            )}
            <div className={featureSquaresStyles.feature_card_image_container}>
                {isSmartDebugging ? (
                    <SmartDebuggingPreview isHovered={isHovered} />
                ) : isChartWizard ? (
                    <ChartWizardPreview isHovered={isHovered} />
                ) : feature.videoSrc ? (
                    <>
                        {!isInView && feature.posterSrc ? (
                            <img src={feature.posterSrc} alt="" />
                        ) : (
                            <video
                                ref={videoRef}
                                src={isInView ? feature.videoSrc : undefined}
                                poster={feature.posterSrc}
                                loop
                                muted
                                playsInline
                                preload={isInView ? 'metadata' : 'none'}
                                onClick={handlePlay}
                                onTouchEnd={(e) => {
                                    e.preventDefault();
                                    handlePlay();
                                }}
                                onLoadedMetadata={(e) => {
                                    if (feature.isHero) {
                                        e.currentTarget.playbackRate = 2;
                                    }
                                }}
                            />
                        )}
                    </>
                ) : (
                    feature.posterSrc && (
                        <img src={feature.posterSrc} alt="" />
                    )
                )}
            </div>
        </div>
    );
}

const FeatureSquares = (): JSX.Element => {
    return (
        <div className={featureSquaresStyles.feature_squares_wrapper}>
            <h2 className={featureSquaresStyles.feature_squares_heading}>
                Everything you need to go from data to production
            </h2>
            <div className={featureSquaresStyles.feature_squares_container}>
                {FEATURES.map((feature) => (
                    <FeatureCard key={feature.id} feature={feature} />
                ))}
            </div>
        </div>
    );
};

export default FeatureSquares;
