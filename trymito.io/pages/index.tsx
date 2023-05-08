import type { NextPage } from 'next'
import Image from 'next/image'
import Head from 'next/head'
import Footer from '../components/Footer/Footer';
import Header from '../components/Header/Header';
import Tweets from '../components/Tweets/Tweets';
import homeStyles from '../styles/Home.module.css'
import pageStyles from '../styles/Page.module.css'
import titleStyles from '../styles/Title.module.css'
import CTAButtons from '../components/CTAButtons/CTAButtons';
import GithubButton from '../components/GithubButton/GithubButton';
import DownloadCTACard from '../components/CTACards/DownloadCTACard';
import TextButton from '../components/TextButton/TextButton';
import AIThesis from '../components/AIThesis/AIThesis';

const Home: NextPage = () => {

  return (
    <>
      <Head>
        <title>Mito | Home </title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <Header/>
    
      <div className={pageStyles.container}>

        <main className={pageStyles.main}>
          <section className={pageStyles.background_card + ' ' + titleStyles.title_card}>
              <h1 className={titleStyles.title}>
                Spreadsheets, meet <span className='text-color-purple'>AI Automation</span>
              </h1>

              <p className={titleStyles.description}>
                Join thousands of analysts at the world&apos;s largest banks
                saving themselves from hours of repetitive work. 
              </p>
              
              <div className={homeStyles.cta_button_and_video_spacer}>
                <CTAButtons variant='download'/>
              </div>
              
            <div id='video'>
              <video className={homeStyles.video} autoPlay loop disablePictureInPicture playsInline webkit-playsinline="true" muted>
                <source src="/demo.mp4" />
              </video>
            </div>
          </section>

          <section>
            <div className={pageStyles.subsection}>
              <div className={homeStyles.functionality_text}>
                <h1>
                  <span className='text-highlight'>Edit a spreadsheet.</span> <br></br>
                  Generate Python.
                </h1>
                <p className='display-mobile-only'> 
                  Every edit you make to the Mito spreadsheet automatically generates Python code.
                  Stop sitting through Python trainings or waiting for IT support. 
                  Take automation into your own hands using the tools you already know.
                </p>
                <p className='display-desktop-only-inline-block'>
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
              <div className={homeStyles.functionality_media + ' ' + homeStyles.functionality_media_supress_bottom_margin}>
                <Image src={'/automate.png'} alt='Automate analysis with Mito' width={500} height={250} layout='responsive'/>
              </div>
            </div>
          
            <div className={pageStyles.subsection}>
              <div className={homeStyles.functionality_media + ' display-desktop-only-inline-block'}>
                <Image src={'/Mito_AI_Taskpane.png'} alt='Use Mito AI to transform your data' width={500} height={250} layout='responsive'/>
              </div>
              <div className={homeStyles.functionality_text}>
                <h1>
                  <span className='text-highlight'>Transform</span> your data with AI
                </h1>
                <p className='display-mobile-only'>
                  Just say the word. The Mito AI assistant will write the code.
                </p>
                <p className='display-desktop-only-inline-block'>
                  Just say the word. The Mito AI assistant will write the code.
                </p>
                <a href="https://docs.trymito.io/how-to/ai-transformations" target="_blank" rel="noreferrer" className={pageStyles.link_with_p_tag_margins}>
                  Learn more about Mito AI →
                </a>
              </div>
              <div className={homeStyles.functionality_media + ' display-mobile-only-block'}>
                <Image src={'/Mito_AI_Taskpane.png'} alt='Use Mito AI to transform your data' width={500} height={250} layout='responsive'/>
              </div>
            </div>

            <div className={pageStyles.subsection}>
              <div className={homeStyles.functionality_text}>
                <h1>
                  All in <span className='text-color-jupyter-orange'>Jupyter</span>
                </h1>
                <p className='display-mobile-only'> 
                  Mito is a Jupyter extension, so you don&apos;t need to set up any new infrastructure. 
                  Get started with Mito in seconds. It&apos;s easy as pip install mitosheet.
                </p>
                <p className='display-desktop-only-inline-block'>
                  Mito is a Jupyter extension, so you don&apos;t need to set up any new infrastructure.
                </p>
                <p className='display-desktop-only-inline-block'>
                  Get started with Mito in seconds. It&apos;s easy as <span className='code-background'>pip install mitosheet</span>
                </p>

                <a href="https://docs.trymito.io/getting-started/installing-mito" target="_blank" rel="noreferrer" className={pageStyles.link_with_p_tag_margins}>
                  Download Mito for Jupyter →
                </a>
              </div>
              <div className={homeStyles.functionality_media + ' ' + homeStyles.functionality_media_supress_bottom_margin}>
                <Image src={'/Mito_in_jupyter.png'} alt='Automate analysis with Mito' width={500} height={250} layout='responsive'/>
              </div>
            </div>

            <AIThesis/>
          </section>

          <section className={homeStyles.metrics_container}>
            <div className={homeStyles.metric_container}>
              <h1 className={homeStyles.gradient_text}>
                50,000+
              </h1>
              <p className={homeStyles.metrics_label}>
                Mito users
              </p>
            </div>
            <div className={homeStyles.metric_container}>
              <h1 className={homeStyles.gradient_text}>
                10,000+
              </h1>
              <p className={homeStyles.metrics_label}>
                Hours saved through automation
              </p>
            </div>
            <div className={homeStyles.metric_container}>
              <h1 className={homeStyles.gradient_text}>
                250,000+
              </h1>
              <p className={homeStyles.metrics_label}>
                Mito Sheets Created
              </p>
            </div>
          </section>

          <section className={pageStyles.background_card + ' ' + homeStyles.case_study_section}>
            <div>
              <h2 className={homeStyles.case_study_text}>
                Enigma’s Director of Finance saves 16 hours per month with Mito
              </h2>
              <TextButton 
                text="Read Tom's Story"
                href="https://blog.trymito.io/enigma-case-study/"
              />
            </div>
            <div className={homeStyles.case_study_headshot}>
              <Image src='/bellis.jpeg' alt='Explore your data with Mito' width={250} height={250} ></Image>
            </div>
          </section>

          <section className={homeStyles.tweet_section}>
            <div className={homeStyles.tweet_section_header + ' center'}>
              <h1>
                Mito is the go-to Python tool at the largest banks in the world
              </h1>
              <p className='display-desktop-only-inline-block'>
                See why Mito is ranked as one of the top Python libraries of 2022
              </p>
              <GithubButton 
                variant='Issue'
                text='Join the discussion on Github'
              />
            </div>
            <Tweets />
          </section>

          <section className={homeStyles.open_source_section}>
              <div className={homeStyles.open_source_section_header + ' center'}>
                <h1>
                  We&apos;re proud to support important open source projects
                </h1>
              </div>
              <div className={pageStyles.subsection + ' ' + homeStyles.open_source_section_logos}>
                <a className={homeStyles.open_source_section_logo_container} href='https://numfocus.org/donate-to-jupyter' target='_blank' rel="noreferrer">
                  <Image src={'/jupyter_main_logo.svg'} alt='jupyter logo' width={200} height={200}/>
                </a>
                <a className={homeStyles.open_source_section_logo_container} href='https://numfocus.org/donate-to-pandas' target='_blank' rel="noreferrer">
                  <Image src={'/pandas_secondary_white.svg'} alt='pandas logo' width={200} height={200}/>
                </a>
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

export default Home
