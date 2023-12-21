import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '../../components/Footer/Footer';
import Header from '../../components/Header/Header';
import pageStyles from '../../styles/Page.module.css';
import pythonAIToolsStyles from '../../styles/PythonAITools.module.css';
import securityStyles from '../../styles/Security.module.css';
import trifoldStyles from '../../styles/Trifold.module.css'
import titleStyles from '../../styles/Title.module.css';
import trainingStyles from '../../styles/Training.module.css';
import spreadsheetAutomationStyles from '../../styles/SpreadsheetAutomation.module.css';
import textImageSplitStyles from '../../styles/TextImageSplit.module.css';

// Import Icons & Background Grid
import { classNames } from '../../utils/classNames';
import CTAButtons from '../../components/CTAButtons/CTAButtons';
import FAQCard from '../../components/FAQCard/FAQCard';
import ContactCTACard from '../../components/CTACards/ContactCTACard';

import automationIcon from '../../public/training/automation.svg';
import bugIconPurple from '../../public/training/bug_purple.svg';
import dataIconPurple from '../../public/training/data_purple.svg';
import fastClockIcon from '../../public/training/fast_clock.svg';
import infoIcon from '../../public/training/info.svg';


const LifeSciences: NextPage = () => {

  return (
    <>
      <Head>
        <title>Python Automation Training for Excel analysts | Mito</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Empower business analysts to build Python and pandas automations. Finance, Insurance, and Life Science firms run Python training with Mito." />
      </Head>
      <Header/>
    
      <div className={pageStyles.container}>
        <main className={pageStyles.main}>
          <section className={classNames(titleStyles.title_card, pageStyles.background_card, spreadsheetAutomationStyles.flex_col_mobile_row_desktop)}>
            <div className={spreadsheetAutomationStyles.title_text_container}>
              <h1>
                Improve the Effectiveness of your Corporate Python Training 
              </h1>
              <p className={classNames(titleStyles.subtitle)}>
                Mito let’s your business analysts use their Excel skills to build Python automations.
              </p>
              <CTAButtons variant={'contact'} align='left' displaySecondaryCTA={false}/>
            </div>
            <div className={classNames(spreadsheetAutomationStyles.hero_video_container)}>
              <video autoPlay loop disablePictureInPicture playsInline webkit-playsinline="true" muted>
                  <source src="/hospital_patient_pivot.mp4" />
              </video>
            </div>
          </section>

          <section>
            <div className={classNames(pageStyles.subsection, pageStyles.left_aligned_section)}>
                <h2 className={classNames('margin-top-4rem', 'margin-bottom-2rem', trainingStyles.three_quarter_width_header)}>
                    Increase Python Training retention by embracing your business analyst&apos;s Excel mastery.
                </h2>
            </div>
            <div className={pageStyles.subsection}>
                <div className={securityStyles.security_bullet_container}>
                    <div className={securityStyles.icon}>
                        <Image className={securityStyles.icon} src={fastClockIcon} alt='icon'></Image>
                    </div>
                    <h3>
                        Write Python code 4x faster
                    </h3>
                    <p>
                        Mito generates the equivalent Python code for every edit the user makes. Our research shows that business analysts write Python code 400% faster using Mito compared to writing code by hand. 
                    </p>
                    <p>
                        The biggest blocker for analysts building their own automation after a training is not having enough time to do so. 
                    </p>
                    <p>
                        Write =VLOOKUP in Mito instead of struggling through 5 lines of <a className={pageStyles.link} href='https://www.trymito.io/excel-to-python/functions/lookup/VLOOKUP#Implementing%20VLOOKUP%20in%20Pandas' target="_blank" rel="noreferrer">complex pandas code</a>. 
                    </p>
                </div>
                <div className={classNames(securityStyles.security_bullet_container, pageStyles.subsection_second_element_mobile_spacing)}>
                    <div className={securityStyles.icon}>
                        <Image className={securityStyles.icon} src={automationIcon} alt='icon'></Image>
                    </div>
                    <h3>
                        Reduce time to useful automation
                    </h3>
                    <p>
                        The best way to convince business analysts to commit to Python training is to start saving them time as fast as possible. 
                    </p>
                    <p>
                        If after 3 days of Python training each business analyst hasn&apos;t built a useful Python automation, their main takeaway will be: “I don&apos;t have enough time to learn Python.”
                    </p>
                    <p>Mito let&apos;s them start building useful automation in the first 10 minutes.</p>
                </div>
            </div>
            <div className={pageStyles.subsection}>
                <div className={securityStyles.security_bullet_container}>
                    <div className={securityStyles.icon}>
                        <Image  src={dataIconPurple} alt='icon'></Image>
                    </div>
                    <h3>
                        Train in the context of your data
                    </h3>
                    <p>
                        Training is most engaging when you&apos;re practicing on real business data. Because Mito hides the complexity of learning Python syntax, you don&apos;t have to oversimplify your data. 
                    </p>
                    <p>
                        Instead of learning total = x + y`, skip straight to building pivot tables on your monthly returns data.
                    </p>
                </div>
                <div className={pageStyles.subsection_second_element_mobile_spacing}>
                    <div className={securityStyles.icon}>
                        <Image className={securityStyles.icon} src={bugIconPurple} alt='icon'></Image>
                    </div>
                    <h3>
                        Decrease errors by 8x
                    </h3>
                    <p>
                        No more syntax errors or forgetting a colon. Mito generates code for you, so your analysts can focus on the business logic. 
                    </p>
                    <p>
                        Help your analysts leapfrog the <a className={pageStyles.link} href='https://www.trymito.io/blog/10-mistakes-to-look-out-for-when-transitioning-from-excel-to-python' target="_blank" rel="noreferrer">“Oh my god. Why is this not working? UGGHHH!!!”</a> phase. 
                    </p>
                </div>
            </div>
            <div className={pageStyles.subsection}>
                <div className={securityStyles.security_bullet_container}>
                    <div className={securityStyles.icon}>
                        <Image  src={dataIconPurple} alt='icon'></Image>
                    </div>
                    <h3>
                        Data Discoverability
                    </h3>
                    <p>
                        Figuring out which database holds the monthly report&apos;s data is often a multi-week scavenger hunt. Then getting permission to query that database can take another several weeks.
                    </p>
                    <p>
                        Mito makes it easy for your team to pre-load common SQL queries so your business analysts don&apos;t spend weeks hunting down their data sources.
                    </p>
                    <p>
                        To get the most out of your large data, the subject matter expert needs to be the one analyzing it. 
                        Not a supporting data scientist who isn&apos;t using the data to make business decisions.
                    </p>
                </div>
                <div className={pageStyles.subsection_second_element_mobile_spacing}>
                    <div className={securityStyles.icon}>
                        <Image className={securityStyles.icon} src={infoIcon} alt='icon'></Image>
                    </div>
                    <h3>
                        Skip the syntax 
                    </h3>
                    <p>
                        Since Mito generates the equivalent Python code for every edit, you don&apos;t need to teach confusing pandas syntax. It&apos;s confusing to engineers, let alone analysts seeing it for the first time. 
                    </p>
                    <p>
                        Don&apos;t believe us? Which of these is correct?
                    </p>
                    <ol style={{'listStylePosition': 'inside', 'paddingLeft': '0'}}>
                        <li>
                            df['Age'] = pd.tonumeric(df['Age'])
                        </li>
                        <li style={{marginTop: '.5rem'}}>
                            df['Age'] = df['Age'].astype(int)
                        </li>
                        <li style={{marginTop: '.5rem'}}>
                            df['Age'] = df['Age'].as_type(int)
                        </li>
                    </ol>
                    <p>
                        Click to see the right answer
                    </p>
                </div>
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
              <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin, 'display-mobile-only-block')}>
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