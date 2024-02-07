// Import necessary React and Next.js modules and components
import React, { useEffect } from 'react';
import Head from 'next/head';
import Image from "next/image"

import pageStyles from '../../styles/Page.module.css';
import homeStyles from '../../styles/Home.module.css';
import excelToPythonStyles from '../../styles/ExcelToPython.module.css';
import titleStyles from '../../styles/Title.module.css'
import textImageSplitStyles from '../../styles/TextImageSplit.module.css'

import { classNames } from '../../utils/classNames';
import TextButton from '../../components/TextButton/TextButton';
import Header, { MITO_INSTALLATION_DOCS_LINK } from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';

import CodeBlock from '../../components/CodeBlock/CodeBlock';
import GlossayHorizontalNavbar from '../../components/Glossary/HorizontalNav/HorizontalNav';
import HorizontalNavItem from '../../components/Glossary/HorizontalNavItem/HorizontalNavItem';
import CTAButtons from '../../components/CTAButtons/CTAButtons';
import PageTOC from '../../components/Glossary/PageTOC/PageTOC';
import { useRouter } from 'next/router';
import { GetStaticProps } from 'next';

import { getGlossaryPageInfo, getPageContentJsonArray, GlossaryPageInfo } from '../../utils/excel-to-python';
import { PageContent } from '../../excel-to-python-page-contents/types';

import Prism from 'prismjs';
import 'prism-themes/themes/prism-coldark-dark.css'
import { arraysContainSameValueAndOrder } from '../../utils/arrays';
import Link from 'next/link';
import { PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_EXCEL_TO_PYTHON_GLOSSARY_IN_CONTENT_CTA, PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_EXCEL_TO_PYTHON_GLOSSARY_TOC_CTA, PLAUSIBLE_MITO_EXPORTED_FUNCTION_CODE_COPIED } from '../../utils/plausible';
require('prismjs/components/prism-python');

const getRelatedFunctionHref = (relatedFunctionShortName: string, glossaryPageInfo: GlossaryPageInfo[]) => {
  const relatedFunction = glossaryPageInfo.filter((glossaryPageInfo) => {
    return glossaryPageInfo.functionNameShort === relatedFunctionShortName
  })[0]

  if (relatedFunction == null) {
    return '/excel-to-python/'
  }

  return '/excel-to-python/' + relatedFunction.slug.join('/')
}

const ExcelToPythonGlossaryPage = (props: {pageContent: PageContent, glossaryPageInfo: GlossaryPageInfo[]}) => {

  const pageContent = props.pageContent

  const router = useRouter();
  const path = router.asPath;

  const functionNameShort = pageContent.functionNameShort;

  useEffect(() => {
    /* 
      Apply prism styling to all of elements that have the class "language-XXXX" 
      (ie: language-python in the CodeBlocks component)

      TODO: Figure out if there is a better place to put this. 
      When it was in the _app.tsx file, the formatting wasn't applied if I navigated to another page and then back to this one.
    */
    Prism.highlightAll();
  }, []);

  // Make first character uppercase
  const slugComponent0 = pageContent.slug[0].charAt(0).toUpperCase() + pageContent.slug[0].slice(1);
  const slugComponent1 = pageContent.slug[1].charAt(0).toUpperCase() + pageContent.slug[1].slice(1);

  const isFunction = pageContent.slug[0] == 'functions' ? true : false
  const FUNCTION_UPPERCASE = isFunction ? ' Function' : ''
  const FUNCTION_LOWERCASE = isFunction ? ' function' : ''
  const FORMULA_UPPERCASE = isFunction ? ' Formula' : ''
  const FORMULA_LOWERCASE = isFunction ? ' formula' : ''
  

  return (
    <>
      <Head>
        {/* Title Tag */}
        <title>{`Excel to Python: ${functionNameShort}${FUNCTION_UPPERCASE} - A Complete Guide | Mito`}</title>
        
        {/* Meta Description */}
        <meta
          name="description"
          content={`Learn how to convert Excel's ${functionNameShort}${FORMULA_LOWERCASE} to Python using Pandas. This comprehensive guide provides step-by-step instructions and practical examples.`}
        />

        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Canonical URL */}
        <link rel="canonical" href={`https://www.trymito.io${path}`} />
        
        {/* Open Graph Tags (for social media sharing) */}
        <meta
          property="og:title"
          content={`Excel to Python: ${functionNameShort}${FUNCTION_LOWERCASE} - A Complete Guide`}
        />
        <meta
          property="og:description"
          content={`Learn how to convert Excel's ${functionNameShort}${FUNCTION_LOWERCASE} to Python using Pandas. This comprehensive guide provides step-by-step instructions and practical examples.`}
        />
        {/* Add more Open Graph tags as needed */}
        
        {/* Twitter Card Tags (for Twitter sharing) */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={`Excel to Python: ${functionNameShort}${FUNCTION_LOWERCASE} - A Complete Guide`}
        />
        <meta
          name="twitter:description"
          content={`Learn how to convert Excel's ${functionNameShort}${FUNCTION_LOWERCASE} to Python using Pandas. This comprehensive guide provides step-by-step instructions and practical examples.`}
        />
        {/* Add more Twitter Card tags as needed */}
        
        {/* Other SEO-related tags (structured data, robots meta, etc.) */}
        {/* Add other SEO-related tags here */}
      </Head>
      <Header />

      <div className={pageStyles.container}>
        <main className={classNames(pageStyles.main, excelToPythonStyles.main)}>
          <div className={excelToPythonStyles.content_and_table_of_contents_container}>
            <div className={excelToPythonStyles.excel_to_python_glossary_content}>
              <section className={classNames(excelToPythonStyles.title_card, excelToPythonStyles.section)}>
                <div className={excelToPythonStyles.horizontal_navbar_container}>
                  <GlossayHorizontalNavbar>
                    {/* TODO: Update hrefs to actual path once we implement the correct pages */}
                    <HorizontalNavItem title={slugComponent0} href={'/excel-to-python'} />
                    <HorizontalNavItem title={slugComponent1} href={`/excel-to-python#${slugComponent1}`} />
                    <HorizontalNavItem title={props.pageContent.slug[2]} href={path} />
                  </GlossayHorizontalNavbar>
                </div>
                
                <h1>How to Use Excel&apos;s <span className='text-highlight'>{functionNameShort}</span>{FUNCTION_UPPERCASE} in Pandas</h1>
                <div className={classNames(excelToPythonStyles.related_functions_card)}>
                  <p>Related Functions</p>
                  {pageContent.relatedFunctions.length > 0 && 
                    <TextButton 
                      text={pageContent.relatedFunctions[0]}
                      variant='primary'
                      fontSize='small'
                      href={getRelatedFunctionHref(pageContent.relatedFunctions[0], props.glossaryPageInfo)}
                      openInNewTab={false}
                    />
                  }
                  {pageContent.relatedFunctions.length > 1 && 
                    <TextButton
                      text={pageContent.relatedFunctions[1]}
                      variant='primary'
                      fontSize='small'
                      href={getRelatedFunctionHref(pageContent.relatedFunctions[1], props.glossaryPageInfo)}
                      openInNewTab={false}
                    />
                  } 
                  {pageContent.relatedFunctions.length > 2 && 
                    <TextButton
                      text={pageContent.relatedFunctions[2]}
                      variant='primary'
                      fontSize='small'
                      href={getRelatedFunctionHref(pageContent.relatedFunctions[2], props.glossaryPageInfo)}
                      openInNewTab={false}
                    />
                  }
                </div>
              </section>
              
              <section className={excelToPythonStyles.section}>
                {pageContent.titleCardParagraphs.map(text => {
                    return <p key={text}>{text}</p>
                })}
              </section>

              {/* Equivalent Python Code Using Pandas */}
              <section className={excelToPythonStyles.section}>
                <h2 
                  id={`Implementing ${functionNameShort} in Pandas`}
                  className={excelToPythonStyles.link}
                >
                  Implementing {isFunction ? 'the ' : ''}{pageContent.functionNameLong}{FUNCTION_LOWERCASE} in Pandas
                  <Link href={`#Implementing ${functionNameShort} in Pandas`}><span className={excelToPythonStyles.section_copy}>#</span></Link>
                </h2>
                {pageContent.equivalentCode.introParagraphs.map(text => {
                  return <p key={text}>{text}</p>
                })}
                {pageContent.equivalentCode.codeSections.map((codeSection, index) => {
                  return (
                    <>
                      <h3 
                        id={codeSection.shortTitle}
                        className={classNames(excelToPythonStyles.section_h3_tag, excelToPythonStyles.link)}
                      >
                        {codeSection.title}
                        <Link href={`#${codeSection.shortTitle}`}><span className={excelToPythonStyles.section_copy}>#</span></Link>
                      </h3>
                      {codeSection.paragraphs.map(text => {
                        return <p key={text}> {text}</p>
                      })}
                      {codeSection.codeLines.length > 0 &&
                        <CodeBlock
                          code={codeSection.codeLines.join('\n')}
                          className={codeSection.shortTitle.startsWith('Mito') ? PLAUSIBLE_MITO_EXPORTED_FUNCTION_CODE_COPIED : ''}
                        />
                      }
                      {index === 0 &&
                        <div className={classNames(excelToPythonStyles.in_content_cta_card, pageStyles.background_card)}>
                          <div className={excelToPythonStyles.in_content_cta_text}>
                            <h3>Mito lets you use Excel formulas in Python</h3>
                            <p>
                              Every edit you make in the Mito spreadsheet, generates the equivalent Python code for you. Use <a href="https://docs.trymito.io/how-to/interacting-with-your-data/mito-spreadsheet-formulas" target="_blank" rel="noreferrer" className={pageStyles.link}>spreadsheet formulas</a>, <a href="https://docs.trymito.io/how-to/pivot-tables" target="_blank" rel="noreferrer" className={pageStyles.link}>pivot tables</a>, and <a href="https://docs.trymito.io/how-to/graphing" target="_blank" rel="noreferrer" className={pageStyles.link}>graphs</a> without writing a single line of Python.
                            </p>
                            <TextButton 
                              text={'Install Mito'} 
                              href={MITO_INSTALLATION_DOCS_LINK} 
                              className={PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_EXCEL_TO_PYTHON_GLOSSARY_IN_CONTENT_CTA}
                              buttonSize='small'
                            />
                          </div>
                          <div id='video'>
                            <video className={excelToPythonStyles.in_content_cta_video} autoPlay loop disablePictureInPicture playsInline webkit-playsinline="true" muted>
                                <source src="/excel-to-python/formula_writing.mp4" />
                            </video>
                          </div>
                        </div>
                        
                      }
                    </>
                  )
                })}
              </section>

              {/* Common Pitfalls and Tips */}
              <section className={excelToPythonStyles.section}>
                <h2 
                  id="Common mistakes"
                  className={excelToPythonStyles.link}
                >
                  Common mistakes when using {functionNameShort} in Python
                  <Link href="#Common mistakes"><span className={excelToPythonStyles.section_copy}>#</span></Link>
                </h2>
                {pageContent.commonMistakes.introParagraphs.map(text => {
                  return <p key={text}>{text}</p>
                })}
                {pageContent.commonMistakes.codeSections.map(codeSections => {
                  return (
                    <>
                      <h3 
                        id={codeSections.shortTitle} 
                        className={classNames(excelToPythonStyles.section_h3_tag, excelToPythonStyles.link)}
                      >
                        {codeSections.title}
                        <Link href={`#${codeSections.shortTitle}`}><span className={excelToPythonStyles.section_copy}>#</span></Link>
                      </h3>
                      {codeSections.paragraphs.map(text => {
                        return <p key={text}>{text}</p>
                      })}
                      {codeSections.codeLines.length > 0 && 
                        <CodeBlock 
                          code={codeSections.codeLines.join('\n')}
                          className={codeSections.shortTitle.startsWith('Mito') ? 'mito-code-block' : ''}
                        />
                      }
                    </>
                  )
                })}
              </section>
              {/* Understanding the Excel Function */}
              {pageContent.excelExplanation !== undefined &&
                <section className={excelToPythonStyles.section}>
                  <h2 
                    id={`Excel's ${functionNameShort} formula`}
                    className={excelToPythonStyles.link}
                  >
                    Understanding {isFunction ? 'the ' : ''}{pageContent.functionNameLong}{FORMULA_UPPERCASE} in Excel
                    <Link href={`#Excel's ${functionNameShort} formula`}><span className={excelToPythonStyles.section_copy}>#</span></Link>
                  </h2>
                  {pageContent.excelExplanation.paragraphs.map(text => {
                    return <p key={text}>{text}</p>
                  })}
                  {pageContent.excelExplanation.syntaxTable.length > 0 &&
                    <>
                      <h3 className={excelToPythonStyles.section_h3_tag}>{functionNameShort} Excel Syntax</h3>
                      <table className={excelToPythonStyles.excel_to_python_table}>
                        <thead>
                          <tr>
                            <th>Parameter</th>
                            <th>Description</th>
                            <th>Data Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageContent.excelExplanation.syntaxTable.map((row, index) => {
                            return (
                              <tr key={`syntax-table-row-${index}`}>
                                <td>{row.parameter}</td>
                                <td>{row.description}</td>
                                <td>{row.dataType}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </>
                  }
                  {pageContent.excelExplanation.examplesTable.length > 0 &&
                    <>
                      <h3 className={excelToPythonStyles.section_h3_tag}>Examples</h3>
                      <table className={excelToPythonStyles.excel_to_python_table}>
                        <thead>
                          <tr>
                            <th>Formula</th>
                            <th>Description</th>
                            <th>Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageContent.excelExplanation.examplesTable.map((row, index) => {
                            return (
                              <tr key={`examples-table-row-${index}`}>
                                <td>{row.formula}</td>
                                <td>{row.description}</td>
                                <td>{row.result}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </>
                  }
              </section>
              }

            </div>
            <div className={excelToPythonStyles.table_of_contents_container}>
              <PageTOC />
              <p className={classNames('text-primary', 'margin-bottom-1')}>
                <b>Don&apos;t re-invent the wheel. Use Excel formulas in Python.</b> 
              </p>
              <TextButton 
                text={'Install Mito'} 
                href={MITO_INSTALLATION_DOCS_LINK} 
                className={PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_EXCEL_TO_PYTHON_GLOSSARY_TOC_CTA}
                buttonSize='small'
              />
            </div>
          </div>
          
          <section className={classNames(pageStyles.background_card, excelToPythonStyles.cta_card)}>
            <div>
              <h2 className={titleStyles.title}>
                Don&apos;t want to re-implement Excel&apos;s functionality in Python?
              </h2>
              <div className='center'>
                <CTAButtons 
                  variant='download' 
                  align='center' 
                  textButtonClassName={PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_EXCEL_TO_PYTHON_GLOSSARY_IN_CONTENT_CTA} 
                  secondaryCTA='learn more'
                />
              </div> 
            </div>
            <div className={classNames(pageStyles.subsection, pageStyles.subsection_justify_baseline, excelToPythonStyles.cta_functionality_card, 'display-desktop-only-flex')}>
              <div className={classNames(textImageSplitStyles.functionality_text)}>
                <h2>
                  <span className='text-highlight'>Edit a spreadsheet.</span> <br></br>
                  Generate Python.
                </h2>
                <p>
                  Mito is the easiest way to write Excel formulas in Python. 
                  Every edit you make in the Mito spreadsheet is automatically converted to Python code.
                </p>
                <a href="https://docs.trymito.io/how-to/importing-data-to-mito" target="_blank" rel="noreferrer" className={pageStyles.link_with_p_tag_margins}>
                  View all 100+ transformations →
                </a>
              </div>
              <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin)}>
                <div className={'center'}>
                  <Image src={'/excel-to-python/mito_code_gen.png'} alt='Automate analysis with Mito' width={373} height={364}/>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer/>
      </div>
    </>
  )
}

export async function getStaticPaths() {
  const pageContentsJsonArray = await getPageContentJsonArray()

  // Get the paths we want to create based on json files in the excel-to-python-page-content directory 
  const paths = pageContentsJsonArray.map((pageContentsJson) => {
    return {
      // We allow the slug to be an array so we can support paths like /functions/math/abs
      // https://nextjs.org/docs/pages/building-your-application/routing/dynamic-routes#catch-all-segments
      params: { slug: [...pageContentsJson.slug] },
    }
  })

  // { fallback: false } means posts not found should 404. 
  // TODO: Update the fallback so if they entire an invalid URL with the /excel-to-python/ prefix, it returns them to the excel-to-python page
  return { paths, fallback: false }
}

export const getStaticProps: GetStaticProps = async (context) => {
  const slug = context.params?.slug;

  const pageContentsJsonArray = await getPageContentJsonArray()

  const pageContent = slug && pageContentsJsonArray.find(pageContentsJson => {
    // If the slugs are both strings, compare them
    if (typeof slug === 'string' && typeof pageContentsJson.slug === 'string') {
      return slug === pageContentsJson.slug
    }

    // If the slugs are both arrays, compare them
    if (Array.isArray(slug) && Array.isArray(pageContentsJson.slug)) {
      return arraysContainSameValueAndOrder(slug, pageContentsJson.slug)
    }

    return false
  })

  const glossaryPageInfo = await getGlossaryPageInfo(pageContentsJsonArray)

  if (!pageContent) {
    return {
      notFound: true,
    }
  }

  return {
    props: { 
      pageContent: pageContent,
      glossaryPageInfo: glossaryPageInfo
    }
  }
}

export default ExcelToPythonGlossaryPage;