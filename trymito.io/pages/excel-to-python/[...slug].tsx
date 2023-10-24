// Import necessary React and Next.js modules and components
import React, { useEffect } from 'react';
import Head from 'next/head';
import Image from "next/image"

import pageStyles from '../../styles/Page.module.css';
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
import { PageContent } from './types';

import Prism from 'prismjs';
import 'prism-themes/themes/prism-coldark-dark.css'
import { getPageContentJsonArray } from '../../utils/glossary';
import { arraysContainSameValues } from '../../utils/arrays';
require('prismjs/components/prism-python');

const ExcelToPythonGlossaryPage = (props: {pageContent: PageContent}) => {

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

  return (
    <>
      <Head>
        {/* Title Tag */}
        <title>{`Excel to Python: ${functionNameShort} - A Complete Guide | Mito`}</title>
        
        {/* Meta Description */}
        <meta
          name="description"
          content={`Learn how to convert Excel's ${functionNameShort} function to Python using Pandas. This comprehensive guide provides step-by-step instructions and practical examples.`}
        />

        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Canonical URL */}
        <link rel="canonical" href={`https://www.example.com/${path}`} />
        
        {/* Open Graph Tags (for social media sharing) */}
        <meta
          property="og:title"
          content={`Excel to Python: ${functionNameShort} function - A Complete Guide`}
        />
        <meta
          property="og:description"
          content={`Learn how to convert Excel's ${functionNameShort} function to Python using Pandas. This comprehensive guide provides step-by-step instructions and practical examples.`}
        />
        {/* Add more Open Graph tags as needed */}
        
        {/* Twitter Card Tags (for Twitter sharing) */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={`Excel to Python: ${functionNameShort} function - A Complete Guide`}
        />
        <meta
          name="twitter:description"
          content={`Learn how to convert Excel's ${functionNameShort} function to Python using Pandas. This comprehensive guide provides step-by-step instructions and practical examples.`}
        />
        {/* Add more Twitter Card tags as needed */}
        
        {/* Other SEO-related tags (structured data, robots meta, etc.) */}
        {/* Add other SEO-related tags here */}
      </Head>
      <Header />

      <div className={pageStyles.container}>
        <main className={classNames(pageStyles.main, excelToPythonStyles.main)}>
          <div className={excelToPythonStyles.blog_content_and_table_of_contents_container}>
            <div className={excelToPythonStyles.blog_content}>
              <section className={classNames(excelToPythonStyles.title_card, excelToPythonStyles.section)}>
                <div className={excelToPythonStyles.horizontal_navbar_container}>
                  <GlossayHorizontalNavbar>
                    {/* TODO: Update hrefs to actual path once we implement the correct pages */}
                    <HorizontalNavItem title={'Function'} href={'/spreadsheet-automation'} />
                    <HorizontalNavItem title={'Math'} href={'/spreadsheet-automation'} />
                    <HorizontalNavItem title={'ABS'} href={'/excel-to-python/functions/math/ABS'} />
                  </GlossayHorizontalNavbar>
                </div>
                
                <h1>How to Implement Excel&apos;s <span className='text-highlight'>{functionNameShort}</span> function in Pandas</h1>
                <div className={classNames(excelToPythonStyles.related_functions_card)}>
                  <p>Related Functions</p>
                  <TextButton 
                    text={pageContent.relatedFunctions[0]}
                    variant='primary'
                    fontSize='small'
                  />
                  <TextButton
                    text={pageContent.relatedFunctions[1]}
                    variant='primary'
                    fontSize='small'
                  />
                  <TextButton
                    text={pageContent.relatedFunctions[2]}
                    variant='primary'
                    fontSize='small'
                  />
                </div>
              </section>
              
              <section className={excelToPythonStyles.section}>
                {pageContent.titleCardParagraphs.map(text => {
                    return <p>{text}</p>
                })}
              </section>

              {/* Understanding the Excel Function */}
              <section className={excelToPythonStyles.section}>
                  <h2 
                    id={`Understanding Excel's ${functionNameShort} Function`}
                    className={excelToPythonStyles.link}
                  >
                    Understanding Excel&apos;s {functionNameShort} Function
                    <a className={excelToPythonStyles.section_copy} href={`#Understanding Excel's ${functionNameShort} Function`}>#</a>
                  </h2>
                  {pageContent.excelExplanation.paragraphs.map(text => {
                    return <p>{text}</p>
                  })}
                  <h3 className={excelToPythonStyles.h3}>{functionNameShort} Excel Syntax</h3>
                  <table className={excelToPythonStyles.table}>
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>Description</th>
                        <th>Data Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageContent.excelExplanation.syntaxTable.map(row => {
                        return (
                          <tr>
                            <td>{row.parameter}</td>
                            <td>{row.description}</td>
                            <td>{row.dataType}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  <h3 className={excelToPythonStyles.h3}>ABS Examples</h3>
                  <table className={excelToPythonStyles.table}>
                    <thead>
                      <tr>
                        <th>Formula</th>
                        <th>Description</th>
                        <th>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageContent.excelExplanation.examplesTable.map(row => {
                        return (
                          <tr>
                            <td>{row.formula}</td>
                            <td>{row.description}</td>
                            <td>{row.result}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
              </section>

              {/* Equivalent Python Code Using Pandas */}
              <section className={excelToPythonStyles.section}>
                <h2 
                  id={`Implementing ${functionNameShort} in Pandas`}
                  className={excelToPythonStyles.link}
                >
                  Implementing the {pageContent.functioNameLong} function in Pandas
                  <a className={excelToPythonStyles.section_copy} href={`#Implementing ${functionNameShort} in Pandas`}>#</a>
                </h2>
                {pageContent.equivalentCode.introParagraphs.map(text => {
                  return <p>{text}</p>
                })}
                {pageContent.equivalentCode.codeSections.map(codeSection => {
                  return (
                    <>
                      <h3 
                        id={codeSection.shortTitle}
                        className={classNames(excelToPythonStyles.h3, excelToPythonStyles.link)}
                      >
                        {codeSection.title}
                        <a className={excelToPythonStyles.section_copy} href={`#${codeSection.shortTitle}`}>#</a>
                      </h3>
                      {codeSection.paragraphs.map(text => {
                        return <p>{text}</p>
                      })}
                      <CodeBlock
                        code={codeSection.codeLines.join('\n')}
                      />
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
                  Common mistakes when implementing the {functionNameShort} function in Python
                  <a className={excelToPythonStyles.section_copy} href="#Common mistakes">#</a>
                </h2>
                {pageContent.commonMistakes.introParagraphs.map(text => {
                  return <p>{text}</p>
                })}
                {pageContent.commonMistakes.codeSections.map(codeSections => {
                  return (
                    <>
                      <h3 
                        id={codeSections.shortTitle} 
                        className={classNames(excelToPythonStyles.h3, excelToPythonStyles.link)}
                      >
                        {codeSections.title}
                        <a className={excelToPythonStyles.section_copy} href={`#{codeSections.shortTitle}`}>#</a>
                      </h3>
                      {codeSections.paragraphs.map(text => {
                        return <p>{text}</p>
                      })}
                      <CodeBlock code={codeSections.codeLines.join('\n')}/>
                    </>
                  )
                })}
              </section>
            </div>
            <div className={excelToPythonStyles.table_of_contents_container}>
              <PageTOC />
              <p className={classNames('text-primary', 'margin-bottom-1')}>
                <b>Don&apos;t re-invent the wheel. Use Excel formulas in Python.</b> 
              </p>
              <TextButton text={'Install Mito'} href={MITO_INSTALLATION_DOCS_LINK} buttonSize='small'/>
            </div>
          </div>
          
          <section className={classNames(pageStyles.background_card, excelToPythonStyles.cta_card)}>
            <div>
              <h2 className={titleStyles.title}>
                Don&apos;t want to re-implement Excel&apos;s functionality in Python?
              </h2>
              <div className='center'>
                <CTAButtons variant='download' align='center' secondaryCTA='learn more'/>
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

  // Get the paths we want to create based on posts
  const paths = pageContentsJsonArray.map((pageContentsJson) => {
    return {
      // We allow the slug to be an array so we can support paths like /functions/math/abs
      // https://nextjs.org/docs/pages/building-your-application/routing/dynamic-routes#catch-all-segments
      params: { slug: [...pageContentsJson.slug] },
    }
  })

  // { fallback: false } means posts not found should 404.
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
      return arraysContainSameValues(slug, pageContentsJson.slug)
    }

    return false
  })

  if (!pageContent) {
    return {
      notFound: true,
    }
  }

  return {
    props: { pageContent }
  }
}

export default ExcelToPythonGlossaryPage;