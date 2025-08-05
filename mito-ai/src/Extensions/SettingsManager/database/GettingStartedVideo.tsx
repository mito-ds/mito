/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';

interface GettingStartedVideoProps {
    width?: string;
    height?: string;
    className?: string;
}

export const GettingStartedVideo: React.FC<GettingStartedVideoProps> = ({
    width = "100%",
    height = "400",
    className = ""
}) => {
    return (
        <div className={`video-container ${className}`}>
            <iframe
                width={width}
                height={height}
                src="https://www.youtube.com/embed/sJgphOrmZb4?rel=0"
                title="How to connect to your database with Mito"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            ></iframe>
        </div>
    );
};
