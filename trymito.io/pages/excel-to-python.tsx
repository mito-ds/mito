import Head from 'next/head';
import Image from "next/image"
import Footer from '../components/Footer/Footer';
import Header, { MITO_INSTALLATION_DOCS_LINK } from '../components/Header/Header';
import pageStyles from '../styles/Page.module.css';
import titleStyles from '../styles/Title.module.css';
import { GetStaticProps } from 'next';
import excelToPythonStyles from '../styles/ExcelToPython.module.css';

// Import Icons & Background Grid
import { classNames } from '../utils/classNames';
import { getGlossaryPageInfo, getPageContentJsonArray, GlossaryPageInfo } from '../utils/excel-to-python';
import Link from 'next/link';
import PageTOC from '../components/Glossary/PageTOC/PageTOC';
import TextButton from '../components/TextButton/TextButton';
import { PageContent } from '../excel-to-python-page-contents/types';
import textImageSplitStyles from '../styles/TextImageSplit.module.css';
import CTAButtons from '../components/CTAButtons/CTAButtons';

export const getStaticProps: GetStaticProps<{glossaryPageInfo: GlossaryPageInfo[]}> = async () => {
    const pageContentsJsonArray = await getPageContentJsonArray()
    const glossaryPageInfo = await getGlossaryPageInfo(pageContentsJsonArray)
    
    return {
        props: { glossaryPageInfo },
        revalidate: 60, // Revalidate every 1 minute
    }
}

export const getGlossaryPageInfoForSection = (glossaryPageInfo: GlossaryPageInfo[], category: string, subcategory?: string) => {
    if (subcategory === undefined) {
        return glossaryPageInfo.filter((glossaryPageInfo) => {
            return glossaryPageInfo.slug[0] === category
        })
    }

    return glossaryPageInfo.filter((glossaryPageInfo) => {
        return glossaryPageInfo.slug[0] === category && glossaryPageInfo.slug[1] === subcategory
    })
}

const GlossaryPageCard = (props: {glossaryPageInfo: GlossaryPageInfo}) => {
    // TODO: This works, but maybe there is a better way...
    const slug = 'excel-to-python/' + props.glossaryPageInfo.slug.join('/')

    return (
        <Link href={slug}>
            <a className={excelToPythonStyles.glossary_page_card_container}>
                <p className={excelToPythonStyles.glossary_page_card_function_name}>
                    {props.glossaryPageInfo.functionNameShort}
                </p>
                <p>
                    {props.glossaryPageInfo.purpose}
                </p>
            </a>
        </Link>
    )
}

const ExcelToPythonHomePage = (props: {glossaryPageInfo: GlossaryPageInfo[]}) => {

    const transformationPageInfo = getGlossaryPageInfoForSection(props.glossaryPageInfo, 'transformations')

    const mathFunctionsPageInfo = getGlossaryPageInfoForSection(props.glossaryPageInfo, 'functions', 'math')
    const textFunctionsPageInfo = getGlossaryPageInfoForSection(props.glossaryPageInfo, 'functions', 'text')
    const dateFunctionsPageInfo = getGlossaryPageInfoForSection(props.glossaryPageInfo, 'functions', 'date')
    const conditionalFunctionsPageInfo = getGlossaryPageInfoForSection(props.glossaryPageInfo, 'functions', 'conditional')
    const lookupFunctionsPageInfo = getGlossaryPageInfoForSection(props.glossaryPageInfo, 'functions', 'lookup')
    const financialFunctionsPageInfo = getGlossaryPageInfoForSection(props.glossaryPageInfo, 'functions', 'financial')
    const miscFunctionsPageInfo = getGlossaryPageInfoForSection(props.glossaryPageInfo, 'functions', 'misc')

    return (
        <>
            <Head>
                {/* Title Tag */}
                <title>{`Complete Guide to Excel Functions in Python | Mito`}</title>
                
                {/* Meta Description */}
                <meta
                    name="description"
                    content={`Learn how to convert Excel's functions to Python using Pandas. Step-by-step instructions and practical examples for every Excel formula.`}
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
                                    Excel to Python Guide
                                </h1>
                                <h2 className={titleStyles.description}>
                                    Looking to use Excel formulas in Python? You&apos;ve come to the right place. Click on a function below to learn how to use Excel formulas in Python and pandas.
                                </h2>
                            </section>
                            <section style={{marginTop: '2rem'}}>
                                <h2 id="Transformations" style={{marginBottom: '2rem'}}>Transformations</h2>
                                {transformationPageInfo.map((glossaryPageInfo) => {
                                    return <GlossaryPageCard key={glossaryPageInfo.functionNameShort} glossaryPageInfo={glossaryPageInfo} />
                                })}
                            </section>
                            <section style={{marginTop: '2rem'}}>
                                <h2 id="Functions" style={{marginBottom: '2rem'}}>Functions</h2>
                                <h3 id="Math" className={excelToPythonStyles.glossary_function_category_header}>Math Functions</h3>
                                {mathFunctionsPageInfo.map((glossaryPageInfo) => {
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
                                <h3 id="Lookup" className={excelToPythonStyles.glossary_function_category_header}>Lookup Functions</h3>
                                {lookupFunctionsPageInfo.map((glossaryPageInfo) => {
                                    return <GlossaryPageCard key={glossaryPageInfo.functionNameShort} glossaryPageInfo={glossaryPageInfo} />
                                })}
                            </section>
                            <section>
                                <h3 id="Financial" className={excelToPythonStyles.glossary_function_category_header}>Financial Functions</h3>
                                {financialFunctionsPageInfo.map((glossaryPageInfo) => {
                                    return <GlossaryPageCard key={glossaryPageInfo.functionNameShort} glossaryPageInfo={glossaryPageInfo} />
                                })}
                            </section>
                            <section>
                                <h3 id="Misc" className={excelToPythonStyles.glossary_function_category_header}>Misc. Functions</h3>
                                {miscFunctionsPageInfo.map((glossaryPageInfo) => {
                                    return <GlossaryPageCard key={glossaryPageInfo.functionNameShort} glossaryPageInfo={glossaryPageInfo} />
                                })}
                            </section>
                            <section className={classNames(pageStyles.background_card, excelToPythonStyles.cta_card)}>
                                <div>
                                    <h2 className={excelToPythonStyles.cta_card_title_text}>
                                        Mito Is a Powerful No-Code Tool for Excel Users
                                    </h2>
                                    <div className='center'>
                                        <p>
                                            Autoamte your spreadsheet workflows without spending months learning Python.
                                        </p>
                                    </div>
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
                                        <Link href='/spreadsheet-automation'>
                                            <a className={pageStyles.link_with_p_tag_margins}>
                                                Learn more about the Mito Spreadsheet →
                                            </a>
                                        </Link>
                                    </div>
                                    <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin)}>
                                        <div className={'center'}>
                                            <Image src={'/excel-to-python/mito_code_gen.png'} alt='Automate analysis with Mito' width={373} height={364}/>
                                        </div>
                                    </div>
                                </div>
                                <div className={classNames(pageStyles.subsection, pageStyles.subsection_justify_baseline, excelToPythonStyles.cta_functionality_card, 'display-desktop-only-flex')}>
                                    <div className={classNames(textImageSplitStyles.functionality_text)}>
                                        <h2>
                                            Learn how to <span className='text-highlight'>automate Excel files</span> using Excel formulas in Python and pandas
                                        </h2>
                                        <p>
                                            We&apos;ve implemented all of Excel&apos;s most powerful features in Python so you don&apos;t have to look through documentation like this!
                                            Use Excel formulas, create pivot tables, filter your data, build graphs, and more. 
                                        </p>
                                        <a href="https://docs.trymito.io/how-to/importing-data-to-mito" target="_blank" rel="noopener" className={pageStyles.link_with_p_tag_margins}>
                                            View all 100+ transformations →
                                        </a>
                                    </div>
                                    <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin)}>
                                        <div className={'center'}>
                                            <Image src={'/pivot_table_vertical.png'} alt='Create pivot tables with Mito' width={344} height={373}/>
                                        </div>
                                    </div>
                                </div>
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