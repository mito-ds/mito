/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import Footer from '../components/Footer/Footer';
import Header from '../components/Header/Header';
import iconAndTextCardStyles from '../styles/IconAndTextCard.module.css'
import pageStyles from '../styles/Page.module.css'
import titleStyles from '../styles/Title.module.css'
import textImageSplitStyles from '../styles/TextImageSplit.module.css';
import homeStyles from '../styles/Home.module.css'
import teamsStyles from '../styles/Teams.module.css'
import CTAButtons from '../components/CTAButtons/CTAButtons';
import ContactCTACard from '../components/CTACards/ContactCTACard';

// Import Icons
import JupyterIcon from '../public/icon-squares/JupyterIcon.svg'
import SupportIcon from '../public/icon-squares/SupportIcon.svg'
import DocsIcon from '../public/icon-squares/DocsIcon.svg'
import PrivateIcon from '../public/icon-squares/PrivateIcon.svg'
import Link from 'next/link';
import CalendarDay from '../components/CalendarDay/CalendarDay';
import { PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_TITLE_CARD } from '../utils/plausible';


const Teams: NextPage = () => {

  return (
    <>
      <Head>
        <title>Mito for Teams | Teams </title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Mito empowers teams to easily upskill from Excel to Python, with automation, code-gen and AI-assist features, all in a familiar spreadsheet GUI." />
      </Head>
      
      <Header/>
    
      <div className={pageStyles.container}>

        <main className={pageStyles.main}>

            <section className={titleStyles.title_card + ' ' + titleStyles.grid_card}>
                <h1 className={titleStyles.title}>
                    Leverage your team&apos;s spreadsheet mastery to automate entire workflows
                </h1>
                <p className={titleStyles.description}>
                    Onboard in minutes, save your team days per month
                </p>
                <div className={homeStyles.cta_button_and_video_spacer}>
                    <CTAButtons variant='contact' align='center' textButtonClassName={PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_TITLE_CARD}/>
                </div>
            </section>
            <section style={{marginTop: '4rem'}}>
                <div className={pageStyles.subsection}>
                    <div className={textImageSplitStyles.functionality_text}>
                        <p>
                            <b className='text-primary'>Spreadsheet-first teams </b> use Mito to write Python code using the spreadsheet interface they know and love.
                        </p>
                        <p>
                            <b className='text-primary'>No new skills required </b> to automate your entire spreadsheet, from data ingestion to transformation to presentation.
                        </p>
                        <a href="mailto:founders@sagacollab.com" className={pageStyles.link_with_p_tag_margins}>
                            Contact the Mito team →
                        </a>
                    </div>
                    <div className={textImageSplitStyles.functionality_media}>
                        <Image src={'/explore.png'} alt='Explore your data with Mito' width={500} height={250} layout='responsive'/>
                    </div>
                </div>
            </section>
            <section>
                <div className={pageStyles.subsection + ' center'}>
                    <h2>
                        Deploy Mito in Jupyter in minutes
                    </h2>
                </div>
                <div className={pageStyles.subsection}>
                    <div className={iconAndTextCardStyles.icon_and_text_card}>
                        <div className={iconAndTextCardStyles.icon}>
                            <Image className={iconAndTextCardStyles.icon} src={JupyterIcon} alt='icon'></Image>
                        </div>
                        <h2>
                            Jupyter <br/> Compatible
                        </h2>
                        <p>
                            Mito is compatible with JupyterHub, JupyterLab, and Jupyter Notebooks, so you don’t need to manage any new infrastructure.  
                        </p>
                    </div>
                    <div className={iconAndTextCardStyles.icon_and_text_card + ' ' + pageStyles.subsection_second_element_mobile_spacing}>
                        <div className={iconAndTextCardStyles.icon}>
                            <Image className={iconAndTextCardStyles.icon} src={PrivateIcon} alt='icon'></Image>
                        </div>
                        <h2>
                            Completely <br/> Private
                        </h2>
                        <p>
                            The Mito Pro and Enterprise plans are totally local. No data leaves your computer, ever. Mito is designed for your security first. 
                        </p>
                    </div>
                </div>
                <div className={pageStyles.subsection}>
                    <div className={iconAndTextCardStyles.icon_and_text_card}>
                        <div className={iconAndTextCardStyles.icon}>
                            <Image className={iconAndTextCardStyles.icon} src={DocsIcon} alt='icon'></Image>
                        </div>
                        <h2>
                            Practical <br/> Documentation
                        </h2>
                        <p>
                            Our documentation is best-in-class, so you can get started without complex trainings.
                        </p>
                    </div>
                    <div className={iconAndTextCardStyles.icon_and_text_card + ' ' + pageStyles.subsection_second_element_mobile_spacing}>
                        <div className={iconAndTextCardStyles.icon}>
                            <Image className={iconAndTextCardStyles.icon} src={SupportIcon} alt='icon'></Image>
                        </div>
                        <h2>
                            Personal <br/> Support
                        </h2>
                        <p>
                            The Mito team is around to help train, debug, or ideate on new features. 
                        </p>
                    </div>
                </div>
            </section>

            <section>
                <div className={pageStyles.subsection + ' ' + pageStyles.subsection_column + ' center'}>
                    <h2>
                        Make your team Python self-sufficient
                    </h2>
                    <p className='only-on-desktop-inline-block'>
                        Leverage your team&apos;s Excel expertise to make them Python self-sufficient. <br /> 
                        Don&apos;t throw away years of Excel skill building.
                    </p>
                </div>
                <h2 className='margin-top-4rem margin-bottom-2rem'>
                    Automation Before Mito
                </h2>
                <div className={pageStyles.subsection + ' ' + teamsStyles.calendar_section + ' flex-row-desktop-only'}>
                    <CalendarDay> 
                        <h2>Mon</h2>
                        <p> Searched Stack Overflow for Python code to read in Excel file and create pivot table. </p>
                    </CalendarDay>
                    <CalendarDay> 
                        <h2>Tues</h2>
                        <p> Worked with supporting data scientist to write pivot table in pandas. </p>
                    </CalendarDay>
                    <CalendarDay> 
                        <h2>Wed</h2>
                        <p> Tried to make a graph. Got lost in the Matplotlib documentation. </p>
                    </CalendarDay>
                    <CalendarDay> 
                        <h2>Thur</h2>
                        <p> Gave up on Python. Went back to Excel.</p>
                    </CalendarDay>
                </div>
                <h2 className='margin-top-4rem margin-bottom-2rem'>
                    Python After Mito
                </h2>
                <div className={pageStyles.subsection + ' flex-row-desktop-only'}>
                    <CalendarDay> 
                        <h2>Mon</h2>
                        <p> Used Mito to import, pivot and graph data in a few clicks. </p>
                    </CalendarDay>
                </div>

            </section>

            <section>
                <div className={pageStyles.subsection + ' ' + pageStyles.subsection_column + ' center'}>
                    <h2>
                        Use Mito to clean, analyze, and graph data
                    </h2>
                    <p className='only-on-desktop-inline-block'>
                        Join other Fortune 500 companies that are writing production-ready Python code with Mito.
                    </p>
                </div>
                <div className={pageStyles.subsection + ' flex-row-desktop-only'}>
                    <div>
                        <div>
                            <Image src={'/cleanCode.png'} alt='Explore your data with Mito' width={500} height={250} layout='responsive'/>
                        </div>
                        <div className='margin-top-3rem'>
                            <h2>Write cleaner code <br /> <span className='text-highlight'> faster </span></h2>
                        </div>
                        <p>
                            Mito generates clean, auto-documented Python code for each edit. No more untangling Excel sheets or wading through spaghetti code.
                        </p>
                    </div>
                    <div className='margin-top-3rem-mobile-only'>
                        <div>
                            <Image src={'/presentationReadyGraphs.png'} alt='Explore your data with Mito' width={500} height={250} layout='responsive'/>
                        </div>
                        <div className='margin-top-3rem'>
                            <h2>Create <span className='text-highlight'>presentation ready</span> graphs</h2>
                        </div>
                        <p>
                            Mito creates beautiful, interactive Plotly charts that are ready to be shared with colleagues and clients.
                        </p>
                    </div>
                </div>
                <div className={pageStyles.subsection + ' center'} style={{marginTop: '2rem'}}>
                    <Link href='/plans#mito_pro_roadmap'>
                        <a className={pageStyles.link_with_p_tag_margins}>
                            Checkout the Mito Pro roadmap →
                        </a>
                    </Link>
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

export default Teams