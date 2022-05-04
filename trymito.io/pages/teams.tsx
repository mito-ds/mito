import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import Footer from '../components/Footer/Footer';
import Header from '../components/Header/Header';
import securityStyles from '../styles/Security.module.css'
import pageStyles from '../styles/Page.module.css'
import titleStyles from '../styles/Title.module.css'
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
import calendarDayStyles from '../components/CalendarDay/CalendarDay.module.css';


const Teams: NextPage = () => {

  return (
    <>
      <Head>
        <title>Mito | Teams </title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <Header/>
    
      <div className={pageStyles.container}>

        <main className={pageStyles.main}>

            <section className={titleStyles.title_card + ' ' + titleStyles.grid_card}>
                <h1 className={titleStyles.title}>
                    Transition to Python by leveraging your team's spreadsheet mastery
                </h1>
                <p className={titleStyles.description}>
                    Onboard your team to Mito in minutes
                </p>
                <div className={homeStyles.cta_button_and_video_spacer}>
                    <CTAButtons variant='contact' />
                </div>
            </section>
            <section>
                <div className={pageStyles.subsection}>
                    <div className={homeStyles.functionality_text}>
                        <p>
                            <b className='text-primary'>Spreadsheet-first teams </b> use Mito to write Python from the spreadsheet interface they know and love.
                        </p>
                        <p> 
                            <b className='text-primary'>Python-first teams </b> use Mito to write code faster without spending time searching Google or Stack Overflow.
                        </p>
                        <a href="mailto:founders@sagacollab.com" className={pageStyles.link_with_p_tag_margins}>
                            Contact the Mito team →
                        </a>
                    </div>
                    <div className={homeStyles.functionality_media}>
                        <Image src={'/explore.png'} alt='Explore your data with Mito' width={500} height={250} layout='responsive'/>
                    </div>
                </div>
            </section>
            <section>
                <div className={pageStyles.subsection + ' center'}>
                    <h1>
                        Deploy Mito in Jupyter in minutes
                    </h1>
                </div>
                <div className={pageStyles.subsection}>
                    <div className={securityStyles.security_bullet_container}>
                        <div className={securityStyles.icon}>
                            <Image className={securityStyles.icon} src={JupyterIcon} alt='icon'></Image>
                        </div>
                        <h1>
                            Jupyter <br/> Compatible
                        </h1>
                        <p>
                            Mito is compatible with JupyterHub, JupyterLab, and Jupyter Notebooks, so you don’t need to manage any new infrastructure.  
                        </p>
                    </div>
                    <div className={securityStyles.security_bullet_container + ' ' + pageStyles.subsection_second_element_mobile_spacing}>
                        <div className={securityStyles.icon}>
                            <Image className={securityStyles.icon} src={PrivateIcon} alt='icon'></Image>
                        </div>
                        <h1>
                            Completely <br/> Private
                        </h1>
                        <p>
                            The Mito Pro and Enterprise plans are totally local. No data leaves your computer, ever. Mito is designed for your security first. 
                        </p>
                    </div>
                </div>
                <div className={pageStyles.subsection}>
                    <div className={securityStyles.security_bullet_container}>
                        <div className={securityStyles.icon}>
                            <Image className={securityStyles.icon} src={DocsIcon} alt='icon'></Image>
                        </div>
                        <h1>
                            Practical <br/> Documentation
                        </h1>
                        <p>
                            Our documentation is best-in-class, so you can get started without complex trainings.
                        </p>
                    </div>
                    <div className={securityStyles.security_bullet_container + ' ' + pageStyles.subsection_second_element_mobile_spacing}>
                        <div className={securityStyles.icon}>
                            <Image className={securityStyles.icon} src={SupportIcon} alt='icon'></Image>
                        </div>
                        <h1>
                            Personal <br/> Support
                        </h1>
                        <p>
                            The Mito team is around to help train, debug, or ideate on new features. 
                        </p>
                    </div>
                </div>
            </section>

            <section>
                <div className={pageStyles.subsection + ' ' + pageStyles.subsection_column + ' center'}>
                    <h1>
                        Make your team Python Self-Sufficient
                    </h1>
                    <p className='display-desktop-only-inline-block'>
                        Leverage your team’s Excel expertise to make them Python self-sufficient. <br /> 
                        Don’t throw away years of Excel skill building.
                    </p>
                </div>
                <h2 className='margin-top-3rem margin-bottom-3rem'>
                    Python Before Mito
                </h2>
                <div className={pageStyles.subsection + ' flex-row-desktop-only'}>
                    <CalendarDay> 
                        <div>
                            <h2>Mon</h2>
                        </div>
                        <p> Searched StackOverflow for code to read and pivot data. </p>
                    </CalendarDay>
                    <CalendarDay> 
                        <h2>Tue</h2>
                        <p> Booked time with supporting data scientist to get help. </p>
                    </CalendarDay>
                    <CalendarDay> 
                        <h2>Wed</h2>
                        <p> Worked with data scientist to write pivot table in pandas. </p>
                    </CalendarDay>
                    <CalendarDay> 
                        <h2>Thur</h2>
                        <p> Got stuck creating graphs. Gave up and made report in Excel. </p>
                    </CalendarDay>
                </div>
                <h2 className='margin-top-3rem margin-bottom-3rem'>
                    Python After Mito
                </h2>
                <div className={pageStyles.subsection + ' flex-row-desktop-only'}>
                    <CalendarDay> 
                        <h2>Mon</h2>
                        <p> Imported files with a click. Pivoted and graphed my data in the Mito spreadsheet. </p>
                    </CalendarDay>
                </div>

            </section>

            <section>
                <div className={pageStyles.subsection + ' ' + pageStyles.subsection_column + ' center'}>
                    <h1>
                        Use Mito to clean, analyze, and graph data
                    </h1>
                    <p className='display-desktop-only-inline-block'>
                        Join other Fortune 500 companies that are writing production-ready Python code with Mito.
                    </p>
                </div>
                <div className={pageStyles.subsection + ' flex-row-desktop-only'}>
                    <div>
                        <div>
                            <Image src={'/cleanCode.png'} alt='Explore your data with Mito' width={500} height={250} layout='responsive'/>
                        </div>
                        <div className='margin-top-3rem'>
                            <h1>Write cleaner code <br /> <span className='text-highlight'> faster </span></h1>
                        </div>
                        <p>
                            Mito generates clean, auto-documented Python code for each edit. No more untangling Excel sheets or wading through sh**y code.
                        </p>
                    </div>
                    <div className='margin-top-3rem-mobile-only'>
                        <div>
                            <Image src={'/presentationReadyGraphs.png'} alt='Explore your data with Mito' width={500} height={250} layout='responsive'/>
                        </div>
                        <div className='margin-top-3rem'>
                            <h1>Create <span className='text-highlight'>presentation ready</span> graphs</h1>
                        </div>
                        <p>
                            Mito creates beautiful, interactive Plotly charts that are ready to be shared with colleagues and clients.
                        </p>
                    </div>
                </div>
                <div className={pageStyles.subsection + ' center'}>
                    <Link href='/mito_pro_roadmap'>
                        <a className={pageStyles.link_with_p_tag_margins}>
                            Checkout the Mito Pro Roadmap to see what&apos;s coming next →
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