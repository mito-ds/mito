/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '../components/Footer/Footer';
import Header from '../components/Header/Header';
import pageStyles from '../styles/Page.module.css';
import bifoldStyles from '../styles/Bifold.module.css';
import titleStyles from '../styles/Title.module.css';
import textImageSplitStyles from '../styles/TextImageSplit.module.css';
import lowCodeSQLStyles from '../styles/LowCodeSQL.module.css';
import trifoldStyles from '../styles/Trifold.module.css';
import homeStyles from '../styles/Home.module.css'


// Import Icons & Background Grid
import { classNames } from '../utils/classNames';
import IconAndTextRow from '../components/IconAndTextRow/IconAndTextRow';
import AuthenticateIcon from '../public/low-code-sql/AuthenticateIcon.svg';
import EditIcon from '../public/low-code-sql/EditIcon.svg';
import EmailIcon from '../public/low-code-sql/EmailIcon.svg';
import ExploreIcon from '../public/low-code-sql/ExploreIcon.svg';
import FilterIcon from '../public/low-code-sql/FilterIcon.svg';
import ScheduleIcon from '../public/low-code-sql/ScheduleIcon.svg';
import SelectIcon from '../public/low-code-sql/SelectIcon.svg';
import SpreadsheetIcon from '../public/low-code-sql/SpreadsheetIcon.svg';
import WideGraphIcon from '../public/low-code-sql/WideGraphIcon.svg';
import CTAButtons from '../components/CTAButtons/CTAButtons';
import ContactCTACard from '../components/CTACards/ContactCTACard';
import { PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_TITLE_CARD } from '../utils/plausible';

const LowCodeSQL: NextPage = () => {

  return (
    <>
      <Head>
        <title>Low Code SQL Tools for Python - Generate, Validate, Visualize | Mito</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Mito makes SQL easier, with AI-assisted tools to generate and validate SQL, Python, and Pandas code, all in a notebook-native spreadsheet GUI." />
      </Head>
      
      <Header/>
    
      <div className={pageStyles.container}>

        <main className={pageStyles.main}>

            <section className={classNames(pageStyles.background_card, titleStyles.title_card)}>
                <h1 className={titleStyles.title}>
                    Write SQL code using the Mito Spreadsheet
                </h1>
                <p className={titleStyles.description}>
                    Connect to your data sources, so you&apos;re always working with the most up to date data
                </p>
                <div className={homeStyles.cta_button_and_video_spacer}>
                    <CTAButtons variant='contact' align='center' displaySecondaryCTA={false} textButtonClassName={PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_TITLE_CARD}/>
                </div>
                <div id='video'>
                    <video className={homeStyles.video} autoPlay loop disablePictureInPicture playsInline webkit-playsinline="true" muted>
                        <source src="/low-code-sql/SQL-Python.mp4" />
                    </video>
                </div>
            </section>

            <section>
                <div className={classNames(pageStyles.subsection, pageStyles.subsection_justify_baseline)}>
                    <div className={textImageSplitStyles.functionality_text}>
                        <h2>
                            No-Code <span className='text-highlight'>SQL Generation</span>
                        </h2>
                        <p> 
                            Write all of the database connection and SQL code through the Mito SQL Editor.
                        </p>
                        <p>
                            Don&apos;t spend time figuring out the correct database connection to use or trying to learn yet another programming language. 
                        </p>
                        <p>
                            The Mito UI does it all for you.
                        </p>
                    </div>
                    <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin)}>
                        <Image src={'/low-code-sql/snowflake-taskpane.png'} alt='Automate analysis with Mito' width={603} height={324} layout='responsive'/>
                    </div>
                </div>
            
                <div className={classNames(pageStyles.subsection, pageStyles.subsection_justify_baseline)}>
                    <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin, 'only-on-desktop-inline-block')}>
                        <Image src={'/low-code-sql/sql-to-python.png'} alt='Use SQL to import data, then Python to edit it' width={613} height={452} layout='responsive'/>
                    </div>
                    <div className={textImageSplitStyles.functionality_text}>
                        <h2>
                            Switch between <span className='text-highlight'>SQL and Python</span> seamlessly
                        </h2>
                        <p>
                            Use SQL to import data from your data warehouse, and then immediately explore and transform it through the Mito spreadsheet. 
                        </p>
                        <p>
                            SQL is best used for importing data. Python is best used for data cleaning, analysis, and visualizations. 
                        </p>
                        <p className={pageStyles.link}>
                            <Link href="/spreadsheet-automation" >
                                Learn more about the Mito Spreadsheet →
                            </Link>
                        </p>
                    </div>
                    <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin, 'only-on-mobile-block')}>
                        <Image src={'/low-code-sql/sql-to-python.png'} alt='Use SQL to import data, then Python to edit it' width={613} height={452} layout='responsive'/>
                    </div>
                </div>
            </section>

            <section className={classNames(bifoldStyles.bifold_container)}>
                <div className={classNames(lowCodeSQLStyles.sql_python_card_container, lowCodeSQLStyles.sql_python_card_container_dark)}>
                    <h3 className={classNames(lowCodeSQLStyles.sql_python_card_title)}>
                        Use SQL to:
                    </h3>
                    <IconAndTextRow title={'Authenticate to data sources'} imageSrc={AuthenticateIcon} />
                    <IconAndTextRow title={'Select data for your analysis'} imageSrc={SelectIcon} />
                    <IconAndTextRow title={'Create dataframes in your notebook'} imageSrc={SpreadsheetIcon} />
                    <IconAndTextRow title={'Write data back to database'} imageSrc={EditIcon} />          
                </div>
                <div className={classNames(lowCodeSQLStyles.sql_python_card_container, lowCodeSQLStyles.sql_python_card_container_light)}>
                    <h3 className={classNames(lowCodeSQLStyles.sql_python_card_title)}>
                        Use Python to:
                    </h3>
                    <IconAndTextRow title={'Explore, clean, and preprocess data'} imageSrc={ExploreIcon} />
                    <IconAndTextRow title={'Transform and analyze data'} imageSrc={EditIcon} />
                    <IconAndTextRow title={'Use filters, pivot tables & more'} imageSrc={FilterIcon} />
                    <IconAndTextRow title={'Visualize data'} imageSrc={WideGraphIcon} /> 
                    <IconAndTextRow title={'Export reports to Excel '} imageSrc={SpreadsheetIcon} /> 
                    <IconAndTextRow title={'Send emails'} imageSrc={EmailIcon} /> 
                    <IconAndTextRow title={'Schedule reports to execute '} imageSrc={ScheduleIcon} /> 
                </div>
            </section>

            <section>

                <div className={classNames(pageStyles.subsection, trifoldStyles.container)}>
                    <div className={classNames(pageStyles.subsection_column)}>
                        <div className={classNames(trifoldStyles.image_container, 'margin-top-8rem-mobile-only')}>
                            <Image src={'/snowflake-query-taskpane.png'} alt='Large Data' width={1000} height={500}/>
                        </div>
                        <h3>
                            Easier ETL and Data Source Integration
                        </h3>
                        <p>
                            By connecting Mito directly to your database, you can build fully automated workflows. 
                        </p>
                        <p>
                            Pulling data directly from the database means you don&apos;t need to manage `export (100).csv` or worry about using out of date data. 
                        </p>
                    </div>
                    <div className={classNames(pageStyles.subsection_column)}>
                        <div className={classNames(trifoldStyles.image_container, 'margin-top-8rem-mobile-only')}>
                        <Image src={'/low-code-sql/refine-query.png'} alt='Use the Mito Spreadsheet to edit SQL-imported data' width={1000} height={500}/>
                        </div>
                        <h3>
                            Refine your query using a spreadsheet GUI
                        </h3>
                        <p>
                            Enterprise data is notoriously complex. Figuring out which of the four date fields to use requires diving into the data. 
                        </p>
                        <p>
                            Use the Mito SQL Editor to pull in all four date fields. Then, use the spreadsheet to figure out which one you actually need. Finally, update your query without ever switching tools. 
                        </p>
                    </div>
                    <div className={classNames(pageStyles.subsection_column)}>
                        <div className={classNames(trifoldStyles.image_container, 'margin-top-8rem-mobile-only')}>
                        <Image src={'/low-code-sql/connect-to-data-source.png'} alt='Connect to any data source' width={1000} height={500}/>
                        </div>
                        <h3>
                            Connect Mito to any data with a Python library for SQL
                        </h3>
                        <p>
                            Every enterprise stores their data differently, so Mito makes it easy to bring your own database connections.
                        </p>
                        <p>
                            Set a few environment variables and empower all of your analysts to access data without relying on a team of supporting data scientists. 
                        </p>
                        <p className={pageStyles.link}>
                            <Link href="/infrastructure-integration-python-tool" >
                                Learn more about infrastructure integration →
                            </Link>
                        </p>
                    </div>
                </div>

            </section>

            <section className={pageStyles.background_card}>
                <ContactCTACard />
            </section>
        </main>
        <Footer />
      </div>
    </>
  )
}

export default LowCodeSQL