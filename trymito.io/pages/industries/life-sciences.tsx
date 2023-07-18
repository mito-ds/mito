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

const PythonAITools: NextPage = () => {

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
                Empower Life Scientists with Python Automation
              </h1>
              <p className={classNames(titleStyles.subtitle)}>
                Intuitive Python automation tools that let you focus on the science.
              </p>
              <CTAButtons variant={'download'} align='left'/>
            </div>
            <div className={classNames(spreadsheetAutomationStyles.video_wrapper, 'margin-top-8rem-mobile-only', 'margin-left-8rem-desktop-only')}>
                <div className={spreadsheetAutomationStyles.video_container}>
                    <iframe 
                        className={spreadsheetAutomationStyles.video}
                        src="https://www.youtube.com/embed/ZX2AtIvYdRE" 
                        title="YouTube video player" 
                        frameBorder={0}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        allowFullScreen
                    /> 
                </div>
            </div>
          </section>

          <section>
            <div className={classNames(pageStyles.subsection, 'center')}>
              <h2>
                Cutting Edge Science Deserves Cutting Edge Analysis Tools 
              </h2>
            </div>
            <div className={classNames(pageStyles.subsection, trifoldStyles.container)}>
              <div className={classNames(pageStyles.subsection_column)}>
                <div className={classNames(trifoldStyles.image_container, 'margin-top-8rem-mobile-only')}>
                  <Image src={'/mito-in-streamlit.png'} alt='Mito in Streamlit' width={1000} height={500}/>
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
                  <Image src={'/snowflake-query-taskpane.png'} alt='Snowflake Query Taskpane' width={1000} height={500}/>
                </div>
                <h3>
                  Python, Pandas, and SQL are the modern analytics stack
                </h3>
                <p>
                  Using Python lets you take advantage of powerful libraries designed specifically for life science research. 
                </p>
                <p>
                  Performing your analysis in code means you can verify the accuracy of your analysis once and be confident it will be accurate for every future analysis. 
                </p>
              </div>
              <div className={classNames(pageStyles.subsection_column)}>
                <div className={classNames(trifoldStyles.image_container, 'margin-top-8rem-mobile-only')}>
                  <Image src={'/byo-llm.png'} alt='BYO LLM' width={1000} height={500}/>
                </div>
                <h3>
                  Create self-serve dashboards for your lab
                </h3>
                <p>
                  Your entire lab doesn&apos;t need to adopt Python for it to transform the way you work. 
                </p>
                <p>
                  Create Python-based dashboards for common analyses, and let your entire lab use them without writing any code. 
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
                </p>
              </div>
              <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin)}>
                  <Image src={'/configurable-database-queries.png'} alt='Configurable Database Queries' width={668} height={342} layout='responsive'/>
              </div>
            </div>
        
            <div className={classNames(pageStyles.subsection, pageStyles.subsection_justify_baseline)}>
              <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin, 'display-desktop-only-inline-block')}>
                  <Image src={'/custom-spreadsheet-functions.png'} alt='Custom Spreadsheet Functions' width={597} height={280} layout='responsive'/>
              </div>
                <div className={textImageSplitStyles.functionality_text}>
                <h2>
                  Healthcare and Pharmaceuticals
                </h2>
                <p>
                  Easily build scripts to split datasets by patient or hospital visits, convert dates to the correct format, and filter through complex data to find relevant data.
                </p>
                <p>
                  Build the scripts once and reuse them countless times, saving yourself hours per week of data wrangling and error checking.
                </p>
              </div>
              <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin, 'display-mobile-only-block')}>
                  <Image src={'/custom-spreadsheet-functions.png'} alt='Custom Spreadsheet Functions' width={597} height={280} layout='responsive'/>
              </div>
            </div>

            <div className={classNames(pageStyles.subsection, pageStyles.subsection_justify_baseline)}>
              <div className={textImageSplitStyles.functionality_text}>
                <h2>
                  Computational Biotech
                </h2>
                <p> 
                  Some things are always easier to do in spreadsheet. Create pivot tables and graphs in Mito’s point and click UI to verify that your code is correct.
                </p>
                <p>
                  Use summary statistics to build intuition about your datasets and figure out the next steps in your analysis.
                </p>
              </div>
              <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin)}>
                <Image src={'/code-snippets-taskpane.png'} alt='Code Snippets' width={502} height={279} layout='responsive'/>
              </div>
            </div>
          </section>

          <section className={classNames(pageStyles.background_card, pythonAIToolsStyles.case_study_section)}>
            <div className={classNames(pythonAIToolsStyles.case_study_text_container)}>
                <h2 className={classNames(pythonAIToolsStyles.case_study_text, 'center')}>
                  The Best Python Library for Biology and Life Sciences
                </h2>
                <p className={classNames('center')}>
                    "Mito combines the familiarity of Excel with the power of Python. 
                    I am able to quickly clean up, explore, and transform large data sets in a way that wouldn't be possible with Excel, generating code that is flexible, scalable, and repeatable. 
                    I was lucky enough to stumble upon Mito when it first launched. 
                    Now, three years later, I can't imagine tackling my day-to-day work without Mito as one of my tools."
                </p>
                <p className={classNames('center')}> 
                  — Matthew Blome, Functional Lead @ Cytiva
                </p>
            </div>
            <div>
              <Image src='/MatthewBlomeHeadshot.png' alt='Matthew Blome, Functional Lead @ Cytiva' width={250} height={250} ></Image>
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

export default PythonAITools