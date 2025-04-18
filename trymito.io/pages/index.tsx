/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import Prism from 'prismjs';
import { useEffect } from 'react';
import CTAButtons from '../components/CTAButtons/CTAButtons';
import DownloadCTACard from '../components/CTACards/DownloadCTACard';
import CaseStudies from '../components/CaseStudies/CaseStudies';
import FAQCard from '../components/FAQCard/FAQCard';
import Footer from '../components/Footer/Footer';
import Header, { MITO_INSTALLATION_DOCS_LINK } from '../components/Header/Header';
import InstallInstructions from '../components/InstallInstructions/InstallInstructions';
import LogoSection from '../components/LogoSection/LogoSection';
import StreamlitAppGallery from '../components/StreamlitAppGallery/StreamlitAppGallery';
import homeStyles from '../styles/Home.module.css';
import pageStyles from '../styles/Page.module.css';
import textImageSplitStyles from '../styles/TextImageSplit.module.css';
import titleStyles from '../styles/Title.module.css';
import { classNames } from '../utils/classNames';
import { PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_TITLE_CARD } from '../utils/plausible';
import { MITO_GITHUB_LINK } from '../components/Buttons/GithubButton/GithubButton';
import FeatureSquares from '../components/FeatureSquares/FeatureSquares';
import spreadsheetAutomationStyles from '../styles/SpreadsheetAutomation.module.css';
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
          <section className={pageStyles.background_card + ' ' + titleStyles.title_card}>
            <h1 className={titleStyles.title}>
              {/* Other ideas:
                - Automate your spreadsheets. No Computer Science Degree Required.
                - Edit a spreadsheet. Generate Python code. 
                - Automate your spreadsheets, but successfully
                - All the tools you need to turn Excel reports into Python.
                - Write Python, not Spreadsheets
                - Write Python 4x faster 
                - Write Python 4x faster. Take the test.
                - Don't know how to code? Now you do.
              */}
              The Jupyter-based Data Copilot
            </h1>

            <h2 className={titleStyles.description}>
              The world&apos;s largest companies save hours per week with Mito&apos;s AI copilot and spreadsheet editor.
            </h2>
              
            <div className={homeStyles.cta_button_and_video_spacer}>
              <div className={homeStyles.cta_buttons_homepage_container}>
                <CTAButtons variant='download' align='center' displaySecondaryCTA={false} textButtonClassName={PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_TITLE_CARD}/>
                {/* <CTAButtons variant='try jupyterhub' align='center' displaySecondaryCTA={false} textButtonClassName={PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_TITLE_CARD}/> */}
              </div>
            </div>

            <div className={classNames(spreadsheetAutomationStyles.video_wrapper)}>
              <div className={spreadsheetAutomationStyles.video_container}>
                <iframe 
                  className={spreadsheetAutomationStyles.video}
                  src="https://www.loom.com/embed/3b6af8fd9bda4559918105424222b65c?sid=d0a543a3-cb0c-456b-89ff-a61a35f1e540&hideEmbedTopBar=true" 
                  title="Mito Demo" 
                  frameBorder={0}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowFullScreen
                /> 
              </div>
            </div>
          </section>

          <LogoSection></LogoSection>

          <section>
            <FeatureSquares />
          </section>

          <section className={pageStyles.background_card} >
            {/* So that we can scroll to the correct location on the page, and 
              because we have a fixed header taking up some space, we scroll 
              to this anchor tag. See here: https://stackoverflow.com/questions/10732690/offsetting-an-html-anchor-to-adjust-for-fixed-header
            */}
            <a className="anchor" id='installation'></a>
            <InstallInstructions/>
          </section>

          <section>
            <CaseStudies />
          </section>

          <section>

            <div className={classNames(pageStyles.subsection, pageStyles.subsection_justify_baseline)}>
              <div className={textImageSplitStyles.functionality_text}>
                <h2>
                  All in <span className='text-color-jupyter-orange'>Jupyter</span>, <span className='text-color-streamlit-red'>Streamlit</span>, and <span className='text-highlight'>Dash</span>
                </h2>
                <p className='only-on-mobile'> 
                  Mito is a Jupyter extension and Streamlit component, so you don&apos;t need to set up any new infrastructure. 
                  Get started with Mito in seconds. It&apos;s easy as pip install mitosheet.
                </p>
                <p className='only-on-desktop-inline-block'>
                  Mito is a Jupyter extension, so you don&apos;t need to set up any new infrastructure. You can use Mito in JupyterLab, Jupyter Notebooks, JupyterHub, SageMaker and more.
                </p>
              </div>
              <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin)}>
                <Image src={'/jupyter-and-streamlit.png'} alt='Use Mito in Jupyter or Streamlit' width={678} height={342} layout='responsive'/>
              </div>
            </div>

          </section>


          <section>
            <div className={classNames(pageStyles.subsection, pageStyles.subsection_column, 'center')}>
                <h2>
                  Upgrade Python scripts to interactive Streamlit Dashboards
                </h2>
                <p>
                  Turn one hour of automation savings into tens of hours by sharing automation scripts through Streamlit dashboards.
                </p>
                <p className={pageStyles.link}>
                  <Link href="/data-app" >
                    Learn more about Mito in Streamlit →
                  </Link>
                </p>
            </div>
            <StreamlitAppGallery />
                
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
