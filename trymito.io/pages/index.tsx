/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Prism from 'prismjs';
import { useEffect } from 'react';
import DownloadCTACard from '../components/CTACards/DownloadCTACard';
import CaseStudies from '../components/CaseStudies/CaseStudies';
import FAQCard from '../components/FAQCard/FAQCard';
import Footer from '../components/Footer/Footer';
import Header, { MITO_INSTALLATION_DOCS_LINK } from '../components/Header/Header';
import LogoSection from '../components/LogoSection/LogoSection';
import homeStyles from '../styles/Home.module.css';
import pageStyles from '../styles/Page.module.css';
import titleStyles from '../styles/Title.module.css';
import { classNames } from '../utils/classNames';
import { PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_TITLE_CARD } from '../utils/plausible';
import { MITO_GITHUB_LINK } from '../components/Buttons/GithubButton/GithubButton';
import FeatureSquares from '../components/FeatureSquares/FeatureSquares';
import MadeWithMito from '../components/MadeWithMito/MadeWithMito';
import DemoVideo from '../components/DemoVideo/DemoVideo';
import WaitlistSignup from '../components/WaitlistSignup/WaitlistSignup';

const Home: NextPage = () => {

  useEffect(() => {
    Prism.highlightAll();
  }, []);

  return (
    <>
      <Head>
        <title>Best Python Spreadsheet Automation & Code Generation | Mito </title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Header/>
    
      <div className={pageStyles.container}>

        <main className={pageStyles.main}>
          <section className={classNames(pageStyles.background_card, titleStyles.title_card, titleStyles.grid_card)}>
            <div className={homeStyles.hero_content_container}>
              <div className={homeStyles.hero_text_container}>
                <h1 className={classNames(titleStyles.title, titleStyles.cycling_h1_container, 'display-desktop-only-flex')}>
                  <span>From Data to{' '}</span>
                  <span className={titleStyles.cycling_text}>
                    <span className={titleStyles.cycling_word} data-word="insights">Insights</span>
                    <span className={titleStyles.cycling_word} data-word="automations">Automations</span>
                    <span className={titleStyles.cycling_word} data-word="dashboards">Dashboards</span>
                    <span className={titleStyles.cycling_word} data-word="internal tools">Internal Tools</span>
                    <span className={titleStyles.cycling_word} data-word="Agent">Agent</span>
                  </span>
                </h1>
                <h1 className={classNames(titleStyles.title, 'only-on-mobile')}>
                  From Data to Insights and Automations
                </h1>

                <h2 className={classNames(titleStyles.description)}>
                  Go from raw data to presentation-ready insights 4x faster with AI that understands your data.
                </h2>
                  
                <div className={homeStyles.cta_buttons_homepage_container}>
                  <WaitlistSignup />
                </div>
              </div>
              <div className={homeStyles.hero_video_container}>
                <DemoVideo />
              </div>
            </div>

            {/* <AIInputField autoLaunchJupyterLab={true} /> */}
          </section>

          <LogoSection></LogoSection>

          <section>
            <MadeWithMito />
          </section>

          <section>
            <FeatureSquares />
          </section>

          <section>
            <CaseStudies />
          </section>

          <section className={pageStyles.background_card}>
            <DownloadCTACard />
          </section>

          <section style={{marginBottom: '60px'}}>
            <h2 className='center'>
              Frequently Asked Questions
            </h2>
            <FAQCard title='Is Mito open source?'>
              <div>
                <p>
                  Mito is an open source project, and the codebase is available on <a className={pageStyles.link} href={MITO_GITHUB_LINK} target="_blank" rel="noreferrer">Github</a>.
                </p>
                <p>
                  Outside contributions are welcome and encouraged! 
                </p>
              </div>
            </FAQCard>
            <FAQCard title='Is Mito free?'>
              <div>
                <p>
                  Mito Open Source is free. You can install Mito by following the install instructions <a className={pageStyles.link} href={MITO_INSTALLATION_DOCS_LINK} target="_blank" rel="noreferrer">here</a>.
                </p>
                <p>
                  For individuals automating spreadsheet processes or creating more advanced Python scripts, we offer a Pro version. Mito Pro includes unlimited AI completions, disabling all telemetry, and additional formatting and transformation options.
                </p>
                <p>
                  For enterprises looking to accelerate Python adoption, Mito Enterprise includes advanced functionality like admin controls, database and LLM integrations, and training programs. 
                </p>
                <p>
                  See more at our <Link href='/plans'><a className={pageStyles.link}>plans page.</a></Link>
                </p>
              </div>
            </FAQCard>
            <FAQCard title='How do I install Mito?'>
              <div>
                <p>
                  Mito is a Jupyter extension that runs in JupyterLab, Jupyter notebooks, JupyterHub, SageMaker, and more. You can also use the Mito Spreadsheet in Streamlit and Dash apps.
                </p>
                <p>
                  You can install Mito by following the install instructions <a className={pageStyles.link} href={MITO_INSTALLATION_DOCS_LINK} target="_blank" rel="noreferrer">here</a>.
                </p>
              </div>
            </FAQCard>
            <FAQCard title='Can I use Mito to automate my spreadsheet tasks?'>
              <div>
                <p>
                  Yes! Mito is designed to help you automate your spreadsheet tasks.
                </p>
                <p>
                  By completing your spreadsheet workflow a single time in Mito, you will get a Python script that you can rerun on new data.
                </p>
              </div>
            </FAQCard>
            <FAQCard title='Can I use Python to view a spreadsheet?'>
              <div>
                <p>
                  Mito provides a spreadsheet interface within your Python enviornment. 
                </p>
                <p>
                  You can use Mito to view, edit, and transform your spreadsheet data from within Python, without needing to be a Python expert.
                </p>
              </div>
            </FAQCard>
            
          </section>
        </main>
        <Footer />
      </div>
    </>
  )
}

export default Home
