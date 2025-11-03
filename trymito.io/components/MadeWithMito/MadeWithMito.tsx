/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import madeWithMitoStyles from './MadeWithMito.module.css';

const MadeWithMito = (): JSX.Element => {
    const [selectedVideo, setSelectedVideo] = useState<number>(0);

    // Placeholder video sources - replace with actual video paths
    const videos = [
        'https://rnca6p7lwtzvybss.public.blob.vercel-storage.com/made-with-mito/analysis.mp4',
        'https://rnca6p7lwtzvybss.public.blob.vercel-storage.com/made-with-mito/excel-report.mp4',
        'https://rnca6p7lwtzvybss.public.blob.vercel-storage.com/made-with-mito/email.mp4',
        'https://rnca6p7lwtzvybss.public.blob.vercel-storage.com/made-with-mito/database-talk.mp4',
        'https://rnca6p7lwtzvybss.public.blob.vercel-storage.com/made-with-mito/sales-dashboard-FULL.mp4',
    ];

    const buttonLabels = [
        'Data Analysis',
        'Excel Reporting',
        'Email Automation',
        'Database Q&A',
        'Internal Dashboard',
    ];

    return (
        <div className={madeWithMitoStyles.container}>
            <h2>
                Made with Mito
            </h2>
            
            <div className={madeWithMitoStyles.buttons_container}>
                {buttonLabels.map((label, index) => (
                    <button
                        key={index}
                        className={madeWithMitoStyles.video_button}
                        onClick={() => setSelectedVideo(index)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className={madeWithMitoStyles.video_container}>
                <video
                    className={madeWithMitoStyles.video}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                    key={selectedVideo}
                >
                    <source src={videos[selectedVideo]} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>
        </div>
    )
}

export default MadeWithMito; 