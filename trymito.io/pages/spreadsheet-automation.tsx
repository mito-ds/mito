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
          <section className={classNames(titleStyles.title_card, pageStyles.background_card, spreadsheetAutomationStyles.flex_col_mobile_row_desktop)}>
            <div className={spreadsheetAutomationStyles.title_text_container}>
              <h1>
                No-Code Spreadsheet Automation 
              </h1>
              <p>
                Automate your spreadsheets in hours, not months.
              </p>
              <CTAButtons variant={'download'} align='left'/>
            </div>
            <div className={classNames(spreadsheetAutomationStyles.image_display_block, 'margin-top-8rem-mobile-only', 'margin-left-4rem-desktop-only')}>
              <Image src={'/presentationReadyGraphs.png'} alt='Explore your data with Mito' width={1000} height={500}/>
            </div>
          </section>

          <section>
            <div className={classNames(pageStyles.subsection, 'center')}>
              <h2>
                The Benefits of Automating Excel and Google Spreadsheets
              </h2>
            </div>
            <div className={classNames(pageStyles.subsection, pageStyles.subsection_column)}>
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
            <div className={classNames(pageStyles.subsection, pageStyles.subsection_column)}>
              <h3>
                More customization means more power
              </h3>
              <p>
                Excel used to be the data collection, analysis, and report presentation tool. Today, modern data teams use Excel primarily as the output of analyses. 
              </p>
              <p>
                Automating reports in Python lets you use AI and ML to extract insights, connect directly to all of your data sources, and utilize template analyses built by your organization.
              </p>
            </div>
            <div className={classNames(pageStyles.subsection, pageStyles.subsection_column)}>
              <h3>
                Catch bugs and reduce key person risk
              </h3>
              <p>
                Excel&apos;s greatest strength and weakness are the same -- it hides the analysis logic and encourages you focus on the data. 
              </p>
              <p>
                Because Excel reports lack structure, its easy to introduce bugs into your report and its nearly impossible to transfer responsibility for a large Excel file to someone else on your team. 
              </p>
            </div>
          </section>

          <section className={pageStyles.background_card}>
            <div className='center'>
              <h2>
                Mito Makes it Easy to Automate with Python and Pandas
              </h2>
            </div>
            <p>
              Mito generates the equivalent Python code for every edit you make in the spreadsheet. 
              So you can create your analysis like you usually do in Excel, and use the Mito generated Python code to automate your analysis going forward. 
            </p>

            <div className={classNames(spreadsheetAutomationStyles.videoWrapper, 'margin-top-4rem')}>
              <div className={spreadsheetAutomationStyles.videoContainer}>
                <iframe 
                  className={spreadsheetAutomationStyles.video}
                  src="https://www.youtube.com/embed/ZX2AtIvYdRE" 
                  title="YouTube video player" 
                  frameBorder={0}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowFullScreen
                />  
              </div>
            </div>
          </section>


          <section className={pageStyles.gradient_card}>
            <div className={classNames(pageStyles.subsection, 'center')}>
              <h2 className={classNames('margin-top-4rem', 'margin-bottom-2rem')}>
                Spreadsheet Automation Use Cases
              </h2>
            </div>
            <div className={pageStyles.subsection}>
              <div className={securityStyles.security_bullet_container}>
                <div className={securityStyles.icon}>
                  <Image className={securityStyles.icon} src={ComputerIcon} alt='icon'></Image>
                </div>
                <h3>
                  Reconciliation
                </h3>
                <p>
                  Performing end of quarter data reconciliation processes in Excel pushes back quarter close by up to 15 days.
                </p>
                <p>
                  Mito uses Python to connect directly to your data sources and perform the recon, so you can refresh your recon in seconds not hours. 
                </p>
                <p>
                  Not having to wait hours to check the status of the recon means you can close the loop with your reconciliation partners faster. Close your books and get a head start on the next quarter.
                </p>
              </div>
              <div className={classNames(securityStyles.security_bullet_container, pageStyles.subsection_second_element_mobile_spacing)}>
                <div className={securityStyles.icon}>
                  <Image className={securityStyles.icon} src={OpenSourceIcon} alt='icon'></Image>
                </div>
                <h3>
                  Reporting
                </h3>
                <p>
                  Building reports for management is never one and done. They&apos;re always going to want you pull the most recent data and update the formatting of tables. 
                </p>
                <p>
                  Updating your report in Mito is as easy as clicking “Run All”. It will pull the most up to date data, refresh your analysis, and spit out the updated Excel file. 
                </p>
                <p>
                  Refreshing a report that quickly means you can build a report 10 minutes before a meeting with the most up to date data instead of building it the night before. 
                </p>
              </div>
            </div>
            <div className={pageStyles.subsection}>
              <div className={securityStyles.security_bullet_container}>
                <div className={securityStyles.icon}>
                  <Image  src={TelemetryIcon} alt='icon'></Image>
                </div>
                <h3>
                  Large Data Analysis
                </h3>
                <p>
                  When you get a dump of 5 million rows of data, use Mito to analyze the data yourself instead of waiting for a supporting data scientist to aggregate the data for you.
                </p>
                <p>
                  Even in the highest functioning orgs, waiting for a supporting data scientst adds a full day of overhead to your analysis. 
                </p>
                <p>
                  Getting access to large datasets should increase the quality of your analysis, not decrease it. That requires the subject matter expert to analyze the data.
                </p>
              </div>
              <div className={pageStyles.subsection_second_element_mobile_spacing}>
                <div className={securityStyles.icon}>
                  <Image className={securityStyles.icon} src={CCPAIcon} alt='icon'></Image>
                </div>
                <h3>
                  Future-proofing Excel Files 
                </h3>
                <p>
                  Teams have gotten away with treating Excel files as databases for the last 10 years. 
                  Now these files are on the brink of failure because they hold too much data.
                </p>
                <p>
                  Mito lets your team prep the data using the same Excel process they&apos;ve used for the past 10 years, and push the data directly into a database. 
                </p>
                <p>
                  Not relying on Excel files that need end of life care means your team can focus on decision making.
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