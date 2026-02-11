/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import madeWithMitoStyles from './MadeWithMito.module.css';
import { classNames } from '../../utils/classNames';

interface MadeWithMitoProps {
    title?: string;
    subtitle?: string;
}

const MadeWithMito = ({ title, subtitle }: MadeWithMitoProps = {}): JSX.Element => {
    const [selectedVideo, setSelectedVideo] = useState<number>(0);

    const videos = [
        'https://rnca6p7lwtzvybss.public.blob.vercel-storage.com/made-with-mito/analysis.mp4',
        'https://rnca6p7lwtzvybss.public.blob.vercel-storage.com/made-with-mito/sales-dashboard-FULL.mp4',
        'https://rnca6p7lwtzvybss.public.blob.vercel-storage.com/made-with-mito/excel-2.mp4',
        'https://rnca6p7lwtzvybss.public.blob.vercel-storage.com/made-with-mito/email-2.mp4',
        'https://rnca6p7lwtzvybss.public.blob.vercel-storage.com/made-with-mito/database-talk.mp4',
    ];

    const buttonLabels = [
        'Data Analysis',
        'Dashboard',
        'Excel Reporting',
        'Email Automation',
        'Database Q&A',
    ];

    return (
        <div className={madeWithMitoStyles.container}>
            <h2>{title || 'Made with Mito'}</h2>
            {subtitle && (
                <p>{subtitle}</p>
            )}
            <div className={madeWithMitoStyles.buttons_container}>
                {buttonLabels.map((label, index) => (
                    <button
                        key={index}
                        className={classNames(
                            madeWithMitoStyles.video_button,
                            { [madeWithMitoStyles.video_button_deselected]: selectedVideo !== index }
                        )}
                        onClick={() => setSelectedVideo(index)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className={madeWithMitoStyles.video_container}>
                <div className={madeWithMitoStyles.video_wrapper}>
                    <video
                        className={madeWithMitoStyles.video}
                        autoPlay
                        muted
                        loop
                        playsInline
                        key={selectedVideo}
                    >
                        <source src={videos[selectedVideo]} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </div>
            </div>
        </div>
    )
}

export default MadeWithMito; 