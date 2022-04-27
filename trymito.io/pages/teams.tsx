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

// Import Icons & Background Grid
import JupyterIcon from '../public/icon-squares/JupyterIcon.svg'
import SupportIcon from '../public/icon-squares/SupportIcon.svg'
import DocsIcon from '../public/icon-squares/DocsIcon.svg'
import PrivateIcon from '../public/icon-squares/PrivateIcon.svg'
import CTACard from '../components/CTACard/CTACard';
import CTAButtons from '../components/CTAButtons/CTAButtons';

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
                    Proliferate Python by leveraging your team’s Excel mastery
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
                            Spreadsheet based teams use Mito to transition to Python while preserving 
                            the spreadsheet interface that we all know and love.
                        </p>
                        <p> 
                            Python based teams use Mito to write code faster without spending time searching Google or Stack Overflow.
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
                        <h1>
                            Before Adopting Mito
                        </h1>
                        <p>
                            Monday Morning
                        </p>
                        <p>
                            Used template SQL queries to create Pandas dataframes.
                        </p>
                        <p>
                            Monday Afternoon
                        </p>
                        <p>
                            After a morning of attempting to merge the dataframes together, scheduled time on supporting data scientist’s calendar for help. 
                        </p>
                        <p>
                            Wednesday Afternnon
                        </p>
                        <p>
                            Got stuck creating a pivot table in Pandas. Gave up and created the analysis in Excel.
                        </p>
                        <p>
                            Sent the Excel file to manager for her review. Don’t ever want to write Python code again. 
                        </p>
                    </div>
                    <div className='flex-column margin-top-30px-mobile-only'>
                        <h1>
                            After Adopting Mito
                        </h1>
                        <p>
                            Monday Morning
                        </p>
                        <p>
                            Used template SQL queries to create Pandas dataframes. 
                        </p>
                        <p>
                            Used Mito’s intuitive point and click interface to merge the dataframes together and create a pivot table. It was just like Excel!
                        </p>
                        <p>
                            Downloaded the Mito Spreadsheet as an Excel file and sent to manager for her reivew.
                        </p>
                    </div>
                </div>

            </section>

          <section className={pageStyles.background_card}>
            <CTACard />
          </section>
        </main>
        <Footer />
      </div>
    </>
  )
}

export default Teams