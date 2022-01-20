import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link';
import Footer from '../components/Footer/Footer';
import Header from '../components/Header/Header';
import securityStyles from '../styles/Security.module.css'
import pageStyles from '../styles/Page.module.css'
import titleStyles from '../styles/Title.module.css'

// Import Icons & Background Grid
import ComputerIcon from '../public/security/ComputerIcon.svg'
import OpenSourceIcon from '../public/security/OpenSourceIcon.svg'
import TelemetryIcon from '../public/security/TelemetryIcon.svg'
import CCPAIcon from '../public/security/CCPAIcon.svg'
import UpgradesIcon from '../public/security/UpgradesIcon.svg'
import SecurityIcon from '../public/security/SecurityIcon.svg'
import BackgroundGrid from '../public/BackgroundGrid.svg'
import BackgroundGridPng from '../public/Mask Group.png'
import CTACard from '../components/CTACard/CTACard';
import { MITO_GITHUB_LINK } from '../components/GithubButton/GithubButton';

const Security: NextPage = () => {

  return (
    <>
      <Head>
        <title>Mito | Security </title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <Header/>
    
      <div className={pageStyles.container}>

        <main className={pageStyles.main}>

          <section className={titleStyles.title_card + ' ' + titleStyles.grid_card}>
            <h1 className={titleStyles.title}>
              Your data never leaves your computer, ever.
            </h1>
            <p className={titleStyles.description}>
              You don’t have to worry about our data storage practices, because we never see a drop of your data.
            </p>
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
                  If you want to see the code that’s running on your computer, you can. Mito is dedicated to building in public. 
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
                  We don’t want any data you don’t want us to have. CCPA compliance means you stay in control of everything. 
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
                  Once you have Mito installed, you’re in total control of which version you run. Upgrade when you want to.
                </p>
                <a className={pageStyles.link_with_p_tag_margins} href='https://docs.trymito.io/misc./release-notes' rel="noreferrer" target='_blank'>
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
            <CTACard />
          </section>
        </main>
        <Footer />
      </div>
    </>
  )
}

export default Security