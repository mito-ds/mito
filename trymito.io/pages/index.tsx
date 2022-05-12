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
                Python data analysis in <i>seconds</i>
              </h1>

              <p className={titleStyles.description}>
                If you can edit an Excel file, you can now write code. <br/>
                Join thousands using Mito in Jupyter.
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
                  <span className='text-highlight'> Explore </span> your data visually
                </h1>
                <p className='display-mobile-only'>
                  View CSVs, Excel files, and dataframes in an Excel-like interface. 
                  Explore your data by graphing, viewing summary stats, and creating pivot tables.
                </p>
                <p className='display-desktop-only-inline-block'>
                  View CSVs, Excel files, and dataframes in an Excel-like interface. 
                </p>
                <p className='display-desktop-only-inline-block'> 
                  Explore your data by graphing, viewing summary stats, and creating pivot tables.
                </p>
                <a href="https://docs.trymito.io/how-to/summary-statistics" target="_blank" rel="noreferrer" className={pageStyles.link_with_p_tag_margins}>
                  Learn More →
                </a>
              </div>
              <div className={homeStyles.functionality_media}>
                <Image src={'/explore.png'} alt='Explore your data with Mito' width={500} height={250} layout='responsive'/>
              </div>
            </div>

            <div className={pageStyles.subsection}>
              <div className={homeStyles.functionality_media + ' display-desktop-only-inline-block'}>
                <Image src={'/transform.png'} alt='Use Mito to transform your data' width={500} height={250} layout='responsive'/>
              </div>
              <div className={homeStyles.functionality_text}>
                <h1>
                  <span className='text-highlight'>Transform</span> data with a spreadsheet
                </h1>
                <p className='display-mobile-only'>
                  Edit your data with the tool you know from Excel and Google Sheets. 
                  Create pivot tables, write formulas, filter, and much more. 
                </p>
                <p className='display-desktop-only-inline-block'>
                  Edit your data with the tool you know from Excel and Google Sheets. 
                </p>
                <p className='display-desktop-only-inline-block'>
                  Create pivot tables, write formulas, filter, and much more. 
                </p>
                <a href="https://docs.trymito.io/how-to/pivot-tables" target="_blank" rel="noreferrer" className={pageStyles.link_with_p_tag_margins}>
                  Learn More →
                </a>
              </div>
              <div className={homeStyles.functionality_media + ' display-mobile-only-block'}>
                <Image src={'/transform.png'} alt='Use Mito to transform your data' width={500} height={250} layout='responsive'/>
              </div>
            </div>

            <div className={pageStyles.subsection}>
              <div className={homeStyles.functionality_text}>
                <h1>
                  <span className='text-highlight'>Automate</span> analyses with Python
                </h1>
                <p className='display-mobile-only'>
                  Every edit to the Mito spreadsheet automatically generates Python code. 
                  Write code quickly and accurately without worrying about the syntax. 
                </p>
                <p className='display-desktop-only-inline-block'>
                  Every edit to the Mito spreadsheet automatically generates Python code. 
                </p>
                <p className='display-desktop-only-inline-block'>
                  Write code quickly and accurately without worrying about the syntax. 
                </p>
                <a href="https://docs.trymito.io/how-to/using-the-generated-code" target="_blank" rel="noreferrer" className={pageStyles.link_with_p_tag_margins}>
                  Learn More →
                </a>
              </div>
              <div className={homeStyles.functionality_media + ' ' + homeStyles.functionality_media_supress_bottom_margin}>
                <Image src={'/automate.png'} alt='Automate analysis with Mito' width={500} height={250} layout='responsive'/>
              </div>
            </div>
            
          </section>

          <section className={pageStyles.background_card + ' ' + homeStyles.metrics_container}>
            <div className={homeStyles.metric_container}>
              <h1 className={homeStyles.gradient_text}>
                20,000+
              </h1>
              <p className={homeStyles.metrics_label}>
                Mito users
              </p>
            </div>
            <div className={homeStyles.metric_container}>
              <h1 className={homeStyles.gradient_text}>
                1M+
              </h1>
              <p className={homeStyles.metrics_label}>
                Lines of Code Generated
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


          <section className={homeStyles.tweet_section}>
            <div className={homeStyles.tweet_section_header + ' center'}>
              <h1>
                Hear what other data professionals have to say about Mito
              </h1>
              <p className='display-desktop-only-inline-block'>
                Used, known, and loved by hobbyists, researchers and Fortune 500 companies.
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
