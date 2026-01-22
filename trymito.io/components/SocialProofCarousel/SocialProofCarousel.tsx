/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Marquee from '../Marquee/Marquee';
import styles from './SocialProofCarousel.module.css';

// Company logos - only including logos that currently exist
// TODO: Add Apple, Qualcomm, IBM, Apollo, Manpower, Wells Fargo when logo files are available
const COMPANY_LOGOS = [
  { src: '/customers/accenture.png', alt: 'Accenture' },
  { src: '/customers/amazon.png', alt: 'Amazon' },
  { src: '/customers/cisco.png', alt: 'Cisco' },
  { src: '/customers/deloitte.png', alt: 'Deloitte' },
  { src: '/customers/ericsson.png', alt: 'Ericsson' },
  { src: '/customers/kpmg.png', alt: 'KPMG' },
  { src: '/customers/pwc.png', alt: 'PWC' },
  { src: '/customers/wayfair.png', alt: 'Wayfair' },
  { src: '/customers/sap.png', alt: 'SAP' },
  { src: '/customers/cytiva.png', alt: 'Cytiva' },
];

const SocialProofCarousel = (): JSX.Element => {
  return (
    <div className={styles.container}>
      <p className={styles.tagline}>Trusted Fortune 500 companies</p>
      <div className={styles.carouselWrapper}>
        <Marquee direction="left" speed={30}>
          {COMPANY_LOGOS.map((logo, index) => (
            <div key={`${logo.alt}-${index}`} className={styles.logoContainer}>
              <Image
                src={logo.src}
                alt={logo.alt}
                width={100}
                height={50}
                className={styles.logo}
                unoptimized
              />
            </div>
          ))}
        </Marquee>
      </div>
    </div>
  );
};

export default SocialProofCarousel;
