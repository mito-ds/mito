import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Footer from '../components/Footer/Footer';
import Header from '../components/Header/Header';
import pageStyles from '../styles/Page.module.css';
import textImageSplitStyles from '../styles/TextImageSplit.module.css';
import titleStyles from '../styles/Title.module.css';
import trifoldStyles from '../styles/Trifold.module.css';
import functionalityCardStyles from '../styles/FunctionalityCard.module.css';
import spreadsheetAutomationStyles from '../styles/SpreadsheetAutomation.module.css';

import { classNames } from '../utils/classNames';
import CTAButtons from '../components/CTAButtons/CTAButtons';
import PivotTableIcon from '../public/step-icons/PivotTableIcon.svg';
import GraphIcon from '../public/step-icons/GraphIcon.svg';
import FunctionIcon from '../public/step-icons/FunctionIcon.svg';
import SettingsIcon from '../public/step-icons/SettingsIcon.svg';
import ImportIcon from '../public/step-icons/ImportIcon.svg';
import FilterIcon from '../public/step-icons/FilterIcon.svg';

import Link from 'next/link';
import { useState } from 'react';
import DownloadCTACard from '../components/CTACards/DownloadCTACard';



const SpreadsheetAutomation: NextPage = () => {

  const [selectedFunctionalityCard, setSelectedFunctinoalityCard] = useState<number>(0);

  return (
    <>
      <Head>
        <title>No-Code Spreadsheet Automation Software for Python | Mito</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Mito is a notebook-native Python library that enables simple, no-code spreadsheet automation with Pandas code generation and AI tools built in. | Mito" />
      </Head>
      <Header/>
    
      <div className={pageStyles.container}>

        <main className={pageStyles.main}>
          <section className={classNames(titleStyles.title_card, pageStyles.background_card, spreadsheetAutomationStyles.flex_col_mobile_row_desktop)}>
            <div className={spreadsheetAutomationStyles.title_text_container}>
              <h1>
                The No-Code Approach to Spreadsheet Automation 
              </h1>
              <p className={titleStyles.subtitle}>
                Automate your spreadsheets in hours, not months.
              </p>
              <CTAButtons variant={'download'} align='left'/>
            </div>
            <div className={classNames(spreadsheetAutomationStyles.hero_video_container)}>
              <video autoPlay loop disablePictureInPicture playsInline webkit-playsinline="true" muted>
                  <source src="/formula_writing.mp4" />
              </video>
            </div>
          </section>

          <section className={textImageSplitStyles.text_image_section_container}>
            <div className={pageStyles.subsection}>
              <div className={classNames(textImageSplitStyles.functionality_media, 'display-desktop-only-inline-block')}>
                <Image src={'/code_snippet.png'} alt='Mito generated code' width={500} height={250} layout='responsive'/>
              </div>
              <div className={textImageSplitStyles.functionality_text}>
                <h2>
                  The easiest way to <span className='text-highlight'>write Python code</span>
                </h2>
                <p>
                  Every edit made in the Mito spreadsheet is automatically converted to Python code. 
                </p>
                <p>
                  Edit your data just like you do in Excel, and receive production ready Python code. No searching Pandas documentation or Stack Overflow.
                </p>
                <p>
                  See our <Link href="/blog/automating-spreadsheets-with-python-101/"><span className={pageStyles.link}>guide to automating spreadsheet with Python.</span></Link>
                </p>
              </div>
              <div className={classNames(textImageSplitStyles.functionality_media, 'display-mobile-only-block')}>
                <Image src={'/code_snippet.png'} alt='Mito generated code!' width={500} height={250} layout='responsive'/>
              </div>
            </div>
            <div className={pageStyles.subsection}>
              <div className={textImageSplitStyles.functionality_text}>
                <h2>
                  <span className='text-highlight'>Explore</span> your data visually
                </h2>
                <p> 
                  There&apos;s no replacement for scrolling through your data. Enter fullscreen mode and build intuition about your analysis.
                </p>
                <p>
                  Use Mito&apos;s Excel-like interface to view CSV/Excel files and dataframes. And further explore your data by graphing, viewing summary stats, and creating pivot tables.
                </p>
              </div>
              <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin)}>
                <Image src={'/explore_data_visually.png'} alt='Explore data with Mito' width={500} height={250} layout='responsive'/>
              </div>
            </div>
            <div className={pageStyles.subsection}>
              <div className={classNames(textImageSplitStyles.functionality_media, 'display-desktop-only-inline-block')}>
                <Image src={'/export_to_excel.png'} alt='Mito generated code' width={500} height={250} layout='responsive'/>
              </div>
              <div className={textImageSplitStyles.functionality_text}>
                <h2>
                  Generate <span className='text-highlight'>formatted Excel files</span>
                </h2>
                <p>
                  Apply conditional formatting, set table colors, and format numbers using Mito. Don&apos;t waste time trying to understand the xlsxwriter API -- it&apos;s confusing even to engineers!
                </p>
                <p>
                  Learn more about <a href="https://docs.trymito.io/how-to/exporting-to-csv-and-excel/download-as-excel" target="_blank" rel="noreferrer" className={pageStyles.link}>generating presentation-ready Excel files.</a>
                </p>
              </div>
              <div className={classNames(textImageSplitStyles.functionality_media, 'display-mobile-only-block')}>
                <Image src={'/export_to_excel.png'} alt='Mito generated code!' width={500} height={250} layout='responsive'/>
              </div>
            </div>
          </section>

          <section className={pageStyles.background_card}>

            <div className={classNames(pageStyles.subsection, pageStyles.subsection_column, 'center')}>
              <h2>
                All of the functionality you expect, built to generate Python code
              </h2>
              <p>
                We&apos;ve implemented all of Excel&apos;s most powerful features in Python so you don&apos;t have to. Keep using the tools you&apos;re most comfortable with, and automatically generate reusable Python code.
              </p>
              <a href="https://docs.trymito.io/how-to/importing-data-to-mito" target="_blank" rel="noreferrer" className={pageStyles.link_with_p_tag_margins}>
                View all 100+ transformations →
              </a>
            </div>
            <div className={classNames(pageStyles.subsection)}>
              <div className={classNames(functionalityCardStyles.cards_container)}>
                <div 
                  className={classNames(functionalityCardStyles.card_container, {[functionalityCardStyles.selected_card] : selectedFunctionalityCard === 0})}
                  onClick={() => setSelectedFunctinoalityCard(0)}
                >
                  <div className={classNames(functionalityCardStyles.title_container)}>
                    <div className={functionalityCardStyles.functionality_icon}>
                      <Image src={PivotTableIcon} alt='Pivot Table Icon' width={20} height={20}/>
                    </div>
                    <h3 className={functionalityCardStyles.title_text}>
                      Pivot Tables
                    </h3>
                  </div>
                  <div>
                    <p className={functionalityCardStyles.subtext}>
                      Aggregate your large data to pull out the essential insights. 
                    </p>
                  </div>
                </div>
                <div 
                  className={classNames(functionalityCardStyles.card_container, {[functionalityCardStyles.selected_card] : selectedFunctionalityCard === 1})}
                  onClick={() => setSelectedFunctinoalityCard(1)}
                >
                  <div className={classNames(functionalityCardStyles.title_container)}>
                    <div className={functionalityCardStyles.functionality_icon}>
                      <Image src={GraphIcon} alt='Graph Icon' width={20} height={20}/>
                    </div>
                    <h3 className={functionalityCardStyles.title_text}>
                      Graphs & Visualizations
                    </h3>
                  </div>
                  <div>
                    <p className={functionalityCardStyles.subtext}>
                      Build beautiful, interactive graphs and apply conditional formatting to tables.
                    </p>
                  </div>
                </div>
                <div 
                  className={classNames(functionalityCardStyles.card_container, {[functionalityCardStyles.selected_card] : selectedFunctionalityCard === 2})}
                  onClick={() => setSelectedFunctinoalityCard(2)}
                >
                  <div className={classNames(functionalityCardStyles.title_container)}>
                    <div className={functionalityCardStyles.functionality_icon}>
                      <Image src={FunctionIcon} alt='Function Icon' width={20} height={20}/>
                    </div>
                    <h3 className={functionalityCardStyles.title_text}>
                      Excel-like formulas
                    </h3>
                  </div>
                  <div>
                    <p className={functionalityCardStyles.subtext}>
                      Use formulas like, <i>IF</i>, <i>SUM</i>, and <i>MID</i> to transform your data.
                    </p>
                  </div>
                </div>
                <div 
                  className={classNames(functionalityCardStyles.card_container, {[functionalityCardStyles.selected_card] : selectedFunctionalityCard === 3})}
                  onClick={() => setSelectedFunctinoalityCard(3)}
                >
                  <div className={classNames(functionalityCardStyles.title_container)}>
                    <div className={functionalityCardStyles.functionality_icon}>
                      <Image src={FilterIcon} alt='Filter Icon' width={20} height={20}/>
                    </div>
                    <h3 className={functionalityCardStyles.title_text}>
                      Filter and sort
                    </h3>
                  </div>
                  <div>
                    <p className={functionalityCardStyles.subtext}>
                      Sort and filter data based on simple or complex conditions so you can focus on the data that matters.
                    </p>
                  </div>
                </div>
                <div 
                  className={classNames(functionalityCardStyles.card_container, {[functionalityCardStyles.selected_card] : selectedFunctionalityCard === 4})}
                  onClick={() => setSelectedFunctinoalityCard(4)}
                >
                  <div className={classNames(functionalityCardStyles.title_container)}>
                    <div className={functionalityCardStyles.functionality_icon}>
                      <Image src={ImportIcon} alt='Import Icon' width={20} height={20}/>
                    </div>
                    <h3 className={functionalityCardStyles.title_text}>
                      Database Connections
                    </h3>
                  </div>
                  <div>
                    <p className={functionalityCardStyles.subtext}>
                      Use Mito&apos;s Snowflake query builder to generate SQL without writing any code. 
                    </p>
                  </div>
                </div>
                <div 
                  className={classNames(functionalityCardStyles.card_container, {[functionalityCardStyles.selected_card] : selectedFunctionalityCard === 5})}
                  onClick={() => setSelectedFunctinoalityCard(5)}
                >
                  <div className={classNames(functionalityCardStyles.title_container)}>
                    <div className={functionalityCardStyles.functionality_icon}>
                      <Image src={SettingsIcon} alt='Settings Icon' width={20} height={20}/>
                    </div>
                    <h3 className={functionalityCardStyles.title_text}>
                      Customizable
                    </h3>
                  </div>
                  <div>
                    <p className={functionalityCardStyles.subtext}>
                      Make your org&apos;s custom functions, graph templates, and database connections <Link href='/infrastructure-integration-python-tool'><a className={classNames(functionalityCardStyles.subtext, 'text-highlight')}>accessible through Mito</a></Link>.
                    </p>
                  </div>
                </div>
              </div>
              <div className={classNames(functionalityCardStyles.image_container, 'margin-top-2rem-mobile-only')}>
                {selectedFunctionalityCard === 0 &&
                  <Image
                    objectFit="contain"
                    objectPosition="center"
                    width={517} 
                    height={560}
                    src={'/pivot_table_vertical.png'} 
                    alt='Pivot Tables in Mito' 
                  />
                }
                {selectedFunctionalityCard === 1 &&
                  <Image
                    objectFit="contain"
                    objectPosition="center"
                    width={517} 
                    height={560}
                    src={'/visualizations_vertical.png'} 
                    alt='Visualizations in Mito' 
                  />
                }
                {selectedFunctionalityCard === 2 &&
                  <Image 
                    objectFit="contain"
                    objectPosition="center"
                    width={517} 
                    height={560}
                    src={'/formulas_vertical.png'} 
                    alt='Formulas in Mito' 
                  />
                }
                {selectedFunctionalityCard === 3 &&
                  <Image 
                    objectFit="contain"
                    objectPosition="center"
                    width={576} 
                    height={623}
                    src={'/filter_vertical.png'} 
                    alt='Filter in Mito' 
                  />
                }
                {selectedFunctionalityCard === 4 &&
                  <Image 
                    objectFit="contain"
                    objectPosition="center"
                    width={578} 
                    height={578}
                    src={'/snowflake_vertical.png'} 
                    alt='Snowflake in Mito' 
                  />
                }
                {selectedFunctionalityCard === 5 &&
                  <Image 
                    objectFit="contain"
                    objectPosition="center"
                    width={528} 
                    height={640}
                    src={'/customization_vertical.png'} 
                    alt='Customization in Mito' 
                  />
                }
              </div>

            </div>
          </section>

          <section>
            <div className={classNames(pageStyles.subsection, 'center')}>
              <h2>
                The Benefits of Automating Excel and Google Spreadsheets
              </h2>
            </div>
            <div className={classNames(pageStyles.subsection, trifoldStyles.container)}>
              <div className={classNames(pageStyles.subsection_column)}>
                <div className={classNames(trifoldStyles.image_container, 'margin-top-8rem-mobile-only')}>
                  <Image src={'/large_data.png'} alt='Large Data' width={1000} height={500}/>
                </div>
                <h3>
                  Larger datasets, faster edits
                </h3>
                <p>
                  Excel and Google Sheets aren&apos;t designed for modern data. Insert 1 million rows of data into Excel and you&apos;ll wait 10 minutes every time you update your analysis.
                </p>
                <p>
                  Modern data teams use Python to analyze millions of rows of data in just a couple of seconds. No more waiting on your Excel files.
                </p>
              </div>
              <div className={classNames(pageStyles.subsection_column)}>
                <div className={classNames(trifoldStyles.image_container, 'margin-top-8rem-mobile-only')}>
                  <Image src={'/custom_imports.png'} alt='Custom Import' width={1000} height={500}/>
                </div>
                <h3>
                  Use the full power of Python
                </h3>
                <p>
                  Excel used to be the data collection, analysis, and report presentation tool. Today, modern data teams use Excel primarily as the output of analyses. 
                </p>
                <p>
                  Automating reports in Python lets you use AI and ML to extract insights, connect directly to all of your data sources, and utilize template analyses built by your organization.
                </p>
              </div>
              <div className={classNames(pageStyles.subsection_column)}>
                <div className={classNames(trifoldStyles.image_container, 'margin-top-8rem-mobile-only')}>
                  <Image src={'/code.png'} alt='Mito Generated Code' width={1000} height={500}/>
                </div>
                <h3>
                  Reduce bugs and key person risk
                </h3>
                <p>
                  Because Excel reports lack structure, it&apos;s easy to introduce bugs into your report. And it&apos;s nearly impossible to transfer responsibility for a large Excel file to someone else on your team. 
                </p>
                <p>
                  By transitioning to Python, you reduce the chance of off-by-one errors and make it much easier for processes to last as long as you need them.
                </p>
              </div>
            </div>
            
          </section>

          <section className={pageStyles.background_card}>
            <div className={classNames('center', spreadsheetAutomationStyles.automate_section_container)}>
              <h2>
                Mito is the easiset way to automate with Python and Pandas
              </h2>
              <p>
                Edit a spreadsheet. Generate Python.
              </p>
              <p>
                Mito automatically converts each edit you make into Python code.
                So you can create your analysis like you usually do in Excel, and use the Mito generated Python code to automate your analysis going forward. 
              </p>
            </div>
            <div className={classNames(spreadsheetAutomationStyles.video_wrapper, 'margin-top-4rem')}>
              <div className={spreadsheetAutomationStyles.video_container}>
                <iframe 
                  className={spreadsheetAutomationStyles.video}
                  src="https://www.youtube.com/embed/eF2QV4ymapk" 
                  title="YouTube video player" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  allowFullScreen>
                </iframe>
              </div>
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

export default SpreadsheetAutomation