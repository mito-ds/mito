/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import type { NextPage } from 'next'
import Image from 'next/image'
import Head from 'next/head'
import Footer from '../components/Footer/Footer';
import Header from '../components/Header/Header';
import homeStyles from '../styles/Home.module.css'
import pageStyles from '../styles/Page.module.css'
import titleStyles from '../styles/Title.module.css'
import textImageSplitStyles from '../styles/TextImageSplit.module.css'
import CTAButtons from '../components/CTAButtons/CTAButtons';
import trifoldStyles from '../styles/Trifold.module.css'
import { classNames } from '../utils/classNames';
import FAQCard from '../components/FAQCard/FAQCard';
import Link from 'next/link';
import ContactCTACard from '../components/CTACards/ContactCTACard';
import { PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_TITLE_CARD } from '../utils/plausible';

const InfrastructureIntegrationPythonTool: NextPage = () => {

  return (
    <>
      <Head>
        <title>Python Infrastructure Integration Tools | Mito</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Mito makes it easy to integrate cloud systems, data sources, custom functions, APIs and more. Connect IT infrastructure at enterprise scale with Mito." />
      </Head>
      
      <Header/>
    
      <div className={pageStyles.container}>

        <main className={pageStyles.main}>
            <section className={classNames(pageStyles.background_card, titleStyles.title_card)}>
                <h1 className={titleStyles.title}>
                    Integrate Mito into your Enterprise Python Infrastructure
                </h1>

                <p className={titleStyles.description}>
                    Let analysts use your Python functions inside of a spreadsheet
                </p>
                    
                <div className={homeStyles.cta_button_and_video_spacer}>
                    <CTAButtons variant='contact' align='center' displaySecondaryCTA={false} textButtonClassName={PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_TITLE_CARD}/>
                </div>
                    
                <div id='video'>
                    <video className={homeStyles.video} autoPlay loop disablePictureInPicture playsInline webkit-playsinline="true" muted>
                        <source src="/custom_imports.mp4" />
                    </video>
                </div>
            </section>

            <section>
                <div className={classNames(pageStyles.subsection, pageStyles.subsection_column, 'center', titleStyles.title)}>
                    <h2>
                        Your team&apos;s Python code shouldn&apos;t sit unused in a GitHub repo. Make Python functions accessible in the Mito spreadsheet.
                    </h2>
                    <p>
                        Analysts that don&apos;t know how to use Python functions, use spreadsheet functions instead.
                    </p>
                </div>
                <div className={classNames(pageStyles.subsection, pageStyles.subsection_justify_baseline)}>
                    <div className={textImageSplitStyles.functionality_text}>
                        <h2>
                            Configurable <span className='text-highlight'>Database Queries</span>
                        </h2>
                        <p> 
                            Expose configurable database imports through the Mito UI. 
                            Mito automatically detects the parameters and generates an intuitive UI for non-technical users. 
                        </p>
                        <p>
                            Once the data is in Mito, analysts can use all of Mito&apos;s transformations to complete their analysis. 
                        </p>
                    </div>
                    <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin)}>
                        <Image src={'/configurable-database-queries.png'} alt='Configurable Database Queries' width={668} height={342} layout='responsive'/>
                    </div>
                </div>
            
                <div className={classNames(pageStyles.subsection, pageStyles.subsection_justify_baseline)}>
                    <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin, 'only-on-desktop-inline-block')}>
                        <Image src={'/custom-spreadsheet-functions.png'} alt='Custom Spreadsheet Functions' width={597} height={280} layout='responsive'/>
                    </div>
                        <div className={textImageSplitStyles.functionality_text}>
                        <h2>
                            Custom <span className='text-highlight'>Spreadsheet Formulas</span> 
                        </h2>
                        <p>
                            Make custom financial calculations and API calls accessible as Mito spreadsheet functions. 
                        </p>
                        <p>
                            Analysts don&apos;t need to search GitHub, read documentation, or even know how to code. 
                            They already know how to use spreadsheets. 
                        </p>
                    </div>
                    <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin, 'only-on-mobile-block')}>
                        <Image src={'/custom-spreadsheet-functions.png'} alt='Custom Spreadsheet Functions' width={597} height={280} layout='responsive'/>
                    </div>
                </div>

                <div className={classNames(pageStyles.subsection, pageStyles.subsection_justify_baseline)}>
                    <div className={textImageSplitStyles.functionality_text}>
                        <h2>
                            Flexible <span className='text-highlight'>Code Snippets</span>
                        </h2>
                        <p> 
                            Send an email, build Enterprise-styled graphs, scan a dataframe for personally identifiable information. 
                        </p>
                        <p>
                            If you can build it in Python, you can make it accessible to your non-technical analysts in Mito. Help your analysts unlock the full power of Python automation.
                        </p>
                    </div>
                    <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin)}>
                        <Image src={'/code-snippets-taskpane.png'} alt='Code Snippets' width={502} height={279} layout='responsive'/>
                    </div>
                </div>

            </section>

            <section>
                <div className={classNames(pageStyles.subsection, 'center')}>
                    <h2>
                        Augment your existing Enterprise Infrastructure 
                    </h2>
                </div>
                <div className={classNames(pageStyles.subsection, trifoldStyles.container)}>
                    <div className={classNames(pageStyles.subsection_column)}>
                        <div className={classNames(trifoldStyles.image_container, 'margin-top-8rem-mobile-only')}>
                            <Image src={'/mito-in-streamlit.png'} alt='Mito in Streamlit' width={1000} height={500}/>
                        </div>
                        <h3>
                            Embed Mito in Enterprise Applications
                        </h3>
                        <p>
                            Turn existing dashboards into self-serve data analytics apps.  
                            Add Mito to your Streamlit dashboard, Django app, or other custom enterprise applications.
                        </p> 
                        <p>
                            Let users filter, pivot, and graph data directly in your app.
                        </p>    
                    </div>
                    <div className={classNames(pageStyles.subsection_column)}>
                        <div className={classNames(trifoldStyles.image_container, 'margin-top-8rem-mobile-only')}>
                            <Image src={'/snowflake-query-taskpane.png'} alt='Snowflake Query Taskpane' width={1000} height={500}/>
                        </div>
                        <h3>
                            Connect Mito to your data infrastructure
                        </h3>
                        <p>
                            Pull data from your enterprise database solutions directly into Mito so that analysts can self-serve the most up to date data.
                        </p>
                        <p>
                            Forcing users to write SQL queries to access their data is one of the biggest blockers to data app adoption.
                        </p>
                    </div>
                    <div className={classNames(pageStyles.subsection_column)}>
                        <div className={classNames(trifoldStyles.image_container, 'margin-top-8rem-mobile-only')}>
                            <Image src={'/byo-llm.png'} alt='BYO LLM' width={1000} height={500}/>
                        </div>
                        <h3>
                            Bring your own LLM, be in control of your data
                        </h3>
                        <p>
                            Connecting Mito to your own LLM means that you have complete control over your data, while also giving users a powerful UI for AI report generation.
                        </p>
                        <p>
                            Learn more about <Link href='/python-ai-tools'><a className={pageStyles.link}>Mito AI.</a></Link>
                        </p>
                    </div>
                </div>
            </section>

            <section style={{marginBottom: '60px'}}>
                <h2 className='center'>
                    Frequently Asked Questions
                </h2>
                <FAQCard title='How do I add custom functionality to Mito?'>
                <div>
                    <p>
                        Mito Enterprise admins can configure environment variables that make custom spreadsheet functions, database imports, and code snippets available to all users.
                    </p>
                    <p>
                        Your Mito implementation specialist can help you verify that your custom features are in the correct format and accessible to your users.
                    </p>
                </div>
                </FAQCard>
                <FAQCard title='Where can I embed Mito?'>
                <div>
                    <p>
                        At its core, Mito is a React frontend and Python backend. 
                        That means, you can embed Mito in a large variety of applications.
                        Its easy to add Mito to a Streamlit app, Django app, or any Jupyter-based system. 
                    </p>
                    <p>
                        Have questions? <a href={"mailto:jake@sagacollab.com?subject=Change Plan"} className={pageStyles.link}>Reach out to the Mito Enterprise Integration team</a>. 
                    </p>
                </div>
                </FAQCard>
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

export default InfrastructureIntegrationPythonTool
