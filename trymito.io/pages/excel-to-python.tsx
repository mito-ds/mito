import type { NextPage } from 'next';
import Head from 'next/head';
import Footer from '../components/Footer/Footer';
import Header from '../components/Header/Header';
import pageStyles from '../styles/Page.module.css';
import titleStyles from '../styles/Title.module.css';
import { GetStaticProps } from 'next';
import excelToPythonStyles from '../styles/ExcelToPython.module.css';

// Import Icons & Background Grid
import { classNames } from '../utils/classNames';
import { getPageContentJsonArray } from '../utils/excel-to-python';
import Link from 'next/link';

export type GlossaryPageInfo = {
    functionNameShort: string,
    purpose: string,
    slug: string[],
}

export const getGlossaryPageInfo = (glossaryPageInfo: GlossaryPageInfo[], section: string) => {
    return glossaryPageInfo.filter((glossaryPageInfo) => {
        return glossaryPageInfo.slug[1] === section
    })
}

export const getStaticProps: GetStaticProps<{glossaryPageInfo: GlossaryPageInfo[]}> = async () => {
    const pageContentsJsonArray = await getPageContentJsonArray()
  
    // Get information about each glossay page
    const glossaryPageInfo: GlossaryPageInfo[] = pageContentsJsonArray.map((pageContentsJson) => {
      return {
        functionNameShort: pageContentsJson.functionNameShort,
        purpose: pageContentsJson.purpose,
        slug: [...pageContentsJson.slug]
      }
    })
    
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
                    &nbsp;&nbsp;{props.glossaryPageInfo.purpose}
                </p>
            </div>
        </Link>
    )
}

const ExcelToPythonHomePage = (props: {glossaryPageInfo: GlossaryPageInfo[]}) => {

    const mathFucntionsPageInfo = getGlossaryPageInfo(props.glossaryPageInfo, 'math')
    const textFunctionsPageInfo = getGlossaryPageInfo(props.glossaryPageInfo, 'text')
    const dateFunctionsPageInfo = getGlossaryPageInfo(props.glossaryPageInfo, 'date')
    const conditionalFunctionsPageInfo = getGlossaryPageInfo(props.glossaryPageInfo, 'conditional')
    const miscFunctionsPageInfo = getGlossaryPageInfo(props.glossaryPageInfo, 'misc')

    return (
        <>
            <Head>      
                {/* TODO: Add meta tags */}
            </Head>
            
            <Header/>

            <div className={pageStyles.container}>
                <main className={pageStyles.main}>
                    <section className={classNames(titleStyles.title_card)}>
                        <h1 className={titleStyles.title}>
                            Excel to Python Glossary
                        </h1>
                    </section>
                    <section>
                        <h3 className={excelToPythonStyles.glossary_function_category_header}>Math Functions</h3>
                        {mathFucntionsPageInfo.map((glossaryPageInfo) => {
                            return <GlossaryPageCard glossaryPageInfo={glossaryPageInfo} />
                        })}
                    </section>
                    <section>
                        <h3 className={excelToPythonStyles.glossary_function_category_header}>Text Functions</h3>
                        {textFunctionsPageInfo.map((glossaryPageInfo) => {
                            return <GlossaryPageCard glossaryPageInfo={glossaryPageInfo} />
                        })}
                    </section>
                    <section>
                        <h3 className={excelToPythonStyles.glossary_function_category_header}>Date Functions</h3>
                        {dateFunctionsPageInfo.map((glossaryPageInfo) => {
                            return <GlossaryPageCard glossaryPageInfo={glossaryPageInfo} />
                        })}
                    </section>
                    <section>
                        <h3 className={excelToPythonStyles.glossary_function_category_header}>Conditional Functions</h3>
                        {conditionalFunctionsPageInfo.map((glossaryPageInfo) => {
                            return <GlossaryPageCard glossaryPageInfo={glossaryPageInfo} />
                        })}
                    </section>
                    <section>
                        <h3 className={excelToPythonStyles.glossary_function_category_header}>Misc. Functions</h3>
                        {miscFunctionsPageInfo.map((glossaryPageInfo) => {
                            return <GlossaryPageCard glossaryPageInfo={glossaryPageInfo} />
                        })}
                    </section>
                </main>
                <Footer />
            </div>
        </>
    )
}

export default ExcelToPythonHomePage