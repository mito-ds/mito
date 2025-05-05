/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import type { NextPage } from 'next'
import Head from 'next/head'
import Footer from '../components/Footer/Footer';
import Header from '../components/Header/Header';
import pageStyles from '../styles/Page.module.css'
import titleStyles from '../styles/Title.module.css'
import React, { useRef, useEffect, useState } from 'react';
import TextButton from '../components/Buttons/TextButton/TextButton';

const JUPYTERHUB_MITO_LINK = 'http://launch.trymito.io';

interface VideoSection {
    header: string;
    description: string;
    videos: {
        src: string;
        ref?: React.RefObject<HTMLVideoElement>;
    }[];
}

const sections: VideoSection[] = [
    {
        header: "<span style='color: var(--color-purple)'>3.2× Faster EDA</span> (without manual fixes)",
        description: "ChatGPT's code pointed to the wrong file path, forcing extra manual fixes before the analysis could even start. Mito first wrote code to find the right file path, and then used it. Mito's code worked on its first attempt.",
        videos: [
            { src: "https://rnca6p7lwtzvybss.public.blob.vercel-storage.com/chatgpt-vs-mito/eda-mito-timed-kycK8H5PQdMdQQNVypV0vxjvG8oJlV.mp4" },
            { src: "https://rnca6p7lwtzvybss.public.blob.vercel-storage.com/chatgpt-vs-mito/eda-chat-timed-jnubwzAT88oWEA0EbYSgE76tQWEMQy.mp4" }
        ]
    },
    {
        header: "Data Transformation — <span style='color: var(--color-purple)'>From 13 clicks to 1</span>",
        description: "Using ChatGPT took 13 clicks of copy-pasting code back-and-forth — not to mention two code errors that required manual debugging. Mito worked the first time. 0 clicks, 0 errors.",
        videos: [
            { src: "https://rnca6p7lwtzvybss.public.blob.vercel-storage.com/chatgpt-vs-mito/joins-mito-timed-18L3d7ubqycxlGemjCOtgjGjWNOnUT.mp4" },
            { src: "https://rnca6p7lwtzvybss.public.blob.vercel-storage.com/chatgpt-vs-mito/joins-chat-timed-NIBagFnEOjL19xC3JVlSOSVh7Csnhl.mp4" }
        ]
    },
    {
        header: "<span style='color: var(--color-purple)'>4.5× faster ML</span> — because Mito gets your data",
        description: "ChatGPT needs extra prompting just to understand the data it's working with. Because Mito lives inside your notebook, it already knows about your data. Let your data explain itself.",
        videos: [
            { src: "https://rnca6p7lwtzvybss.public.blob.vercel-storage.com/chatgpt-vs-mito/ml-mito-timed-oDDXPKHEjEBre3qHieaLma2sqYEGAk.mp4" },
            { src: "https://rnca6p7lwtzvybss.public.blob.vercel-storage.com/chatgpt-vs-mito/ml-chat-timed-t03BApeZs44lijGwtbeCPBHptR8wYx.mp4" }
        ]
    }
];

interface VideoPlayerProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    src: string;
    label: string;
    isCompleted: boolean;
    onCompleted: () => void;
    playbackRate?: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
    videoRef,
    src,
    label,
    isCompleted,
    onCompleted,
    playbackRate = 4
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isSafari, setIsSafari] = useState(false);

    // Browser detection via useEffect to avoid SSR issues
    useEffect(() => {
        setIsSafari(/^((?!chrome|android).)*safari/i.test(navigator.userAgent));
    }, []);

    // Use lower playback rate for Safari. 
    // Safari can not handle the default playback rate (4x) so we use 2x instead.
    const effectivePlaybackRate = isSafari ? 2 : playbackRate;

    // Lazy load the video
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (videoRef.current) {
            observer.observe(videoRef.current);
        }

        return () => {
            if (videoRef.current) {
                observer.unobserve(videoRef.current);
            }
        };
    }, [videoRef]);

    // Set playback rate when video is loaded
    useEffect(() => {
        if (videoRef.current && isVisible) {
            videoRef.current.playbackRate = effectivePlaybackRate;
        }
    }, [videoRef, isVisible, effectivePlaybackRate]);

    return (
        <div style={{ position: 'relative' }}>
            <div style={{
                backgroundColor: 'rgba(157, 108, 255, 0.4)',
                padding: '2px 8px',
                width: 'fit-content',
            }}>
                <p style={{ margin: 0, fontSize: '14px', color: 'white' }}>{label}</p>
            </div>
            <div style={{ position: 'relative' }}>
                <video
                    ref={videoRef}
                    width="100%"
                    height="auto"
                    muted
                    playsInline
                    preload="metadata"
                    controlsList="nodownload"
                    disablePictureInPicture
                    src={isVisible ? src : undefined}
                    style={{
                        maxWidth: '100%',
                        height: 'auto',
                        border: '3px solid rgba(157, 108, 255, 0.4)',
                        objectFit: 'contain',
                        display: 'block'
                    }}
                    onEnded={onCompleted}
                ></video>
                {isCompleted && (
                    <>
                        <div style={{
                            position: 'absolute',
                            top: '3px',
                            left: '3px',
                            right: '3px',
                            bottom: '6px',
                            backgroundColor: 'rgba(0, 0, 0, 0.75)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: 'white',
                            fontSize: '1.2rem',
                            fontWeight: 'bold'
                        }}>
                            <div>Completed in {Math.round(videoRef.current?.duration || 0)}s</div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const ChatGPTvsMito: NextPage = () => {
    // Calculate total number of videos needed
    const totalVideos = sections.reduce((acc, section) => acc + section.videos.length, 0);
    const totalSections = sections.length;

    // Create refs at the top level without callbacks
    const videoRefs = useRef<React.RefObject<HTMLVideoElement>[]>([]);
    const sectionRefs = useRef<React.RefObject<HTMLDivElement>[]>([]);
    
    // Initialize refs if they haven't been created yet
    if (videoRefs.current.length === 0) {
        videoRefs.current = Array(totalVideos).fill(null).map(() => React.createRef<HTMLVideoElement>());
    }
    if (sectionRefs.current.length === 0) {
        sectionRefs.current = Array(totalSections).fill(null).map(() => React.createRef<HTMLDivElement>());
    }

    const [completedVideos, setCompletedVideos] = useState<boolean[]>(Array(totalVideos).fill(false));

    // Map the sections with their refs
    const sectionsWithRefs = sections.map((section, sectionIndex) => ({
        ...section,
        videos: section.videos.map((video, videoIndex) => ({
            ...video,
            ref: videoRefs.current[sectionIndex * 2 + videoIndex]
        }))
    }));

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const index = sectionRefs.current.findIndex(ref => ref.current === entry.target);
                    if (index !== -1) {
                        const mitoVideo = videoRefs.current[index * 2];
                        const chatVideo = videoRefs.current[index * 2 + 1];

                        if (entry.isIntersecting) {
                            if (mitoVideo?.current && !completedVideos[index * 2]) {
                                mitoVideo.current.play();
                            }
                            if (chatVideo?.current && !completedVideos[index * 2 + 1]) {
                                chatVideo.current.play();
                            }
                        } else {
                            if (mitoVideo?.current) mitoVideo.current.pause();
                            if (chatVideo?.current) chatVideo.current.pause();
                        }
                    }
                });
            },
            { threshold: 0.5 }
        );

        sectionRefs.current.forEach((ref) => {
            if (ref.current) {
                observer.observe(ref.current);
            }
        });

        return () => {
            sectionRefs.current.forEach((ref) => {
                if (ref.current) {
                    observer.unobserve(ref.current);
                }
            });
        };
    }, [completedVideos]);

    return (
        <>
            <Head>
                <title>ChatGPT vs Mito</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="description" content="No more copy-pasting code that doesn&apos;t quite work. Mito lives inside Jupyter, helping you generate code based on your notebook and data." />
            </Head>

            <Header />

            <div className={pageStyles.container}>
                <main className={pageStyles.main}>
                    <section className={titleStyles.title_card + ' ' + titleStyles.grid_card}>
                        <h1 className={titleStyles.title}>
                            Code faster, with fewer mistakes
                        </h1>
                        <p className={titleStyles.description}>
                            No more copy-pasting code that doesn&apos;t quite work. Mito lives inside Jupyter, helping you generate code based on your notebook, your data, and your goals.
                        </p>
                    </section>

                    {sectionsWithRefs.map((section, index) => (
                        <section key={index} style={{ marginBottom: '0px' }}>
                            <div className={titleStyles.description + ' ' + pageStyles.subsection_column + ' center'} style={{ marginBottom: '50px' }}>
                                <h2 dangerouslySetInnerHTML={{ __html: section.header }}></h2>
                                <p className={titleStyles.description} style={{ color: 'var(--color-text-secondary)' }}>{section.description}</p>
                            </div>
                            <div className={pageStyles.subsection + ' flex-row-desktop-only'}>
                                <div ref={sectionRefs.current[index]}>
                                    <VideoPlayer
                                        videoRef={section.videos[0].ref}
                                        src={section.videos[0].src}
                                        label="Mito"
                                        isCompleted={completedVideos[index * 2]}
                                        onCompleted={() => {
                                            const globalIndex = index * 2;
                                            setCompletedVideos(prev => {
                                                const newCompleted = [...prev];
                                                newCompleted[globalIndex] = true;
                                                return newCompleted;
                                            });
                                        }}
                                    />
                                </div>
                                <div className='margin-top-3rem-mobile-only'>
                                    <VideoPlayer
                                        videoRef={section.videos[1].ref}
                                        src={section.videos[1].src}
                                        label="ChatGPT"
                                        isCompleted={completedVideos[index * 2 + 1]}
                                        onCompleted={() => {
                                            const globalIndex = index * 2 + 1;
                                            setCompletedVideos(prev => {
                                                const newCompleted = [...prev];
                                                newCompleted[globalIndex] = true;
                                                return newCompleted;
                                            });
                                        }}
                                    />
                                </div>
                            </div>
                        </section>
                    ))}

                    <section className={pageStyles.background_card} style={{ marginTop: '50px' }}>
                        <h2 className={titleStyles.title} style={{ marginBottom: '50px' }}>
                            See Mito in Action — Try the Demo
                        </h2>
                        <TextButton text='Try online' href={JUPYTERHUB_MITO_LINK} variant="highlight" />
                    </section>
                </main>
                <Footer />
            </div>
        </>
    );
};

export default ChatGPTvsMito;