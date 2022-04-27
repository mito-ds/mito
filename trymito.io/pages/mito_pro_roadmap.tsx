import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import Footer from '../components/Footer/Footer';
import Header from '../components/Header/Header';
import securityStyles from '../styles/Security.module.css'
import pageStyles from '../styles/Page.module.css'
import titleStyles from '../styles/Title.module.css'
import GithubButton from '../components/GithubButton/GithubButton';
import DownloadCTACard from '../components/CTACards/DownloadCTACard';

import FlagIcon from '../public/icon-squares/FlagIcon.svg'


const Mito_Pro_Roadmap: NextPage = () => {

  return (
    <>
      <Head>
        <title>Mito | Roadmap </title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <Header/>
    
      <div className={pageStyles.container}>

        <main className={pageStyles.main}>

            <section className={titleStyles.title_card + ' ' + titleStyles.grid_card}>
                <h1 className={titleStyles.title}>
                    Mito Pro Roadmap 
                </h1>
                <p className={titleStyles.description}>
                    We&apos;re constantly releasing new features to speed up your data analysis
                </p>
            </section>
            <section>
                <div className={pageStyles.subsection}>
                    <div className={securityStyles.security_bullet_container}>
                        <div className={securityStyles.icon}>
                            <Image className={securityStyles.icon} src={FlagIcon} alt='icon'></Image>
                        </div>
                        <h1>
                            Shareable <br/> notebooks
                        </h1>
                        <p>
                            Share notebooks with Mito embedded in them and let colleagues use the Mito Spreadsheet too.  
                        </p>
                    </div>
                    <div className={securityStyles.security_bullet_container + ' ' + pageStyles.subsection_second_element_mobile_spacing}>
                        <div className={securityStyles.icon}>
                            <Image className={securityStyles.icon} src={FlagIcon} alt='icon'></Image>
                        </div>
                        <h1>
                            Advanced <br/> analysis
                        </h1>
                        <p>
                            Go beyond basic data cleaning and analysis features with support for regressions, fuzzy matching and clustering. 
                        </p>
                    </div>
                </div>
                <div className={pageStyles.subsection}>
                    <div className={securityStyles.security_bullet_container}>
                        <div className={securityStyles.icon}>
                            <Image className={securityStyles.icon} src={FlagIcon} alt='icon'></Image>
                        </div>
                        <h1>
                            Custom steps and functions
                        </h1>
                        <p>
                            Import custom python snippets to use within the Mito Spreadsheet and add completely new step types to the Mito Toolbar.  
                        </p>
                    </div>
                    <div className={securityStyles.security_bullet_container + ' ' + pageStyles.subsection_second_element_mobile_spacing}>
                        <div className={securityStyles.icon}>
                            <Image className={securityStyles.icon} src={FlagIcon} alt='icon'></Image>
                        </div>
                        <h1>
                            Graph <br/> styling
                        </h1>
                        <p>
                            Create presentation-ready graphs with full control of colors, ability to save graph templates, and more. 
                        </p>
                    </div>
                </div>
                <div className={pageStyles.subsection}>
                    <div className={securityStyles.security_bullet_container}>
                        <div className={securityStyles.icon}>
                            <Image className={securityStyles.icon} src={FlagIcon} alt='icon'></Image>
                        </div>
                        <h1>
                        Connect to any data source
                        </h1>
                        <p>
                            Connect to databases and remote file systems so users can import any data set  without having to write custom pandas code.   
                        </p>
                    </div>
                    <div className={securityStyles.security_bullet_container + ' ' + pageStyles.subsection_second_element_mobile_spacing}>
                        <div className={securityStyles.icon}>
                            <Image className={securityStyles.icon} src={FlagIcon} alt='icon'></Image>
                        </div>
                        <h1>
                            Feature <br/> settings
                        </h1>
                        <p>
                            Customize Mito by turning on/off code optimization, code documentation, seleting between light and dark mode, and more. 
                        </p>
                    </div>
                </div>
                <div className={pageStyles.subsection}>
                    <div className={securityStyles.security_bullet_container}>
                        <div className={securityStyles.icon}>
                            <Image className={securityStyles.icon} src={FlagIcon} alt='icon'></Image>
                        </div>
                        <h1>
                            Advanced <br/> formatting
                        </h1>
                        <p>
                            Utilize Excel-like formatting and conditional formatting your analysis stand out. And generate Python code for all of it.   
                        </p>
                    </div>
                    <div className={securityStyles.security_bullet_container + ' ' + pageStyles.subsection_second_element_mobile_spacing}>
                        <div className={securityStyles.icon}>
                            <Image className={securityStyles.icon} src={FlagIcon} alt='icon'></Image>
                        </div>
                        <h1>
                            Keyboard <br/> shortcuts
                        </h1>
                        <p>
                            Navigate Mito without ever using your 🐁. 
                        </p>
                    </div>
                </div>
            </section>
            <section>
                <h1>
                    Have a new feature idea? 💡
                </h1>
                <p>
                    Prioritizing your feedback is the best way we can help you speed up your analysis.
                </p>
                <div className='margin-top-3rem'>
                    <GithubButton variant='Issue' text='Open a GitHub issue'/>
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

export default Mito_Pro_Roadmap