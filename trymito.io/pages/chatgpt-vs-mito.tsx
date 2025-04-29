/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import Footer from '../components/Footer/Footer';
import Header from '../components/Header/Header';
import pageStyles from '../styles/Page.module.css'
import titleStyles from '../styles/Title.module.css'
import ContactCTACard from '../components/CTACards/ContactCTACard';
import { useRef, useEffect, useState } from 'react';

interface VideoSection {
    header: string;
    description: string;
    videos: {
        src: string;
        ref: React.RefObject<HTMLVideoElement>;
    }[];
}

interface VideoProgress {
    currentTime: number;
    duration: number;
}

const Teams: NextPage = () => {
    // Create refs for all videos
    const videoRefs = [
        useRef<HTMLVideoElement>(null),
        useRef<HTMLVideoElement>(null),
        useRef<HTMLVideoElement>(null),
        useRef<HTMLVideoElement>(null),
        useRef<HTMLVideoElement>(null),
        useRef<HTMLVideoElement>(null)
    ];
    const sectionRefs = [
        useRef<HTMLDivElement>(null),
        useRef<HTMLDivElement>(null),
        useRef<HTMLDivElement>(null)
    ];
    const [videoProgress, setVideoProgress] = useState<VideoProgress[]>(Array(6).fill({ currentTime: 0, duration: 0 }));
    const [completedVideos, setCompletedVideos] = useState<boolean[]>(Array(6).fill(false));

    const sections: VideoSection[] = [
        {
            header: "<span style='color: var(--color-purple)'>3.2× Faster EDA</span> (Without Manual Fixes)",
            description: "Code from ChatGPT pointed to the wrong file path, forcing extra manual fixes before the analysis could even start. Mito was able to write code to help it learn the correct path.",
            videos: [
                { src: "https://rnca6p7lwtzvybss.public.blob.vercel-storage.com/chatgpt-vs-mito/eda-mito-timed-kycK8H5PQdMdQQNVypV0vxjvG8oJlV.mp4", ref: videoRefs[0] },
                { src: "https://rnca6p7lwtzvybss.public.blob.vercel-storage.com/chatgpt-vs-mito/eda-chat-timed-jnubwzAT88oWEA0EbYSgE76tQWEMQy.mp4", ref: videoRefs[1] }
            ]
        },
        {
            header: "Data Transformation — <span style='color: var(--color-purple)'>From 13 Clicks to 1</span>",
            description: "With ChatGPT, it took 13 clicks of copy-pasting and back-and-forth — and two code errors that had to be debugged manually. Mito worked the first time.",
            videos: [
                { src: "https://rnca6p7lwtzvybss.public.blob.vercel-storage.com/chatgpt-vs-mito/joins-mito-timed-18L3d7ubqycxlGemjCOtgjGjWNOnUT.mp4", ref: videoRefs[2] },
                { src: "https://rnca6p7lwtzvybss.public.blob.vercel-storage.com/chatgpt-vs-mito/joins-chat-timed-NIBagFnEOjL19xC3JVlSOSVh7Csnhl.mp4", ref: videoRefs[3] }
            ]
        },
        {
            header: "<span style='color: var(--color-purple)'>4.5× faster ML</span> — because Mito gets your data",
            description: "ChatGPT needed extra prompting just to understand the column types. Mito works inside your notebook. It already sees the data — so you don't have to explain it.",
            videos: [
                { src: "https://rnca6p7lwtzvybss.public.blob.vercel-storage.com/chatgpt-vs-mito/ml-mito-timed-oDDXPKHEjEBre3qHieaLma2sqYEGAk.mp4", ref: videoRefs[4] },
                { src: "https://rnca6p7lwtzvybss.public.blob.vercel-storage.com/chatgpt-vs-mito/ml-chat-timed-t03BApeZs44lijGwtbeCPBHptR8wYx.mp4", ref: videoRefs[5] }
            ]
        }
    ];

    useEffect(() => {
        const updateProgress = (index: number) => {
            if (videoRefs[index].current) {
                setVideoProgress(prev => {
                    const newProgress = [...prev];
                    newProgress[index] = {
                        currentTime: videoRefs[index].current?.currentTime || 0,
                        duration: videoRefs[index].current?.duration || 0
                    };
                    return newProgress;
                });
            }
        };

        // Add timeupdate event listeners to all videos
        videoRefs.forEach((ref, index) => {
            if (ref.current) {
                ref.current.addEventListener('timeupdate', () => updateProgress(index));
            }
        });

        return () => {
            // Cleanup event listeners
            videoRefs.forEach((ref, index) => {
                if (ref.current) {
                    ref.current.removeEventListener('timeupdate', () => updateProgress(index));
                }
            });
        };
    }, [videoRefs]);

    useEffect(() => {
        const observers = sectionRefs.map((ref, index) => {
            return new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            // Play both videos in the section only if they haven't completed
                            sections[index].videos.forEach((video, videoIndex) => {
                                const globalIndex = index * 2 + videoIndex;
                                if (video.ref.current && !completedVideos[globalIndex]) {
                                    video.ref.current.playbackRate = 2.5;
                                    video.ref.current.play();
                                }
                            });
                        }
                    });
                },
                { threshold: 0.5 }
            );
        });

        // Observe each section
        sectionRefs.forEach((ref, index) => {
            if (ref.current) {
                observers[index].observe(ref.current);
            }
        });

        return () => {
            // Cleanup observers
            sectionRefs.forEach((ref, index) => {
                if (ref.current) {
                    observers[index].unobserve(ref.current);
                }
            });
        };
    }, [completedVideos, sectionRefs, sections]);

    return (
        <>
            <Head>
                <title>Mito for Teams | Teams </title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="description" content="Mito empowers teams to easily upskill from Excel to Python, with automation, code-gen and AI-assist features, all in a familiar spreadsheet GUI." />
            </Head>

            <Header />

            <div className={pageStyles.container}>
                <main className={pageStyles.main}>
                    <section className={titleStyles.title_card + ' ' + titleStyles.grid_card}>
                        <h1 className={titleStyles.title}>
                            Write code faster, with fewer mistakes
                        </h1>
                        <p className={titleStyles.description}>
                            No more copy-pasting code from ChatGPT that doesn&apos;t quite work. Mito lives inside Jupyter, helping you generate correct Python code based on your notebook, your data, and your goals.
                        </p>
                    </section>

                    {sections.map((section, index) => (
                        <section key={index}>
                            <div className={pageStyles.subsection + ' ' + pageStyles.subsection_column + ' center'}>
                                <h2 dangerouslySetInnerHTML={{ __html: section.header }}></h2>
                                <p className='only-on-desktop-inline-block'>{section.description}</p>
                            </div>
                            <div className={pageStyles.subsection + ' flex-row-desktop-only'}>
                                <div ref={sectionRefs[index]}>
                                    <div style={{
                                        backgroundColor: 'rgba(157, 108, 255, 0.4)',
                                        padding: '2px 8px',
                                        width: 'fit-content',
                                    }}>
                                        <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-purple)' }}>Mito</p>
                                    </div>
                                    <video
                                        ref={section.videos[0].ref}
                                        width="100%"
                                        height="auto"
                                        muted
                                        preload="auto"
                                        src={section.videos[0].src}
                                        style={{ maxWidth: '100%', height: 'auto', border: '3px solid rgba(157, 108, 255, 0.4)' }}
                                        onEnded={() => {
                                            const globalIndex = index * 2;
                                            setCompletedVideos(prev => {
                                                const newCompleted = [...prev];
                                                newCompleted[globalIndex] = true;
                                                return newCompleted;
                                            });
                                            if (section.videos[0].ref.current) {
                                                section.videos[0].ref.current.pause();
                                            }
                                        }}
                                    ></video>
                                    <div style={{
                                        width: '100%',
                                        height: '4px',
                                        backgroundColor: 'rgba(157, 108, 255, 0.2)',
                                        marginTop: '4px'
                                    }}>
                                        <div style={{
                                            width: `${(videoProgress[index * 2].currentTime / videoProgress[index * 2].duration) * 100}%`,
                                            height: '100%',
                                            backgroundColor: 'var(--color-purple)',
                                            transition: 'width 0.1s linear'
                                        }}></div>
                                    </div>
                                </div>
                                <div className='margin-top-3rem-mobile-only'>
                                    <div style={{
                                        backgroundColor: 'rgba(157, 108, 255, 0.4)',
                                        padding: '2px 8px',
                                        width: 'fit-content',
                                    }}>
                                        <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-purple)' }}>ChatGPT</p>
                                    </div>
                                    <video
                                        ref={section.videos[1].ref}
                                        width="100%"
                                        height="auto"
                                        muted
                                        preload="auto"
                                        src={section.videos[1].src}
                                        style={{ maxWidth: '100%', height: 'auto', border: '3px solid rgba(157, 108, 255, 0.4)' }}
                                        onEnded={() => {
                                            const globalIndex = index * 2 + 1;
                                            setCompletedVideos(prev => {
                                                const newCompleted = [...prev];
                                                newCompleted[globalIndex] = true;
                                                return newCompleted;
                                            });
                                            if (section.videos[1].ref.current) {
                                                section.videos[1].ref.current.pause();
                                            }
                                        }}
                                    ></video>
                                    <div style={{
                                        width: '100%',
                                        height: '4px',
                                        backgroundColor: 'rgba(157, 108, 255, 0.2)',
                                        marginTop: '4px'
                                    }}>
                                        <div style={{
                                            width: `${(videoProgress[index * 2 + 1].currentTime / videoProgress[index * 2 + 1].duration) * 100}%`,
                                            height: '100%',
                                            backgroundColor: 'var(--color-purple)',
                                            transition: 'width 0.1s linear'
                                        }}></div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    ))}

                    <section className={pageStyles.background_card}>
                        <ContactCTACard />
                    </section>
                </main>
                <Footer />
            </div>
        </>
    );
};

export default Teams;