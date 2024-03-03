import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Header from '../../components/Header/Header';

import titleStyles from '../../styles/Title.module.css';
import pageStyles from '../../styles/Page.module.css';
import trifoldStyles from '../../styles/Trifold.module.css'
import securityStyles from '../../styles/Security.module.css'
import textImageSplitStyles from '../../styles/TextImageSplit.module.css'
import ComputerIcon from '../../public/icon-squares/ComputerIcon.svg';
import ReconIcon from '../../public/icon-squares/ReconIcon.svg';
import ExcelIcon from '../../public/icon-squares/ExcelIcon.svg';
import ReportIcon from '../../public/icon-squares/ReportIcon.svg';

import { classNames } from '../../utils/classNames';
import CTAButtons from '../../components/CTAButtons/CTAButtons';
import DownloadCTACard from '../../components/CTACards/DownloadCTACard';
import Footer from '../../components/Footer/Footer';
import Link from 'next/link';
import { PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_TITLE_CARD } from '../../utils/plausible';

const Security: NextPage = () => {

    return (
        <>
            <Head>
                <title>Best Python Package for Finance, Insurance, and Fintech | Mito </title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="description" content="Best Python Package for Finance, Insurance, and Fintech | Mito" />
            </Head>
            
            <Header/>
        
            <div className={pageStyles.container}>

                <main className={pageStyles.main}>
                    <section className={classNames(titleStyles.title_card, titleStyles.grid_card)}>
                        <h1 className={titleStyles.title}>
                            Finance professionals save themselves hours per week with Python.
                        </h1>
                        <p className={titleStyles.description}>
                            The world&apos;s largest financial institutions are already using Mito to automate their spreadsheets.
                        </p>
                        <CTAButtons variant={'download'} align='center' textButtonClassName={PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_TITLE_CARD}/>
                    </section>

                    <section>
                        <div className={classNames(pageStyles.subsection, 'center', 'only-on-desktop')}>
                            <h2>
                                Mito simplifies Python for Finance
                            </h2>
                        </div>
                        <div className={classNames(pageStyles.subsection, trifoldStyles.container)}>
                            <div className={classNames(pageStyles.subsection_column)}>
                                <div className={classNames(trifoldStyles.image_container, 'margin-top-8rem-mobile-only')}>
                                    <Image src={'/mito_generated_code.png'} alt='Large Data' width={1000} height={500}/>
                                </div>
                                <h3>
                                    A software solution for adopting Python and Pandas
                                </h3>
                                <p>
                                    Writing Python code using Mito is 10x easier than trying to learn Python from scratch.
                                </p> 
                                <p>
                                    Python trainings are too abstract and don&apos;t deliver business value.
                                </p>    
                                <p>
                                    Mito lets analysts leverage their years of Excel mastery to write Python code. Take the same approach to report generation that you&apos;ve done in Excel for the past 10 years and generate a fully reusable script so you never have to build the same month-end report again.
                                </p>
                            </div>
                            <div className={classNames(pageStyles.subsection_column)}>
                                <div className={classNames(trifoldStyles.image_container, 'margin-top-8rem-mobile-only')}>
                                    <Image src={'/loans_pivot_table.png'} alt='Custom Import' width={1000} height={500}/>
                                </div>
                                <h3>
                                    Save hours a week with no-code spreadsheet automation
                                </h3>
                                <p>
                                    Automating spreadsheet processes saves analysts hours a week from mundane, repetitive report generation. 
                                </p>
                                <p>
                                    Speeding up report generation not only lets analysts work on higher priority work, it also means that reports can be updated frequently so you&apos;re always working with the most up to date data.
                                </p>
                                <p>
                                    See how the Director of Finance at Enigma saved himself 16 hours per month <a className={classNames('margin-0', pageStyles.link)} href="https://trymito.io/blog/enigma-case-study/" rel="noopener" target='_blank'>using Mito</a>.
                                </p>
                            </div>
                            <div className={classNames(pageStyles.subsection_column)}>
                                <div className={classNames(trifoldStyles.image_container, 'margin-top-8rem-mobile-only')}>
                                    <Image src={'/ides.png'} alt='Mito Generated Code' width={1000} height={500}/>
                                </div>
                                <h3>
                                    Add a spreadsheet to your existing Python infrastructure
                                </h3>
                                <p>
                                    Mito lives inside Jupyter and Streamlit, the infrastructure that your organization already has set up. Adopting Mito doesn&apos;t require months of collaboration with IT or compliance.  
                                </p>
                                <p>
                                    Compliance teams love Mito because the code is fully visible. 
                                </p>
                                <p>
                                    IT teams love Mito because it generates Python code that they already have infrastructure to manage.
                                </p>
                                <p>
                                    Managers love Mito because it reduces key person risk.
                                </p>
                                <p className={pageStyles.link}>
                                    <Link href="/data-app" >
                                        Learn more about Mito in Streamlit →
                                    </Link>
                                </p>
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
                                    <Image className={securityStyles.icon} src={ReconIcon} alt='icon'></Image>
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
                                    <Image className={securityStyles.icon} src={ReportIcon} alt='icon'></Image>
                                </div>
                                <h3>
                                    Reporting
                                </h3>
                                <p>
                                    Ad-hoc Excel reports built for management are never one and done. 
                                    You&apos;ll continusouly update the report with the most recent data, taking hours or days per month.
                                </p>
                                <p>
                                    Updating your report in Mito is as easy as clicking “Run All”. 
                                    It will pull the most up to date data, refresh your analysis, and create the updated Excel file. 
                                </p>
                                <p>
                                    Refreshing a report that quickly means you never need to deliver out of date data. 
                                    Mito-generated Python scripts can be used to build a report 10 minutes before a meeting with the most up to date data, 
                                    instead of staying up late building a report the night before.  
                                </p>
                            </div>
                        </div>
                        <div className={pageStyles.subsection}>
                            <div className={securityStyles.security_bullet_container}>
                                <div className={securityStyles.icon}>
                                    <Image  src={ComputerIcon} alt='icon'></Image>
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
                                    To get the most out of your large data, the subject matter expert needs to be the one analyzing it. 
                                    Not a supporting data scientist who isn&apos;t using the data to make business decisions.
                                </p>
                            </div>
                            <div className={pageStyles.subsection_second_element_mobile_spacing}>
                                <div className={securityStyles.icon}>
                                    <Image className={securityStyles.icon} src={ExcelIcon} alt='icon'></Image>
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
                                    No more end-of-life care for your Excel files. 
                                    Let your team focus on decision making.
                                </p>
                            </div>
                        </div>
                    </section>
                    <section>
                        <div className={pageStyles.subsection}>
                            <h2 className='center'>
                                Mito makes it easy to train your team to use Python
                            </h2>
                        </div>
                        <div className={pageStyles.subsection}>
                            <div className={classNames(textImageSplitStyles.functionality_text)}>
                                <p> 
                                    The key to teaching analysts to program is having them learn while building Python scripts that are actually going to be valuable to them. 
                                </p>
                                <p>
                                    Mito lets analysts start building Python spreadsheet automations from day one. Its the difference between starting day one of training with “Hello World” and a data reconciliation.
                                </p>
                                <p>
                                    <i>“We&apos;ve trained thousands of analysts to use Mito. Mito is now half of our Python bootcamp.”</i>
                                </p>
                                <p className='margin-left-1rem'>
                                    - Chief Data Architect @ Bulge Bracket Bank
                                </p>
                            </div>
                            <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin)}>
                                <Image src={'/mito_training.png'} alt='Edit data using Mito AI' width={443} height={327} layout='responsive'/>
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
    );
}

export default Security