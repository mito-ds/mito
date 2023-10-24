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
import { GetStaticProps, NextPage } from 'next';
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
                    <p>{text}</p>
                })}
              </section>

              {/* Understanding the Excel Function */}
              <section className={excelToPythonStyles.section}>
                  <h2 
                    id="Understanding Excel's ABS Function"
                    className={excelToPythonStyles.link}
                  >
                    Understanding Excel&apos;s ABS Function
                    <a className={excelToPythonStyles.section_copy} href="#Understanding Excel's ABS Function">#</a>
                  </h2>
                  <p>
                    The ABS function in Excel takes a single parameters and returns its absolute value.
                  </p>
                  <p>
                    =ABS(<span className='text-highlight'>number</span>)
                  </p>
                  <h3 className={excelToPythonStyles.h3}>ABS Excel Syntax</h3>
                  <table className={excelToPythonStyles.table}>
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>Description</th>
                        <th>Data Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>number</td>
                        <td>The number you want to take the absolute value of</td>
                        <td>number</td>
                      </tr>
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
                      <tr>
                        <td>=ABS(-5)</td>
                        <td>Calculate the absolute value of -5</td>
                        <td>5</td>
                      </tr>
                      <tr>
                        <td>=ABS(2*-2)</td>
                        <td>Calculate the absolute value of 2 * -2</td>
                        <td>4</td>
                      </tr>
                    </tbody>
                  </table>
              </section>

              {/* Equivalent Python Code Using Pandas */}
              <section className={excelToPythonStyles.section}>
                  <h2 
                    id="Implementing ABS in Pandas"
                    className={excelToPythonStyles.link}
                  >
                    Implementing the Absolute Value function in Pandas
                    <a className={excelToPythonStyles.section_copy} href="#Implementing ABS in Pandas">#</a>
                  </h2>
                  <p>
                    To replicate the ABS function in Excel using Python and Pandas, you can use the `abs()` function available in Pandas. Below are examples of how to achieve the same functionality.
                  </p>
                  
                  <h3 
                    id="ABS of every cell" 
                    className={classNames(excelToPythonStyles.h3, excelToPythonStyles.link)}
                  >
                    Calculate the absolute value of every cell in a Pandas series
                    <a className={excelToPythonStyles.section_copy} href="#ABS of every cell">#</a>
                  </h3>
                  <p>
                    The most common way to use the function in Excel is to apply it directly to a column or series of numbers in a Pandas DataFrame.
                  </p>

                  <CodeBlock code={`# Calculate the absolute value of the Numbers column
df['ABS_Result'] = df['Numbers'].abs()`}
                  />
                  <h3 
                    id="ABS difference" 
                    className={classNames(excelToPythonStyles.h3, excelToPythonStyles.link)}
                  >
                    Finding the absolute difference between two columns
                    <a className={excelToPythonStyles.section_copy} href="#ABS difference">#</a>
                  </h3>
                  <p>
                    To use the absolute value as part of a more complex operation, you can use the `apply()` function to apply the operation to every element in an pandas dataframe column.
                  </p>
                  <CodeBlock code = {`# Calculate the absolute difference between Column1 and Column2
df['Absolute_Difference'] = (df['Column1'] - df['Column2']).abs()`
                  }/>
                  <h3 
                    id="Complex ABS operations" 
                    className={classNames(excelToPythonStyles.h3, excelToPythonStyles.link)}
                  >
                    Using ABS as part of a more complex operation
                    <a className={excelToPythonStyles.section_copy} href="#Complex ABS operations">#</a>
                  </h3>
                  <p>
                    To use the absolute value as part of a more complex operation, you can use the `apply()` function to apply the operation to every element in an pandas dataframe column.
                  </p>
                  <CodeBlock code = {`# Define a function to calculate the absolute sum of a row
def abs_sum(row):
  return row.abs().sum()
                    
# Create a new column 'ABS_SUM' by applying the custom function 
df['ABS_SUM'] = df.['ABS'].abs(), axis=1)`
                  }/>
              </section>

              {/* Common Pitfalls and Tips */}
              <section className={excelToPythonStyles.section}>
                <h2 
                  id="Common mistakes"
                  className={excelToPythonStyles.link}
                >
                  Common mistakes when implementing the ABS function in Python
                  <a className={excelToPythonStyles.section_copy} href="#Common mistakes">#</a>
                </h2>
                <p>
                  When implementing the ABS function in Python, there are a few common challenges that you might run into.
                </p>
                <h3 
                  id="Missing values" 
                  className={classNames(excelToPythonStyles.h3, excelToPythonStyles.link)}
                >
                  Handling Missing Values
                  <a className={excelToPythonStyles.section_copy} href="#Missing values">#</a>
                </h3>
                <p>
                  If you execute the ABS value function on a cell that contains new data in Excel, it will simply return 0. However, in Pandas, empty cells are represented by the Python NoneType. Using the .abs() function on the NoneType will create this error <code>`TypeError: bad operand type for abs(): &apos;NoneType&apos;`</code>.
                </p>
                <p>
                  To resolve this error, before calling the absolute value function, use the fillnan function to replace all missing values with 0. Doing so will make your absolute value function handle missing values exactly the same as Excel.
                </p>
                <CodeBlock code={`# Fill missing values with 0 so it is handled the same was as Excel
df.fillna(0, inplace=True)

# Calculate the absolute value
df['ABS_SUM'] = df['A'].abs()`}/>          
                <h3 
                  id="Non-numeric values" 
                  className={classNames(excelToPythonStyles.h3, excelToPythonStyles.link)}
                >
                  Handling Non-numeric Values
                  <a className={excelToPythonStyles.section_copy} href="#Non-numeric values">#</a>
                </h3>
                <p>
                  In Python, when you use the ABS function you don&apos;t have to think about the data types of the input numbers. In fact, most of the time you never have to think about the datatypes of your data in Excel. However, in Python, each column has an explicit data type and each function exepcts a specific data type as the input.
                </p>
                <p>
                  Python&apos;s .abs function expects the input to be an int (integer) or float (number with decimals). Before calling the .abs function you can make sure that the input is the correct dtype using Pandas .astype formula.
                </p>
                <CodeBlock code={`# Convert the columns to numeric data types (float)
df[A] = df['A'].astype(float)

# Then, replace any cell that could not be converted to a float
# with the value 0, so it’s handled the same as Excel.
df.fillna(0, inplace=True)

# Calculate the absolute value
df['ABS_SUM'] = df['A'].abs()`}/>
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