/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import demoVideoStyles from './DemoVideo.module.css';

const DEMO_GIF_URL = 'https://rnca6p7lwtzvybss.public.blob.vercel-storage.com/demo-videos/Demo%20Video%20-%20Nov%202025_FINAL.gif';
const DEMO_VIDEO_URL = 'https://rnca6p7lwtzvybss.public.blob.vercel-storage.com/demo-videos/Demo%20Video%20-%20Nov%202025_FINAL.mp4';

const DemoVideo = (): JSX.Element => {
  const [showVideo, setShowVideo] = useState(false);

  const handleGifClick = () => {
    setShowVideo(true);
  };

  return (
    <div className={demoVideoStyles.container}>
      {showVideo ? (
        <video 
          className={demoVideoStyles.video}
          controls
          autoPlay
        >
          <source 
            src={DEMO_VIDEO_URL} 
            type="video/mp4" 
          />
          Your browser does not support the video tag.
        </video>
      ) : (
        <div 
          className={demoVideoStyles.gifContainer}
          onClick={handleGifClick}
        >
          <img 
            src={DEMO_GIF_URL}
            alt="Demo Video Preview"
            className={demoVideoStyles.gif}
          />
          <div className={demoVideoStyles.overlay} />
          <button className={demoVideoStyles.playButton} aria-label="Play video">
            <svg 
              width="80" 
              height="80" 
              viewBox="0 0 80 80" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="40" cy="40" r="40" fill="white" fillOpacity="0.9" />
              <path 
                d="M32 24L32 56L56 40L32 24Z" 
                fill="var(--color-purple, #9D6CFF)"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default DemoVideo;

