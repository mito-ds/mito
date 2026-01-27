/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { classNames } from '../../utils/classNames';
import featureSquaresStyles from './FeatureSquares.module.css';

type FeatureAccent = 'brand' | 'teal' | 'amber' | 'blue';

interface FeatureCardData {
    title: string;
    description: string;
    videoSrc: string;
    poster?: string;
    isHero?: boolean;
    accent: FeatureAccent;
}

const FeatureCard = (props: FeatureCardData & { isTouchDevice: boolean }): JSX.Element => {
    const { title, description, videoSrc, poster, isHero, accent, isTouchDevice } = props;
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [isActive, setIsActive] = useState(false);

    const playVideo = () => {
        if (!videoRef.current) {
            return;
        }
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                setIsActive(false);
            });
        }
        setIsActive(true);
    };

    const pauseVideo = () => {
        if (!videoRef.current) {
            return;
        }
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        setIsActive(false);
    };

    const handleMouseEnter = () => {
        if (!isTouchDevice) {
            playVideo();
        }
    };

    const handleMouseLeave = () => {
        if (!isTouchDevice) {
            pauseVideo();
        }
    };

    const handleClick = () => {
        if (!videoRef.current) {
            return;
        }
        if (videoRef.current.paused) {
            playVideo();
        } else {
            pauseVideo();
        }
    };

    return (
        <div
            className={classNames(
                featureSquaresStyles.feature_card,
                featureSquaresStyles[`accent_${accent}`],
                { [featureSquaresStyles.feature_card_hero]: isHero },
                { [featureSquaresStyles.feature_card_active]: isActive }
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
        >
            <div className={featureSquaresStyles.feature_card_text}>
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
            <div className={featureSquaresStyles.feature_card_media}>
                <video
                    ref={videoRef}
                    src={videoSrc}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster={poster}
                />
            </div>
        </div>
    );
};

const FeatureSquares = (): JSX.Element => {
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        const isTouch = window.matchMedia('(hover: none)').matches || navigator.maxTouchPoints > 0;
        setIsTouchDevice(isTouch);
    }, []);

    const features = useMemo<FeatureCardData[]>(
        () => [
            {
                title: 'AI Chat',
                description:
                    'Chat is like collaborating with a colleague who sees your code, knows your data, and is a Python expert.',
                videoSrc: '/chat-1080-website.mp4',
                poster: '/short-demo.gif',
                isHero: true,
                accent: 'brand',
            },
            {
                title: 'Smart Debugging',
                description: 'Fix your code with the click of a button and let the AI explain your error.',
                videoSrc: '/smart-debug-1080-website.mp4',
                poster: '/short-demo.gif',
                accent: 'teal',
            },
            {
                title: 'Chart Wizard',
                description: 'Create presentation-ready charts and graphs with a few clicks.',
                videoSrc: '/demo.mp4',
                poster: '/short-demo.gif',
                accent: 'amber',
            },
            {
                title: 'Spreadsheet Editor',
                description:
                    'Write formulas like VLOOKUP, build pivot tables, and create graphs. Every edit becomes Python.',
                videoSrc: '/mitosheet-1080-website.mp4',
                poster: '/short-demo.gif',
                accent: 'blue',
            },
            {
                title: 'Mito Desktop',
                description:
                    'The easiest way to get started - no setup required. Download and start analyzing data instantly.',
                videoSrc: '/ai_preview.mp4',
                poster: '/short-demo.gif',
                accent: 'brand',
            },
            {
                title: 'App Mode',
                description:
                    'Turn any notebook into an interactive app. Share your analysis with non-technical teammates.',
                videoSrc: '/data-app/data-verification-app.mp4',
                poster: '/short-demo.gif',
                accent: 'teal',
            },
        ],
        []
    );

    return (
        <div className={featureSquaresStyles.feature_squares_container}>
            <div className={featureSquaresStyles.bento_grid}>
                {features.map((feature) => (
                    <FeatureCard key={feature.title} {...feature} isTouchDevice={isTouchDevice} />
                ))}
            </div>
        </div>
    );
};

export default FeatureSquares;