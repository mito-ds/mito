/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useRef, useCallback } from 'react';
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
    iconSrc: string;
    isHero?: boolean;
}

const FEATURES: FeatureCardData[] = [
    {
        id: 'ai-chat',
        title: 'AI Chat',
        description: 'Chat is like collaborating with a colleague who sees your code, knows your data, and is a Python expert. It\'s ChatGPT integrated directly into Jupyter.',
        link: { href: 'https://docs.trymito.io/mito-ai/agent', label: 'Learn more about Mito AI →' },
        videoSrc: '/chat-1080-website.mp4',
        posterSrc: '/features/ai-chat.png',
        iconSrc: '/icon-squares/ChatBubblesIcon.svg',
        isHero: true,
    },
    {
        id: 'smart-debugging',
        title: 'Smart Debugging',
        description: 'Fix your code with the click of a button and let the AI explain your error to you.',
        videoSrc: '/smart-debug-1080-website.mp4',
        posterSrc: '/features/smart-debugging.png',
        iconSrc: '/icon-squares/BugIcon.svg',
    },
    {
        id: 'chart-wizard',
        title: 'Chart Wizard',
        description: 'Create publication-ready charts from your data with a few clicks. Every chart is generated as Python code.',
        videoSrc: '/mitosheet-1080-website.mp4',
        posterSrc: '/visualizations_vertical.png',
        iconSrc: '/icon-squares/ChartWizardIcon.svg',
    },
    {
        id: 'spreadsheet-editor',
        title: 'Spreadsheet Editor',
        description: 'Write spreadsheet formulas like VLOOKUP, build pivot tables, and create graphs. Every edit is automatically converted to Python.',
        link: { href: 'https://docs.trymito.io/how-to/importing-data-to-mito', label: 'View 100+ transformations →' },
        videoSrc: '/mitosheet-1080-website.mp4',
        posterSrc: '/features/spreadsheet-editor.png',
        iconSrc: '/icon-squares/SpreadsheetIcon.svg',
    },
    {
        id: 'mito-desktop',
        title: 'Mito Desktop App',
        description: 'Run Mito as a standalone desktop application. No Jupyter required — perfect for analysts and teams.',
        videoSrc: '/mitosheet-1080-website.mp4',
        posterSrc: '/Mito_in_jupyter.png',
        iconSrc: '/icon-squares/ComputerIcon.svg',
    },
    {
        id: 'app-mode',
        title: 'App Mode',
        description: 'Turn your Mito spreadsheet into a deployable Streamlit app. Share dashboards and tools with one click.',
        videoSrc: '/data-app/data-verification-app.mp4',
        posterSrc: '/data-app/script-to-app.png',
        iconSrc: '/icon-squares/AppModeIcon.svg',
    },
];

function FeatureCard({ feature }: { feature: FeatureCardData }) {
    const videoRef = useRef<HTMLVideoElement>(null);

    const handlePlay = useCallback(() => {
        if (videoRef.current && feature.videoSrc) {
            videoRef.current.play().catch(() => {});
        }
    }, [feature.videoSrc]);

    const handlePause = useCallback(() => {
        if (videoRef.current) {
            videoRef.current.pause();
        }
    }, []);

    const cardClassName = classNames(
        featureSquaresStyles.feature_card,
        { [featureSquaresStyles.feature_card_hero]: feature.isHero }
    );

    return (
        <div
            className={cardClassName}
            onMouseEnter={handlePlay}
            onMouseLeave={handlePause}
        >
            <div className={featureSquaresStyles.feature_card_header}>
                <div className={featureSquaresStyles.feature_card_icon}>
                    <img src={feature.iconSrc} alt="" width={24} height={24} className={featureSquaresStyles.feature_card_icon_img} />
                </div>
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
                {feature.videoSrc ? (
                    <video
                        ref={videoRef}
                        src={feature.videoSrc}
                        poster={feature.posterSrc}
                        loop
                        muted
                        playsInline
                        preload="metadata"
                        onClick={handlePlay}
                        onTouchEnd={(e) => {
                            e.preventDefault();
                            handlePlay();
                        }}
                    />
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
