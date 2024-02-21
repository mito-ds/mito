import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Footer from '../components/Footer/Footer';
import Header from '../components/Header/Header';
import pageStyles from '../styles/Page.module.css';
import textImageSplitStyles from '../styles/TextImageSplit.module.css'
import titleStyles from '../styles/Title.module.css';
import homeStyles from '../styles/Home.module.css';
import dataAppStyles from '../styles/DataApp.module.css';

// Import Icons & Background Grid

import { classNames } from '../utils/classNames';
import StreamlitAppGallery, { DATA_VERIFICATION_STREAMLIT_APP_LINK } from '../components/StreamlitAppGallery/StreamlitAppGallery';
import CTAButtons from '../components/CTAButtons/CTAButtons';
import DashboardCTACard from '../components/CTACards/DashboardCTACard';
import { PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_TITLE_CARD } from '../utils/plausible';

const DataApp: NextPage = () => {

  return (
    <>
      <Head>
        <title>Deploy the Mitosheet as a Data App in Streamlit | Mito</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Mito is a streamlit spreadsheet component that enables no-code spreadsheet automation with Pandas code generation from within a streamlit app. | Mito" />
      </Head>
      
      <Header/>
    
      <div className={pageStyles.container}>

        <main className={pageStyles.main}>

            <section className={classNames(titleStyles.title_card)}>
                <h1 className={titleStyles.title}>
                    Turn Python scripts into Data Apps
                </h1>
                <p className={titleStyles.description}>
                    Convert one hour of automation savings into tens of hours by sharing automation scripts through Streamlit dashboards.
                </p>
                <div className={homeStyles.cta_button_and_video_spacer}>
                    <CTAButtons variant='download' align='center' displaySecondaryCTA={false} textButtonClassName={PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_TITLE_CARD}/>
                </div>
                    
                <div id='video'>
                    <video className={homeStyles.video} autoPlay loop disablePictureInPicture playsInline webkit-playsinline="true" muted>
                        <source src={'/data-app/data-verification-app.mp4'} />
                    </video>
                </div>
                <a href={DATA_VERIFICATION_STREAMLIT_APP_LINK} target="_blank" rel="noreferrer" className={pageStyles.link_with_p_tag_margins}>
                    Try this app now →
                </a>
            </section>
            <section className={textImageSplitStyles.text_image_section_container}>
                <div className={pageStyles.subsection}>
                    <div className={textImageSplitStyles.functionality_text}>
                        <h2>
                            From Python script, to <span className='text-highlight'>data app</span>
                        </h2>
                        <p>
                            It only takes one analyst to build a script for an entire team to automate their similar workflows. 
                            Mito-enabled Streamlit dashboards let other users customize existing automation solutions to their data.
                        </p>
                        <p>
                            Sharing automation scripts through Streamlit dashboards turns one hour of automation savings into tens of hours.
                        </p>
                    </div>
                    <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin)}>
                        <Image src={'/data-app/script-to-app.png'} alt='Convert scripts into apps' width={668} height={342} layout='responsive'/>
                    </div>
                </div>
                <div className={pageStyles.subsection}>
                    <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin, 'only-on-desktop-inline-block')}>
                        <Image src={'/explore_data_visually.png'} alt='Explore data with Mito' width={500} height={250} layout='responsive'/>
                    </div>
                    <div className={textImageSplitStyles.functionality_text}>
                        <h2>
                            Make your data explorable to non-technical users
                        </h2>
                        <p> 
                            Finding the right dataset can be hard even for data scientists. 
                        </p>
                        <p>
                            Connect your Streamlit app to your data and let users self-serve their data exploration without writing any code. 
                        </p>
                    </div>
                    <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin, 'only-on-mobile-block')}>
                        <Image src={'/explore_data_visually.png'} alt='Explore data with Mito' width={500} height={250} layout='responsive'/>
                    </div>
                </div>
            </section>

            <section>
                <div className={classNames(dataAppStyles.video_wrapper, 'margin-top-4rem')}>
                    <div className={dataAppStyles.video_container}>
                        <iframe 
                        className={dataAppStyles.video}
                        src="https://www.loom.com/embed/ed87167b23ce4529ad7b369b53264709?sid=21b03009-35ef-4b76-8612-f8386297b11d"
                        title="Loom video player" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        allowFullScreen>
                        </iframe>
                    </div>
                </div>
                <div>
                    <p> <a href="mailto:founders@sagacollab.com" className={pageStyles.link}> Contact us </a> for a demo of this app.</p>
                </div>
            </section>

            <section>
                <div className={classNames(pageStyles.subsection, pageStyles.subsection_column, 'center')}>
                    <h2>
                        Mito Streamlit Gallery
                    </h2>
                    <p>
                        Find one you like, then take our code to build your own
                    </p>
                </div>
                <StreamlitAppGallery />
                
            </section>

            <section className={textImageSplitStyles.text_image_section_container}>
                <div className={pageStyles.subsection}>
                    <div className={textImageSplitStyles.functionality_text}>
                        <h2>
                            Build locally, then deploy to your entire team
                        </h2>
                        <p>
                            Analysts build Streamlit apps on their computer, and when the app is useful to their entire team, they can deploy it to a server.
                        </p>
                        <p>
                            Converting a Jupyter Notebook to a Streamlit app is as easy as adding a few lines of code.
                        </p>
                    </div>
                    <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin)}>
                        <Image src={'/data-app/data-cleaning-verification-2.png'} alt='Convert Jupyter Notebooks into Streamlit Apps' width={524} height={366} layout='responsive'/>
                    </div>
                </div>
            </section>

            <section className={pageStyles.background_card}>
                <DashboardCTACard />
            </section>
        </main>
        <Footer />
      </div>
    </>
  )
}

export default DataApp