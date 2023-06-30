import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Footer from '../components/Footer/Footer';
import Header from '../components/Header/Header';
import pageStyles from '../styles/Page.module.css';
import textImageSplitStyles from '../styles/TextImageSplit.module.css';
import titleStyles from '../styles/Title.module.css';
import trifoldStyles from '../styles/Trifold.module.css';
import spreadsheetAutomationStyles from '../styles/SpreadsheetAutomation.module.css';

// Import Icons & Background Grid
import DownloadCTACard from '../components/CTACards/DownloadCTACard';
import { classNames } from '../utils/classNames';
import CTAButtons from '../components/CTAButtons/CTAButtons';
import Link from 'next/link';

const SpreadhseetAutomation: NextPage = () => {

  return (
    <>
      <Head>
        <title>No-Code Spreadsheet Automation Software for Python | Mito</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Mito is a notebook-native Python library that enables simple, no-code spreadsheet automation with Pandas code generation and AI tools built in. | Mito" />
      </Head>
      <Header/>
    
      <div className={pageStyles.container}>

        <main className={pageStyles.main}>
          <section className={classNames(titleStyles.title_card, pageStyles.background_card, spreadsheetAutomationStyles.flex_col_mobile_row_desktop)}>
            <div className={spreadsheetAutomationStyles.title_text_container}>
              <h1>
                The No-Code tool approach to Spreadsheet Automation 
              </h1>
              <p>
                Automate your spreadsheets in hours, not months.
              </p>
              <CTAButtons variant={'download'} align='left'/>
            </div>
            <div className={classNames(spreadsheetAutomationStyles.image_display_block, 'margin-top-8rem-mobile-only', 'margin-left-4rem-desktop-only')}>
              <Image className={spreadsheetAutomationStyles.hero_image} src={'/pivot_table.png'} alt='Explore your data with Mito' width={1000} height={500}/>
            </div>
          </section>

          <section>
            <div className={pageStyles.subsection}>
              <div className={classNames(textImageSplitStyles.functionality_media, 'display-desktop-only-inline-block')}>
                <Image src={'/Mito_AI_Taskpane.png'} alt='Use Mito AI to transform your data' width={500} height={250} layout='responsive'/>
              </div>
              <div className={textImageSplitStyles.functionality_text}>
                <h1>
                  The easiest way to <span className='text-highlight'>write Python code</span>
                </h1>
                <p>
                  Every edit made in the Mito spreadsheet is automatically converted to Python code. 
                </p>
                <p>
                  Edit your data just like you do in Excel and receive production ready Python code without searching Pandas documentation or Stack Overflow.
                </p>
              </div>
              <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin, 'display-mobile-only-block')}>
                <Image src={'/Mito_AI_Taskpane.png'} alt='Use Mito AI to transform your data' width={500} height={250} layout='responsive'/>
              </div>
            </div>
            <div className={pageStyles.subsection}>
              <div className={textImageSplitStyles.functionality_text}>
                <h1>
                  <span className='text-highlight'>Explore</span> your data visually
                </h1>
                <p> 
                  There&apos;s no replacement for scrolling through your data. Enter fullscreen mode and build intuition about your analysis.
                </p>
                <p>
                  Use Mito&apos;s Excel-like interface to view CSV/Excel files and dataframes. And further explore your data by graphing, viewing summary stats, and creating pivot tables.
                </p>
              </div>
              <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin)}>
                <Image src={'/automate.png'} alt='Automate analysis with Mito' width={500} height={250} layout='responsive'/>
              </div>
            </div>
          </section>

          <section>
            <div className={classNames(pageStyles.subsection, 'center')}>
              <h2>
                The Benefits of Automating Excel and Google Spreadsheets
              </h2>
            </div>
            <div className={classNames(pageStyles.subsection, trifoldStyles.container)}>
              <div className={classNames(pageStyles.subsection_column)}>
                <div className={classNames(trifoldStyles.image_container, 'margin-top-8rem-mobile-only')}>
                  <Image src={'/large_data.png'} alt='Large Data' width={1000} height={500}/>
                </div>
                <h3>
                  Handle large datasets faster
                </h3>
                <p>
                  Excel and Google Sheets aren&apos;t designed for modern data. Insert 1 million rows of data into Excel and you&apos;ll wait 10 minutes every time you update your analysis.
                </p>
                <p>
                  Modern data teams use Python to analyze millions of rows of data in just a couple of seconds. 
                </p>
              </div>
              <div className={classNames(pageStyles.subsection_column)}>
                <div className={classNames(trifoldStyles.image_container, 'margin-top-8rem-mobile-only')}>
                  <Image src={'/custom_imports.png'} alt='Custom Import' width={1000} height={500}/>
                </div>
                <h3>
                  Use the full power of Python
                </h3>
                <p>
                  Excel used to be the data collection, analysis, and report presentation tool. Today, modern data teams use Excel primarily as the output of analyses. 
                </p>
                <p>
                  Automating reports in Python lets you use AI and ML to extract insights, connect directly to all of your data sources, and utilize template analyses built by your organization.
                </p>
              </div>
              <div className={classNames(pageStyles.subsection_column)}>
                <div className={classNames(trifoldStyles.image_container, 'margin-top-8rem-mobile-only')}>
                  <Image src={'/code.png'} alt='Mito Generated Code' width={1000} height={500}/>
                </div>
                <h3>
                  Reduce bugs and key person risk
                </h3>
                <p>
                  Excel&apos;s greatest strength and weakness are the same -- it hides the analysis logic and encourages you focus on the data. 
                </p>
                <p>
                  Because Excel reports lack structure, its easy to introduce bugs into your report and its nearly impossible to transfer responsibility for a large Excel file to someone else on your team. 
                </p>
              </div>
            </div>
            
          </section>

          <section className={pageStyles.background_card}>
            <div className={classNames('center', spreadsheetAutomationStyles.automate_section_container)}>
              <h2>
                Mito is the easiset way to automate with Python and Pandas
              </h2>
              <p>
                Edit a spreadsheet. Generate Python.
              </p>
              <p>
                Mito automatically converts each edit you make into Python code.
                So you can create your analysis like you usually do in Excel, and use the Mito generated Python code to automate your analysis going forward. 
              </p>
            </div>
            <div className={classNames(spreadsheetAutomationStyles.videoWrapper, 'margin-top-4rem')}>
              <div className={spreadsheetAutomationStyles.videoContainer}>
                <iframe 
                  className={spreadsheetAutomationStyles.video}
                  src="https://www.youtube.com/embed/eF2QV4ymapk" 
                  title="YouTube video player" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowFullScreen>
                </iframe>
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