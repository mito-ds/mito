/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import demoVideoStyles from './DemoVideo.module.css';

const DEMO_VIDEO_URL = 'https://rnca6p7lwtzvybss.public.blob.vercel-storage.com/made-with-mito/Demo%20Video%20-%20Nov%202025_FINAL.mp4';

const DemoVideo = (): JSX.Element => {
  return (
    <div className={demoVideoStyles.container}>
      <video 
        className={demoVideoStyles.video}
        controls
      >
        <source 
          src={DEMO_VIDEO_URL} 
          type="video/mp4" 
        />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default DemoVideo;

