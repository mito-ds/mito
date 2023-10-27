import Head from 'next/head';
import Footer from '../components/Footer/Footer';
import Header, { MITO_INSTALLATION_DOCS_LINK } from '../components/Header/Header';
import pageStyles from '../styles/Page.module.css';
import titleStyles from '../styles/Title.module.css';
import { GetStaticProps } from 'next';
import excelToPythonStyles from '../styles/ExcelToPython.module.css';

// Import Icons & Background Grid
import { classNames } from '../utils/classNames';
import { getPageContentJsonArray } from '../utils/excel-to-python';
import Link from 'next/link';
import PageTOC from '../components/Glossary/PageTOC/PageTOC';
import TextButton from '../components/TextButton/TextButton';
import { PageContent } from '../excel-to-python-page-contents/types';

export type GlossaryPageInfo = {
    functionNameShort: string,
    purpose: string,
    slug: string[],
}

export const getGlossaryPageInfoForSection = (glossaryPageInfo: GlossaryPageInfo[], section: string) => {
    return glossaryPageInfo.filter((glossaryPageInfo) => {
        return glossaryPageInfo.slug[1] === section
    })
}

export const getGlossaryPageInfo = async (pageContentsJsonArray: PageContent[]): Promise<GlossaryPageInfo[]> => {
  
    // Get information about each glossay page
    return pageContentsJsonArray.map((pageContentsJson) => {
      return {
        functionNameShort: pageContentsJson.functionNameShort,
        purpose: pageContentsJson.purpose,
        slug: [...pageContentsJson.slug]
      }
    })
}

export const getStaticProps: GetStaticProps<{glossaryPageInfo: GlossaryPageInfo[]}> = async () => {
    const pageContentsJsonArray = await getPageContentJsonArray()
    const glossaryPageInfo = await getGlossaryPageInfo(pageContentsJsonArray)
    
    return {
        props: { glossaryPageInfo },
        revalidate: 60, // Revalidate every 1 minute
    }
}

const GlossaryPageCard = (props: {glossaryPageInfo: GlossaryPageInfo}) => {
    // TODO: This works, but maybe there is a better way...
    const slug = 'excel-to-python/' + props.glossaryPageInfo.slug.join('/')

    return (
        <Link href={slug}>
            <div className={excelToPythonStyles.glossary_page_card_container}>
                <p className={excelToPythonStyles.glossary_page_card_function_name}>
                    {props.glossaryPageInfo.functionNameShort}
                </p>
                <p>
                    {props.glossaryPageInfo.purpose}
                </p>
            </div>
        </Link>
    )
}

const ExcelToPythonHomePage = (props: {glossaryPageInfo: GlossaryPageInfo[]}) => {

    const mathFucntionsPageInfo = getGlossaryPageInfoForSection(props.glossaryPageInfo, 'math')
    const textFunctionsPageInfo = getGlossaryPageInfoForSection(props.glossaryPageInfo, 'text')
    const dateFunctionsPageInfo = getGlossaryPageInfoForSection(props.glossaryPageInfo, 'date')
    const conditionalFunctionsPageInfo = getGlossaryPageInfoForSection(props.glossaryPageInfo, 'conditional')
    const miscFunctionsPageInfo = getGlossaryPageInfoForSection(props.glossaryPageInfo, 'misc')

    return (
        <>
            <Head>
                {/* Title Tag */}
                <title>{`Excel to Python: Using Excel's functions in Python - A Complete Guide | Mito`}</title>
                
                {/* Meta Description */}
                <meta
                    name="description"
                    content={`Learn how to convert Excel's functions to Python using Pandas. This comprehensive guide provides step-by-step instructions and practical examples for every Excel formula.`}
                />

                <meta name="viewport" content="width=device-width, initial-scale=1" />
                
                {/* Canonical URL */}
                <link rel="canonical" href={`https://www.trymito.io/excel-to-python`} />
                
                {/* Open Graph Tags (for social media sharing) */}
                <meta
                    property="og:title"
                    content={`Excel to Python: Using Excel's functions in Python - A Complete Guide`}
                />
                <meta
                    property="og:description"
                    content={`Learn how to convert Excel's function to Python using Pandas. This comprehensive guide provides step-by-step instructions and practical examples.`}
                />
                {/* Add more Open Graph tags as needed */}
                
                {/* Twitter Card Tags (for Twitter sharing) */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta
                    name="twitter:title"
                    content={`Excel to Python: Using Excel's function in Python - A Complete Guide`}
                />
                <meta
                    name="twitter:description"
                    content={`Learn how to convert Excel's function to Python using Pandas. This comprehensive guide provides step-by-step instructions and practical examples.`}
                />
                {/* Add more Twitter Card tags as needed */}
                
                {/* Other SEO-related tags (structured data, robots meta, etc.) */}
                {/* Add other SEO-related tags here */}
            </Head>
                    
            <Header/>

            <div className={pageStyles.container}>
                <main className={pageStyles.main}>
                    <div className={excelToPythonStyles.content_and_table_of_contents_container}>
                        <div className={excelToPythonStyles.excel_to_python_glossary_content}>
                            <section className={classNames(titleStyles.title_card)}>
                                <h1 className={titleStyles.title}>
                                    Excel to Python Glossary
                                </h1>
                                <p className={titleStyles.description}>
                                    Looking to use Excel formulas in Python? You&apos;ve come to the right place. Click on a function below to learn how to use it in Python.
                                </p>
                            </section>
                            <section style={{marginTop: '2rem'}}>
                                <h2 id="Functions" style={{marginBottom: '2rem'}}>Functions</h2>
                                <h3 id="Math" className={excelToPythonStyles.glossary_function_category_header}>Math Functions</h3>
                                {mathFucntionsPageInfo.map((glossaryPageInfo) => {
                                    return <GlossaryPageCard key={glossaryPageInfo.functionNameShort} glossaryPageInfo={glossaryPageInfo} />
                                })}
                            </section>
                            <section>
                                <h3 id="Text" className={excelToPythonStyles.glossary_function_category_header}>Text Functions</h3>
                                {textFunctionsPageInfo.map((glossaryPageInfo) => {
                                    return <GlossaryPageCard key={glossaryPageInfo.functionNameShort} glossaryPageInfo={glossaryPageInfo} />
                                })}
                            </section>
                            <section>
                                <h3 id="Date" className={excelToPythonStyles.glossary_function_category_header}>Date Functions</h3>
                                {dateFunctionsPageInfo.map((glossaryPageInfo) => {
                                    return <GlossaryPageCard key={glossaryPageInfo.functionNameShort} glossaryPageInfo={glossaryPageInfo} />
                                })}
                            </section>
                            <section>
                                <h3 id="Conditional" className={excelToPythonStyles.glossary_function_category_header}>Conditional Functions</h3>
                                {conditionalFunctionsPageInfo.map((glossaryPageInfo) => {
                                    return <GlossaryPageCard key={glossaryPageInfo.functionNameShort} glossaryPageInfo={glossaryPageInfo} />
                                })}
                            </section>
                            <section>
                                <h3 id="Misc" className={excelToPythonStyles.glossary_function_category_header}>Misc. Functions</h3>
                                {miscFunctionsPageInfo.map((glossaryPageInfo) => {
                                    return <GlossaryPageCard key={glossaryPageInfo.functionNameShort} glossaryPageInfo={glossaryPageInfo} />
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
                </main>
                <Footer />
            </div>
        </>
    )
}

export default ExcelToPythonHomePage