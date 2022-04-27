import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link';
import Footer from '../components/Footer/Footer';
import Header from '../components/Header/Header';
import securityStyles from '../styles/Security.module.css'
import pageStyles from '../styles/Page.module.css'
import titleStyles from '../styles/Title.module.css'
import homeStyles from '../styles/Home.module.css'
import teamsStyles from '../styles/Teams.module.css'

// Import Icons & Background Grid
import JupyterIcon from '../public/icon-squares/JupyterIcon.svg'
import SupportIcon from '../public/icon-squares/SupportIcon.svg'
import DocsIcon from '../public/icon-squares/DocsIcon.svg'
import PrivateIcon from '../public/icon-squares/PrivateIcon.svg'
import CTAButtons from '../components/CTAButtons/CTAButtons';
import ContactCTACard from '../components/CTACards/ContactCTACard';

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
                    Embrace Python by leveraging your team’s Excel mastery
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
                            <b className='text-primary'>Spreadsheet-first teams </b> use Mito to transition to Python while preserving 
                            the spreadsheet interface that we all know and love. 
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
                            Mito is compatible with Jupyter Hub, Jupyter Lab, and Jupyter Notebooks, so you don’t need to manage any new infrastructure.  
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
                            With the Mito Pro and Enterprise plans, not a single message is sent back to Mito. Mito is designed from the ground up with security at its core. 
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
                            Great documentation is a must even for the most intutive tools. Mito’s docs are easily consumable, so your users can get started without any training.  
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
                            The founders of Mito are around to help train, debug, or ideate on new features 24/7. 
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
                <div className={pageStyles.subsection + ' flex-row-desktop-only'}>
                    <div className='flex-column'>
                        <h2>
                            Before Adopting Mito
                        </h2>
                        <p className={teamsStyles.handwritten_font}>
                            Monday Morning
                        </p>
                        <p>
                            Used template SQL queries to create Pandas dataframes.
                        </p>
                        <p className={teamsStyles.handwritten_font}>
                            Monday Afternoon
                        </p>
                        <p>
                            After a morning of attempting to merge the dataframes together, scheduled time on supporting data scientist’s calendar for help. 
                        </p>
                        <p className={teamsStyles.handwritten_font}>
                            Wednesday Afternoon
                        </p>
                        <p>
                            Got stuck creating a pivot table in Pandas. <b className='text-primary'>Gave up and reverted to Excel</b>.
                        </p>
                        <p>
                            Sent the Excel file to manager for her review. Don’t ever want to write Python code again. 
                        </p>
                    </div>
                    <div className='flex-column margin-top-2rem-mobile-only'>
                        <h2>
                            After Adopting Mito
                        </h2>
                        <p className={teamsStyles.handwritten_font}>
                            Monday Morning
                        </p>
                        <p>
                            Used template SQL queries to create Pandas dataframes. 
                        </p>
                        <p>
                            Used <b className='text-primary'>Mito’s intuitive point and click interface</b> to merge the dataframes together and create a pivot table. It was just like Excel!
                        </p>
                        <p>
                            Downloaded the Mito Spreadsheet as an Excel file and sent to manager for her reivew.
                        </p>
                    </div>
                </div>
            </section>

            <section>
                <div className={pageStyles.subsection + ' ' + pageStyles.subsection_column + ' center'}>
                    <h1>
                        Use Mito to clean, analyze, and chart data
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
                        <div className='margin-top-2rem'>
                            <h1>Write cleaner code <br /> <span className='text-highlight'> faster </span></h1>
                        </div>
                        <p>
                            Mito generates clean, auto-documented Python code for each edit. No more untangling Excel sheets or wading through sh**y code.
                        </p>
                    </div>
                    <div className='margin-top-2rem-mobile-only'>
                        <div>
                            <Image src={'/presentationReadyGraphs.png'} alt='Explore your data with Mito' width={500} height={250} layout='responsive'/>
                        </div>
                        <div className='margin-top-2rem'>
                            <h1>Create <span className='text-highlight'>presentation ready</span> charts</h1>
                        </div>
                        <p>
                            Mito creates beautiful, interactive Plotly charts that are ready to be shared with colleagues and clients. And of course, Mito generates the Plotly code so you have full customizability.
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

export default Teams