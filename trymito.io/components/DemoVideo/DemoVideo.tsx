/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import demoVideoStyles from './DemoVideo.module.css';

const DEMO_VIDEO_URL = 'https://rnca6p7lwtzvybss.public.blob.vercel-storage.com/demo-videos/Demo%20Video%20-%20Nov%202025_FINAL.mp4';

/** Still image shown until the user clicks play. Served from public folder. */
const DEMO_VIDEO_POSTER_URL = '/bitcoin-bands.png';

const renderVideoModal = (
  onClose: () => void,
  onBackdropClick: (e: React.MouseEvent<HTMLDivElement>) => void
): JSX.Element => {
  return (
    <div 
      className={demoVideoStyles.modalOverlay}
      onClick={onBackdropClick}
    >
      <div className={demoVideoStyles.modalContent}>
        <button 
          className={demoVideoStyles.closeButton}
          onClick={onClose}
          aria-label="Close video"
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M18 6L6 18M6 6L18 18" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
          </svg>
        </button>
        <video 
          className={demoVideoStyles.modalVideo}
          controls
          autoPlay
        >
          <source 
            src={DEMO_VIDEO_URL} 
            type="video/mp4" 
          />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  );
};

const DemoVideo = (): JSX.Element => {
  const [showVideo, setShowVideo] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGifClick = () => {
    setShowVideo(true);
  };

  const handleCloseModal = () => {
    setShowVideo(false);
  };

  const handleModalBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showVideo) {
        handleCloseModal();
      }
    };

    if (showVideo) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showVideo]);

  return (
    <>
      <div className={demoVideoStyles.container}>
        <div 
          className={demoVideoStyles.gifContainer}
          onClick={handleGifClick}
        >
          <img
            src={DEMO_VIDEO_POSTER_URL}
            alt="Demo video preview"
            className={demoVideoStyles.posterImage}
          />
          <button className={demoVideoStyles.playButton} aria-label="Play video" type="button">
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
                fill="var(--color-purple)"
              />
            </svg>
          </button>
        </div>
      </div>

      {mounted && showVideo && createPortal(
        renderVideoModal(handleCloseModal, handleModalBackdropClick),
        document.body
      )}
    </>
  );
};

export default DemoVideo;

