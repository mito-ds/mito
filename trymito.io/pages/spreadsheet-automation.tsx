import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '../components/Footer/Footer';
import Header from '../components/Header/Header';
import pageStyles from '../styles/Page.module.css';
import securityStyles from '../styles/Security.module.css';
import titleStyles from '../styles/Title.module.css';
import spreadsheetAutomationStyles from '../styles/SpreadsheetAutomation.module.css';

// Import Icons & Background Grid
import DownloadCTACard from '../components/CTACards/DownloadCTACard';
import { MITO_GITHUB_LINK } from '../components/GithubButton/GithubButton';
import CCPAIcon from '../public/icon-squares/CCPAIcon.svg';
import ComputerIcon from '../public/icon-squares/ComputerIcon.svg';
import OpenSourceIcon from '../public/icon-squares/OpenSourceIcon.svg';
import SecurityIcon from '../public/icon-squares/SecurityIcon.svg';
import TelemetryIcon from '../public/icon-squares/TelemetryIcon.svg';
import UpgradesIcon from '../public/icon-squares/UpgradesIcon.svg';
import { classNames } from '../utils/classNames';
import CTAButtons from '../components/CTAButtons/CTAButtons';

const SpreadhseetAutomation: NextPage = () => {

  return (
    <>
      <Head>
        <title>No-Code Spreadsheet Automation Software for Python | Mito</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Mito is a notebook-native Python library that enables simple, no-code spreadsheet automation with Pandas code generation and AI tools built in." />
      </Head>
      <Header/>
    
      <div className={pageStyles.container}>

        <main className={pageStyles.main}>
          <section className={classNames(titleStyles.title_card, spreadsheetAutomationStyles.flex_col_mobile_row_desktop)}>
            <div className={spreadsheetAutomationStyles.title_text_container}>
              <h1>
                No-Code Spreadsheet Automation 
              </h1>
              <CTAButtons variant={'download'} align='left'/>
            </div>
            <div className={classNames(spreadsheetAutomationStyles.image_display_block, 'margin-top-8rem-mobile-only')}>
              <Image src={'/presentationReadyGraphs.png'} alt='Explore your data with Mito' width={500} height={250}/>
            </div>
          </section>
          <section className={securityStyles.gradient_card}>
            <div className={pageStyles.subsection}>
              <div className={securityStyles.security_bullet_container}>
                <div className={securityStyles.icon}>
                  <Image className={securityStyles.icon} src={ComputerIcon} alt='icon'></Image>
                </div>
                <h1>
                  All on your computer, never ours
                </h1>
                <p>
                  Mito runs on your computer, not the cloud. None of your data ever touches our servers, so you don’t have to worry about us loosing it. 
                </p>
              </div>
              <div className={securityStyles.security_bullet_container + ' ' + pageStyles.subsection_second_element_mobile_spacing}>
                <div className={securityStyles.icon}>
                  <Image className={securityStyles.icon} src={OpenSourceIcon} alt='icon'></Image>
                </div>
                <h1>
                  Open source and auditable
                </h1>
                <p>
                  If you want to see the code that&apos;s running on your computer, you can. Mito is dedicated to building in public. 
                </p>
                <a className={pageStyles.link_with_p_tag_margins} href={MITO_GITHUB_LINK} rel="noreferrer" target='_blank'>
                  See our Github →
                </a>
              </div>
            </div>
            <div className={pageStyles.subsection}>
              <div className={securityStyles.security_bullet_container}>
                <div className={securityStyles.icon}>
                  <Image  src={TelemetryIcon} alt='icon'></Image>
                </div>
                <h1>
                  Private telemetry you can turn off
                </h1>
                <p>
                  We don’t see any of your data or metadata. Mito collects basic telemetry to improve our functionality.
                </p>
                <Link href='/plans#private-telemetry-faq'>
                  <a className={pageStyles.link_with_p_tag_margins}>
                    Learn about our private telemetry → 
                  </a>
                </Link>
              </div>
              <div className={securityStyles.security_bullet_container + ' ' + pageStyles.subsection_second_element_mobile_spacing}>
                <div className={securityStyles.icon}>
                  <Image className={securityStyles.icon} src={CCPAIcon} alt='icon'></Image>
                </div>
                <h1>
                  CCPA compliance keeps you in control
                </h1>
                <p>
                  We don&apos;t want any data you don&apos;t want us to have. CCPA compliance means you stay in control of everything. 
                </p>
                <a className={pageStyles.link_with_p_tag_margins} href='https://privacy.trymito.io/privacy-policy' rel="noreferrer" target='_blank'>
                  See our Privacy Policy → 
                </a>
              </div>
            </div>
            <div className={pageStyles.subsection}>
              <div className={securityStyles.security_bullet_container}>
                <div className={securityStyles.icon}>
                  <Image className={securityStyles.icon} src={UpgradesIcon} alt='icon'></Image>
                </div>
                <h1>
                  Opt-in upgrades and changes
                </h1>
                <p>
                  Once you have Mito installed, you&apos;re in total control of which version you run. Upgrade when you want to.
                </p>
                <a className={pageStyles.link_with_p_tag_margins} href='https://docs.trymito.io/misc/release-notes' rel="noreferrer" target='_blank'>
                  See our recent updates → 
                </a>
              </div>
              <div className={securityStyles.security_bullet_container + ' ' + pageStyles.subsection_second_element_mobile_spacing}>
                <div className={securityStyles.icon}>
                  <Image className={securityStyles.icon} src={SecurityIcon} alt='icon'></Image>
                </div>
                <h1>
                  Top-of-the-line operational security
                </h1>
                <p>
                  Mulitple rounds of code-review and automatic and manual tests make sure that insecure code doesn’t make it deployment.
                </p>
              </div>
            </div>
          </section>

          <section className={pageStyles.background_card}>
            <DownloadCTACard />
          </section>
        </main>
        <Footer />
      </div>
    </>
  )
}

export default SpreadhseetAutomation