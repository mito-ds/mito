import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '../components/Footer/Footer';
import Header from '../components/Header/Header';
import pageStyles from '../styles/Page.module.css';
import textImageSplitStyles from '../styles/TextImageSplit.module.css'
import titleStyles from '../styles/Title.module.css';
import dashboardStyles from '../styles/Dashboard.module.css';

// Import Icons & Background Grid
import DownloadCTACard from '../components/CTACards/DownloadCTACard';

import { classNames } from '../utils/classNames';
import StreamlitAppCard from '../components/StreamlitAppCard/StreamlitAppCard';

const Dashboard: NextPage = () => {

  return (
    <>
      <Head>
        <title>Python Spreadsheet in Streamlit Dashboard | Mito </title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Mito is a streamlit spreadsheet component that enables no-code spreadsheet automation with Pandas code generation from within a streamlit dashboard. | Mito" />
      </Head>
      
      <Header/>
    
      <div className={pageStyles.container}>

        <main className={pageStyles.main}>

            <section className={classNames(titleStyles.title_card, titleStyles.grid_card)}>
                <h1 className={titleStyles.title}>
                    Turn Python scripts into interactive Streamlit Dashboards
                </h1>
                <p className={titleStyles.description}>
                You don&apos;t have to worry about our data storage practices, because we never see anything private.
                </p>
            </section>
            <section className={textImageSplitStyles.text_image_section_container}>
                <div className={pageStyles.subsection}>
                    <div className={textImageSplitStyles.functionality_text}>
                        <h1>
                            From automation script, to <span className='text-highlight'>automation app</span>
                        </h1>
                        <p>
                            It only takes one data analyst to build a Python script for an entire team to automate their similar workflows. 
                            Mito-enabled Streamlit dashboards give end users the ability to customize existing automation solutions to their data.
                        </p>
                        <p>
                            Sharing automation scripts through Streamlit dashboards turns one hour of automation savings into tens of hours.
                        </p>
                    </div>
                    <div className={classNames(textImageSplitStyles.functionality_media)}>
                        <Image src={'/code_snippet.png'} alt='Mito generated code!' width={500} height={250} layout='responsive'/>
                    </div>
                </div>
                <div className={pageStyles.subsection}>
                    <div className={textImageSplitStyles.functionality_text}>
                        <h1>
                            Make your data explorable to non-technical users
                        </h1>
                        <p> 
                            Setting up database connections is confusing even to engineers. 
                        </p>
                        <p>
                            Connect your Streamlit app to your data and let users self-serve their data exploration without writing any code. 
                        </p>
                    </div>
                    <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin)}>
                        <Image src={'/explore_data_visually.png'} alt='Explore data with Mito' width={500} height={250} layout='responsive'/>
                    </div>
                </div>
            </section>

            <section>
                <div className={classNames(pageStyles.subsection, pageStyles.subsection_column, 'center')}>
                    <h2>
                        Mito Streamlit Gallery
                    </h2>
                    <p>
                        Find one you like, then use it to build your own
                    </p>
                </div>
                <div className={dashboardStyles.streamlit_gallery_row}>
                    <StreamlitAppCard 
                        title={'Snowflake Data Explorer'} 
                        description={'Import and explore data from Snowflake'} 
                        imageSrc={'/mito-in-streamlit.png'} 
                        href={''} 
                        tags={['Snowflake']}
                    />
                    <StreamlitAppCard 
                        title={'Snowflake Data Explorer'} 
                        description={'Import and explore data from Snowflake'} 
                        imageSrc={'/mito-in-streamlit.png'} 
                        href={''} 
                        tags={['Finance', 'Recon']}
                    />
                    <StreamlitAppCard 
                        title={'Snowflake Data Explorer'} 
                        description={'Import and explore data from Snowflake'} 
                        imageSrc={'/mito-in-streamlit.png'} 
                        href={''} 
                        tags={['Snowflake']}
                    />
                </div>
                <div className={dashboardStyles.streamlit_gallery_row}>
                    <StreamlitAppCard 
                        title={'Snowflake Data Explorer'} 
                        description={'Import and explore data from Snowflake'} 
                        imageSrc={'/mito-in-streamlit.png'} 
                        href={''} 
                        tags={['Snowflake']}
                    />
                    <StreamlitAppCard 
                        title={'Snowflake Data Explorer'} 
                        description={'Import and explore data from Snowflake'} 
                        imageSrc={'/mito-in-streamlit.png'} 
                        href={''} 
                        tags={['Snowflake']}
                    />
                    <StreamlitAppCard 
                        title={'Snowflake Data Explorer'} 
                        description={'Import and explore data from Snowflake'} 
                        imageSrc={'/mito-in-streamlit.png'} 
                        href={''} 
                        tags={['Snowflake']}
                    />
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

export default Dashboard