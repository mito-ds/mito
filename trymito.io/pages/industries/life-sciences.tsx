import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '../../components/Footer/Footer';
import Header from '../../components/Header/Header';
import pageStyles from '../../styles/Page.module.css';
import pythonAIToolsStyles from '../../styles/PythonAITools.module.css';
import trifoldStyles from '../../styles/Trifold.module.css'
import titleStyles from '../../styles/Title.module.css';
import spreadsheetAutomationStyles from '../../styles/SpreadsheetAutomation.module.css';
import textImageSplitStyles from '../../styles/TextImageSplit.module.css';

// Import Icons & Background Grid
import { classNames } from '../../utils/classNames';
import CTAButtons from '../../components/CTAButtons/CTAButtons';
import FAQCard from '../../components/FAQCard/FAQCard';
import ContactCTACard from '../../components/CTACards/ContactCTACard';

const LifeSciences: NextPage = () => {

  return (
    <>
      <Head>
        <title>Best Python Package for Life Sciences and Bioinformatics | Mito</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Mito empowers life science professionals with AI-assisted Python, Pandas and SQL. Accelerate analysis and unlock insights in bioinformatics and healthcare." />
      </Head>
      <Header/>
    
      <div className={pageStyles.container}>

        <main className={pageStyles.main}>
          <section className={classNames(titleStyles.title_card, pageStyles.background_card, spreadsheetAutomationStyles.flex_col_mobile_row_desktop)}>
            <div className={spreadsheetAutomationStyles.title_text_container}>
              <h1>
                Cutting-edge life science professionals deserve cutting-edge Python tools
              </h1>
              <p className={classNames(titleStyles.subtitle)}>
                Intuitive Python automation tools that let you focus on the science.
              </p>
              <CTAButtons variant={'download'} align='left'/>
            </div>
            <div className={classNames(spreadsheetAutomationStyles.hero_video_container)}>
              <video autoPlay loop disablePictureInPicture playsInline webkit-playsinline="true" muted>
                  <source src="/hospital_patient_pivot.mp4" />
              </video>
            </div>
          </section>

          <section className={classNames(pageStyles.background_card, pythonAIToolsStyles.case_study_section)}>
            <div className={classNames(pythonAIToolsStyles.case_study_text_container)}>
                <h2 className={classNames(pythonAIToolsStyles.case_study_text, 'center')}>
                  The Best Python Library for Biology and Life Sciences
                </h2>
                <p className={classNames('center')}>
                  &quot;Mito combines the familiarity of Excel with the power of Python. 
                    I&apos;m able to quickly clean up, explore, and transform large data sets in a way that wouldn&apos;t be possible with Excel. 
                    Mito generates code that is flexible, scalable, and repeatable.  
                    Now, three years later, I can&apos;t imagine tackling my day-to-day work without Mito as one of my tools.&quot;
                </p>
                <p className={classNames('center')}> 
                  — Matthew Blome, Functional Lead @ Cytiva
                </p>
            </div>
            <div>
              <Image src='/MatthewBlomeHeadshot.png' alt='Matthew Blome, Functional Lead @ Cytiva' width={250} height={250} ></Image>
            </div>
          </section>

          <section>
            <div className={classNames(pageStyles.subsection, trifoldStyles.container)}>
              <div className={classNames(pageStyles.subsection_column)}>
                <div className={classNames(trifoldStyles.image_container, 'margin-top-8rem-mobile-only')}>
                  <Image src={'/bugs.png'} alt='Bugs' width={1000} height={500}/>
                </div>
                <h3>
                  Excel is slow, repetitive, and error prone
                </h3>
                <p>
                  Excel wasn&apos;t designed for scientific analyses. 
                  It&apos;s nearly impossible to verify Excel models don&apos;t contain manual mistakes like typos and accidental data manipulation.
                </p> 
                <p>
                  According to an <a href="https://www.nature.com/articles/d41586-021-02211-4" target="_blank" rel="noreferrer" className={pageStyles.link}>article</a> published by Nature, “Despite geneticists being warned about spreadsheet problems, 30% of published papers contain mangled gene names in supplementary data.”
                </p>    
              </div>
              <div className={classNames(pageStyles.subsection_column)}>
                <div className={classNames(trifoldStyles.image_container, 'margin-top-8rem-mobile-only')}>
                  <Image src={'/bio-python-code.png'} alt='Bio Python Code' width={1000} height={500}/>
                </div>
                <h3>
                  Python, Pandas, and SQL are the modern scientist&apos;s stack
                </h3>
                <p>
                  Using Python lets you take advantage of powerful libraries designed specifically for life science research. 
                  Learn cutting-edge machine learning, bioinformatics, and data science techniques to accelerate your research and advance your career.
                </p>
                <p>
                  Writing code for your analyis means you can verify its accuracy once and be confident in all of your future results. 
                </p>
              </div>
              <div className={classNames(pageStyles.subsection_column)}>
                <div className={classNames(trifoldStyles.image_container, 'margin-top-8rem-mobile-only')}>
                  <Image src={'/mito-in-streamlit-pharma.png'} alt='Pharma Dashboard' width={1000} height={500}/>
                </div>
                <h3>
                  Create self-serve dashboards for your lab
                </h3>
                <p>
                  Your entire lab doesn&apos;t need to adopt Python for it to transform the way you work. 
                </p>
                <p>
                  Become the Python early adopter on your team, and use Mito to create self-serve dashboards for common analyses that everyone in your lab can utilize. 
                  The rest of your team won&apos;t need to learn Python to benefit from its power.
                </p>
                <p className={pageStyles.link}>
                  <Link href="/data-app" >
                    Learn more about Mito in Streamlit →
                  </Link>
                </p>
              </div>
            </div>
          </section>

          <section>
            <div className={classNames(pageStyles.subsection, pageStyles.subsection_column, 'center', titleStyles.title)}>
              <h2>
                Mito simplifies Python for Life Sciences
              </h2>
            </div>
            <div className={classNames(pageStyles.subsection, pageStyles.subsection_justify_baseline)}>
              <div className={textImageSplitStyles.functionality_text}>
                <h2>
                  Bioinformatics
                </h2>
                <p> 
                  Use Python libraries specifically designed for bioinformatics research, like <a href="https://biopython.org" target="_blank" rel="noreferrer" className={pageStyles.link}>BioPython</a>, to parse bioinformatics files, perform k Nearest Neighbors classifications, and common operations like translation and transcription. 
                </p>
                <p>
                  Use Mito to visualize and clean your data without bouncing back and forth between Excel and Python.
                  And add functions from BioPython and other libraries directly into Mito.
                </p>
                <p className={pageStyles.link}>
                  <Link href='/infrastructure-integration-python-tool' >
                    Learn more about adding functionality to Mito
                  </Link>
                </p>
              </div>
              <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin)}>
                  <Image src={'/bioinformatics.png'} alt='Mito + BioPython' width={712} height={457} layout='responsive'/>
              </div>
            </div>
        
            <div className={classNames(pageStyles.subsection, pageStyles.subsection_justify_baseline)}>
              <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin, 'display-desktop-only-inline-block')}>
                  <Image src={'/healthcare.png'} alt='Mito for Healthcare' width={627} height={337} layout='responsive'/>
              </div>
                <div className={textImageSplitStyles.functionality_text}>
                <h2>
                  Healthcare and Pharmaceuticals
                </h2>
                <p>
                  Easily build scripts to split datasets by patient or hospital visits, convert dates to the correct format, and filter through complex data.
                </p>
                <p>
                  Build scripts once and reuse them countless times, saving yourself hours per week of data wrangling and error checking. 
                </p>
              </div>
              <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin, 'only-on-mobile-block')}>
                  <Image src={'/healthcare.png'} alt='Mito for Healthcare' width={627} height={337} layout='responsive'/>
              </div>
            </div>

            <div className={classNames(pageStyles.subsection, pageStyles.subsection_justify_baseline)}>
              <div className={textImageSplitStyles.functionality_text}>
                <h2>
                  Computational Biotech
                </h2>
                <p> 
                  Some things are always easier to do in spreadsheet. Create pivot tables and graphs in Mito&apos;s point and click UI to verify that your code is correct.
                </p>
                <p>
                  Use summary statistics to build intuition about your datasets and figure out the next steps in your analysis.
                </p>
              </div>
              <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin)}>
                <Image src={'/computational-biotech.png'} alt='Mito for Computational Biotech' width={707} height={370} layout='responsive'/>
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

export default LifeSciences