import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import Prism from 'prismjs';
import { useEffect, useState } from 'react';
import CTAButtons from '../components/CTAButtons/CTAButtons';
import DownloadCTACard from '../components/CTACards/DownloadCTACard';
import CaseStudies from '../components/CaseStudyCard/CaseStudies';
import FAQCard from '../components/FAQCard/FAQCard';
import Footer from '../components/Footer/Footer';
import { MITO_GITHUB_LINK } from '../components/GithubButton/GithubButton';
import Header, { MITO_INSTALLATION_DOCS_LINK } from '../components/Header/Header';
import InstallInstructions from '../components/InstallInstructions/InstallInstructions';
import LogoSection from '../components/LogoSection/LogoSection';
import StreamlitAppGallery from '../components/StreamlitAppGallery/StreamlitAppGallery';
import homeStyles from '../styles/Home.module.css';
import pageStyles from '../styles/Page.module.css';
import textImageSplitStyles from '../styles/TextImageSplit.module.css';
import titleStyles from '../styles/Title.module.css';
import { classNames } from '../utils/classNames';
import { PLAUSIBLE_BOOK_A_DEMO_CTA_PRESSED, PLAUSIBLE_COPIED_PIP_INSTALL_MITOSHEET, PLAUSIBLE_SCROLLED_TO_INSTALL_INSTRUCTIONS } from '../utils/plausible';

const Home: NextPage = () => {

  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (copied) {
      setTimeout(() => {setCopied(false)}, 3000)
    }
  }, [copied])

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
              Edit a spreadsheet to generate Python. Code 4x faster. 
            </h1>

            <h2 className={titleStyles.description}>
              Join analysts at the world&apos;s largest companies  
              automating their repetitive Excel work with Mito.
            </h2>
              
            <div className={homeStyles.cta_button_and_video_spacer}>
              <div className={homeStyles.cta_buttons_homepage_container}>
                <CTAButtons variant='scroll-to-install' align='center' displaySecondaryCTA={false} textButtonClassName={PLAUSIBLE_SCROLLED_TO_INSTALL_INSTRUCTIONS}/>
                <CTAButtons variant='book a demo' align='center' displaySecondaryCTA={false} textButtonClassName={PLAUSIBLE_BOOK_A_DEMO_CTA_PRESSED}/>
              </div>
            </div>
            
            <iframe
              className='only-on-desktop-inline-block'
              src="https://mito-for-st-demo.streamlit.app/?embed=true"
              height="750"
              style={{width: '80%', border: 'none'}}
            ></iframe>
            <div id='video' className='only-on-mobile'>
              <video className={homeStyles.video} autoPlay loop disablePictureInPicture playsInline webkit-playsinline="true" muted>
                <source src="/demo.mp4" />
              </video>
            </div>
          </section>

          <LogoSection></LogoSection>

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
                  <span className='text-highlight'>Edit a spreadsheet.</span> <br></br>
                  Generate Python.
                </h2>
                <p className='only-on-mobile'> 
                  Every edit you make to the Mito spreadsheet automatically generates Python code.
                  Stop sitting through Python trainings or waiting for IT support. 
                  Take automation into your own hands using the tools you already know.
                </p>
                <p className='only-on-desktop-inline-block'>
                  Every edit you make to the Mito spreadsheet automatically generates Python code.
                </p>
                <p>
                  Stop sitting through Python trainings or waiting for IT support. 
                  Take automation into your own hands using the tools you already know.
                </p>
                <a href="https://docs.trymito.io/how-to/importing-data-to-mito" target="_blank" rel="noreferrer" className={pageStyles.link_with_p_tag_margins}>
                  View all 100+ transformations →
                </a>
              </div>
              <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin)}>
                <Image src={'/automate.png'} alt='Automate analysis with Mito' width={500} height={250} layout='responsive'/>
              </div>
            </div>
          
            <div className={classNames(pageStyles.subsection, pageStyles.subsection_justify_baseline)}>
              <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin, 'only-on-desktop-inline-block')}>
                <Image src={'/Mito_AI_Taskpane.png'} alt='Use Mito AI to transform your data' width={500} height={250} layout='responsive'/>
              </div>
                <div className={textImageSplitStyles.functionality_text}>
                <h2>
                  <span className='text-highlight'>Transform</span> your data with AI
                </h2>
                <p>
                  Describe your edits in plain english. The Mito AI assistant will write the code.
                </p>
                <p className={pageStyles.link}>
                  <Link href="/python-ai-tools" >
                    Learn more about Mito AI →
                  </Link>
                </p>
              </div>
              <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin, 'only-on-mobile-block')}>
                <Image src={'/Mito_AI_Taskpane.png'} alt='Use Mito AI to transform your data' width={500} height={250} layout='responsive'/>
              </div>
            </div>

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
                  Mito is a Jupyter extension, so you don&apos;t need to set up any new infrastructure.
                </p>
                <p className='only-on-desktop-inline-block'>
                  Get started with Mito in seconds. It&apos;s easy as: <br></br><br></br>
                  <span className={classNames(PLAUSIBLE_COPIED_PIP_INSTALL_MITOSHEET, 'code-background')} onClick={async () => {
                    // Copy to clickboard on click
                    await navigator.clipboard.writeText('pip install mitosheet');
                    setCopied(true);
                  }}>
                    pip install mitosheet
                  </span> {copied && "- copied!"}
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

          <section className={homeStyles.metrics_container + ' margin-top-8rem'}>
            <div className={homeStyles.metric_container}>
              <p className={homeStyles.metric_number_text}>
                50,000+
              </p>
              <p className={homeStyles.metrics_label}>
                Mito users
              </p>
            </div>
            <div className={homeStyles.metric_container}>
              <p className={homeStyles.metric_number_text}>
                100,000+
              </p>
              <p className={homeStyles.metrics_label}>
                Hours saved through automation
              </p>
            </div>
            <div className={homeStyles.metric_container}>
              <p className={homeStyles.metric_number_text}>
                800,000+
              </p>
              <p className={homeStyles.metrics_label}>
                Mito Sheets Created
              </p>
            </div>
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
                  For individuals automating spreadsheet processes, we offer a Pro version. Mito Pro includes unlimited AI completions, disabling all telemetry, and additional formatting and transformation options.
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
                  Mito is a Jupyter extension that runs in JupyterLab, Jupyter notebooks, and JupyterHub.
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
