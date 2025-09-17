/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import pageStyles from '../styles/Page.module.css';
import downloadsStyles from '../styles/Downloads.module.css';
import { classNames } from '../utils/classNames';
import InstallInstructions from '../components/InstallInstructions/InstallInstructions';
import { PLAUSIBLE_MITO_DESKTOP_DOWNLOADER_LINUX, PLAUSIBLE_MITO_DESKTOP_DOWNLOADER_MACOS, PLAUSIBLE_MITO_DESKTOP_DOWNLOADER_WINDOWS } from '../utils/plausible';

// GitHub Releases download URLs
const DOWNLOAD_URLS = {
  macos_arm64: 'https://github.com/mito-ds/mito-desktop/releases/latest/download/Mito-Setup-macOS-arm64.dmg',
  macos_x64: 'https://github.com/mito-ds/mito-desktop/releases/latest/download/Mito-Setup-macOS-x64.dmg',
  windows_x64: 'https://github.com/mito-ds/mito-desktop/releases/latest/download/Mito-Setup-Windows-x64.exe',
  linux_rpm: 'https://github.com/mito-ds/mito-desktop/releases/latest/download/Mito-Setup-Fedora-x64.rpm',
  linux_deb: 'https://github.com/mito-ds/mito-desktop/releases/latest/download/Mito-Setup-Debian-x64.deb',
};

const Downloads: NextPage = () => {
    return (
        <>
            <Head>
                <title>Download Mito Desktop | Mito</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="description" content="Download Mito Desktop for Mac, Windows, and Linux. Get the latest version of Mito's desktop application." />
            </Head>
            <Header />

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
                                    <a href={DOWNLOAD_URLS.macos_arm64} className={downloadsStyles.download_option} download>
                                        <div className={downloadsStyles.download_option_content}>
                                            <span>Mac <span className={downloadsStyles.architecture_text}>(arm64)</span></span>
                                            <span className={downloadsStyles.chip_badge}>M series chips</span>
                                        </div>
                                        <Image src="/downloads/download-arrow.svg" alt="Download" width={16} height={16} className={downloadsStyles.download_arrow} />
                                    </a>
                                    <a href={DOWNLOAD_URLS.macos_x64} className={classNames(downloadsStyles.download_option, PLAUSIBLE_MITO_DESKTOP_DOWNLOADER_MACOS)} download>
                                        <div className={downloadsStyles.download_option_content}>
                                            <span>Mac <span className={downloadsStyles.architecture_text}>(x64)</span></span>
                                            <span className={downloadsStyles.chip_badge}>Intel chips</span>
                                        </div>
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
                                    <a href={DOWNLOAD_URLS.windows_x64} className={classNames(downloadsStyles.download_option, PLAUSIBLE_MITO_DESKTOP_DOWNLOADER_WINDOWS)} download>
                                        <div className={downloadsStyles.download_option_content}>
                                            <span>Windows <span className={downloadsStyles.architecture_text}>(x64)</span></span>
                                            <span className={downloadsStyles.chip_badge}>Universal Windows</span>
                                        </div>
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
                                    <a href={DOWNLOAD_URLS.linux_rpm} className={classNames(downloadsStyles.download_option, PLAUSIBLE_MITO_DESKTOP_DOWNLOADER_LINUX)} download>
                                        <div className={downloadsStyles.download_option_content}>
                                            <span>Fedora <span className={downloadsStyles.architecture_text}>(.rpm)</span></span>
                                            <span className={downloadsStyles.chip_badge}>Red Hat family</span>
                                        </div>
                                        <Image src="/downloads/download-arrow.svg" alt="Download" width={16} height={16} className={downloadsStyles.download_arrow} />
                                    </a>
                                    <a href={DOWNLOAD_URLS.linux_deb} className={classNames(downloadsStyles.download_option, PLAUSIBLE_MITO_DESKTOP_DOWNLOADER_LINUX)} download>
                                        <div className={downloadsStyles.download_option_content}>
                                            <span>Debian <span className={downloadsStyles.architecture_text}>(.deb)</span></span>
                                            <span className={downloadsStyles.chip_badge}>Debian family</span>
                                        </div>
                                        <Image src="/downloads/download-arrow.svg" alt="Download" width={16} height={16} className={downloadsStyles.download_arrow} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </section>
                    <div className={downloadsStyles.install_instructions_container}>
                        <InstallInstructions />
                    </div>
                </main>
                <Footer />
            </div>
        </>
    )
}

export default Downloads
