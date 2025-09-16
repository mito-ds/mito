/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import TextButton from '../components/Buttons/TextButton/TextButton';
import pageStyles from '../styles/Page.module.css';
import downloadsStyles from '../styles/Downloads.module.css';
import { classNames } from '../utils/classNames';

const Downloads: NextPage = () => {
  return (
    <>
      <Head>
        <title>Download Mito Desktop | Mito</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Download Mito Desktop for Mac, Windows, and Linux. Get the latest version of Mito's desktop application." />
      </Head>
      <Header/>
    
      <div className={pageStyles.container}>
        <main className={classNames(pageStyles.main, downloadsStyles.main_small)}>
          {/* Page Header */}
          <section className={downloadsStyles.page_header}>
            <h1 className={downloadsStyles.page_title}>
              Download Mito Desktop
            </h1>
            <p className={downloadsStyles.page_description}>
              The fastest way to analyze data with Python. No coding required.
            </p>
          </section>

          {/* All Versions Section */}
          <section className={downloadsStyles.all_versions_section}>
            <div className={downloadsStyles.versions_header}>
              <div className={downloadsStyles.version_info_container}>
                <span className={downloadsStyles.version_number}>Mito Desktop v1.0</span>
                <span className={downloadsStyles.latest_badge}>LATEST VERSION</span>
              </div>
            </div>

            <div className={downloadsStyles.download_cards_container}>
              {/* macOS Card */}
              <div className={downloadsStyles.download_card}>
                <div className={downloadsStyles.card_header}>
                  <Image src="/downloads/apple-icon.svg" alt="Apple" width={24} height={24} className={downloadsStyles.platform_icon} />
                  <span className={downloadsStyles.platform_name}>macOS</span>
                </div>
                <div className={downloadsStyles.download_options}>
                  <a href="#" className={downloadsStyles.download_option}>
                    <span>Mac (x64)</span>
                    <Image src="/downloads/download-arrow.svg" alt="Download" width={16} height={16} className={downloadsStyles.download_arrow} />
                  </a>
                  <a href="#" className={downloadsStyles.download_option}>
                    <span>Mac (ARM64)</span>
                    <Image src="/downloads/download-arrow.svg" alt="Download" width={16} height={16} className={downloadsStyles.download_arrow} />
                  </a>
                </div>
              </div>

              {/* Windows Card */}
              <div className={downloadsStyles.download_card}>
                <div className={downloadsStyles.card_header}>
                  <Image src="/downloads/windows-icon.svg" alt="Windows" width={24} height={24} className={downloadsStyles.platform_icon} />
                  <span className={downloadsStyles.platform_name}>Windows</span>
                </div>
                <div className={downloadsStyles.download_options}>
                  <a href="#" className={downloadsStyles.download_option}>
                    <span>Windows (x64)</span>
                    <Image src="/downloads/download-arrow.svg" alt="Download" width={16} height={16} className={downloadsStyles.download_arrow} />
                  </a>
                </div>
              </div>

              {/* Linux Card */}
              <div className={downloadsStyles.download_card}>
                <div className={downloadsStyles.card_header}>
                  <Image src="/downloads/linux-icon.svg" alt="Linux" width={24} height={24} className={downloadsStyles.platform_icon} />
                  <span className={downloadsStyles.platform_name}>Linux</span>
                </div>
                <div className={downloadsStyles.download_options}>
                  <a href="#" className={downloadsStyles.download_option}>
                    <span>Fedora (.rpm)</span>
                    <Image src="/downloads/download-arrow.svg" alt="Download" width={16} height={16} className={downloadsStyles.download_arrow} />
                  </a>
                  <a href="#" className={downloadsStyles.download_option}>
                    <span>Debian (.deb)</span>
                    <Image src="/downloads/download-arrow.svg" alt="Download" width={16} height={16} className={downloadsStyles.download_arrow} />
                  </a>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  )
}

export default Downloads
