import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '../components/Footer/Footer';
import Header from '../components/Header/Header';
import pageStyles from '../styles/Page.module.css';
import pythonAIToolsStyles from '../styles/PythonAITools.module.css';
import titleStyles from '../styles/Title.module.css';
import spreadsheetAutomationStyles from '../styles/SpreadsheetAutomation.module.css';
import textImageSplitStyles from '../styles/TextImageSplit.module.css';

// Import Icons & Background Grid
import { classNames } from '../utils/classNames';
import CTAButtons from '../components/CTAButtons/CTAButtons';
import FAQCard from '../components/FAQCard/FAQCard';
import { PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_TITLE_CARD } from '../utils/plausible';

const PythonAITools: NextPage = () => {

  return (
    <>
      <Head>
        <title>AI Tools to Write Python Code | Mito</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Mito AI is a notebook-native library with a suite of AI tools for Python and Pandas. Generate, automate, validate, visualize and learn Python with Mito. | Mito" />
      </Head>
      <Header/>
    
      <div className={pageStyles.container}>

        <main className={pageStyles.main}>
          <section className={classNames(titleStyles.title_card, pageStyles.background_card, spreadsheetAutomationStyles.flex_col_mobile_row_desktop)}>
            <div className={spreadsheetAutomationStyles.title_text_container}>
              <h1>
                Write Python and Pandas with AI
              </h1>
              <p className={classNames(titleStyles.subtitle)}>
                Analyze your data with the confidence of a Python expert by your side
              </p>
              <CTAButtons variant={'download'} align='left' textButtonClassName={PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_TITLE_CARD}/>
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
            <div className={classNames(pageStyles.subsection, pageStyles.subsection_justify_baseline)}>
              <div className={textImageSplitStyles.functionality_text}>
                <h2>
                    Python AI Tools for <span className='text-highlight'>Data Science</span>
                </h2>
                <p> 
                    Mito AI is the easiest way to perform basic transformations like parsing strings, applying filters, and creating new columns.
                    Just say the word and let Mito AI figure out how to transform your data.
                </p>
              </div>
              <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin)}>
                <Image src={'/mito_ai_prompt.png'} alt='Edit data using Mito AI' width={500} height={250} layout='responsive'/>
              </div>
            </div>

            <div className={classNames(pageStyles.subsection, pageStyles.subsection_justify_baseline)}>
              <div className={textImageSplitStyles.functionality_text}>
                <h2>
                    Code <span className='text-highlight'>Generation</span>
                </h2>
                <p> 
                    Since Mito understands your data, it supplements your prompt to give the AI the info it needs to generate helpful code.
                </p>
                <p>
                    Instead of returning generic code that you have to edit, Mito AI generates code that is ready to run on your data.
                </p>
              </div>
              <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin)}>
                <Image src={'/mito_ai_code_generation.png'} alt='Generate code with Mito AI' width={500} height={250} layout='responsive'/>
              </div>
            </div>

            <div className={classNames(pageStyles.subsection, pageStyles.subsection_justify_baseline)}>
              <div className={textImageSplitStyles.functionality_text}>
                <h2>
                    <span className='text-highlight'>Validate AI</span> generated code with your data
                </h2>
                <p> 
                    Mito automatically highlights all of the effects of the AI generated code on your data, so you can easily catch the AI&apos;s mistakes. 
                </p>
                <p>
                    AI&apos;s are not perfect, but its important that your analysis is. So you need tools to help you be the subject matter expert in the loop.
                </p>
              </div>
              <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin)}>
                <Image src={'/mito_ai_recon.png'} alt='Validate edits using Mito AI recon' width={500} height={200} layout='responsive'/>
              </div>
            </div>

            <div className={classNames(pageStyles.subsection, pageStyles.subsection_justify_baseline)}>
              <div className={textImageSplitStyles.functionality_text}>
                <h2>
                    Automatic <span className='text-highlight'> Error Correction </span>
                </h2>
                <p> 
                    When the code generated by Mito AI errors, Mito automatically uses the error message to correct its mistakes. 
                </p>
                <p>
                    You&apos;re using Mito to make it easier to edit your data, not because you want practice debugging code you didn&apos;t write. 
                </p>
              </div>
              <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin)}>
                <Image src={'/mito_ai_error_correction.png'} alt='Mito AI automatically fixes errors' width={500} height={300} layout='responsive'/>
              </div>
            </div>
          </section>


          <section className={classNames(pageStyles.background_card, pythonAIToolsStyles.case_study_section)}>
            <div className={classNames(pythonAIToolsStyles.case_study_text_container)}>
                <h2 className={classNames(pythonAIToolsStyles.case_study_text, 'center')}>
                    Learn Python with AI
                </h2>
                <p className={classNames('center')}>
                    <i>
                      &quot;I&apos;ve tried teaching myself Python with online classes before, but the material was so different from how I wanted to use Python at work that I didn&apos;t get much out of it.
                      Mito AI let me learn Python by doing my job. 
                      I was able to automate my work using Mito, and it showed me how to do the same thing in Python. 
                      I found that pattern matching prompts to generated code is a great way to learn.&quot;
                    </i>
                </p>
                <p className={classNames('center')}> 
                    — Kashvi, Bank Associate
                </p>
            </div>
            <div className={pythonAIToolsStyles.case_study_headshot}>
                <Image src='/KashviHeadshot.png' alt='Explore your data with Mito' width={250} height={250} ></Image>
            </div>
          </section>

          <section>
            <h2 className='center'>
                Frequently Asked Questions
            </h2>
            <FAQCard title='How is Mito AI different from other AI copilots?'>
                <ol>
                    <li className='margin-top-p5rem'>
                        AI chatbots are quickly becoming the fastest way to edit your data, but AI-generated code is often incorrect or has unwanted side effects. 
                        For example, we&apos;ve seen users prompt LLMs to calculate a total_revenue column from a price * quantity columns. 
                        The LLM may correctly give you the new column, but it may also delete the price and quantity columns from the dataset. 
                        Since Mito users are often new to programming, they find it almost impossible to verify the code is correct just by reading it. 
                        Instead, they need tooling that to help them check the correctness of their code that is built with their skillset in mind — spreadsheets!                   
                    </li>
                    <li className='margin-top-p5rem'>
                        Since Mito is a spreadsheet, it knows the structure of your data, what column is selected, and your recent edits. 
                        That context is required for Mito AI (we use ChatGPT under the hood) to generate useful code. But there&apos;s no reason that the user should be responsible for adding all of that additional information to their prompt. 
                        Instead, Mito fills it all in for you. 
                    </li>
                    <li className='margin-top-p5rem'> 
                        Mito AI can be configured to use other LLMs. 
                        This is especially important to security conscious enterprises that don&apos;t want to share any data with OpenAI. 
                        Instead, they hook Mito up to their own On-Prem LLM.
                    </li>
                </ol>
            </FAQCard>
            <FAQCard title='What does Mito AI do with my data?'>
                <div>
                  <p>
                      Mito AI uses the instructions you provide (the prompt) and information about your dataframe to generate code that works in the context of your analysis. 
                      Without this information, the Mito generated code will require additional customization. 
                  </p>
                  <p>
                      Private data that is contained in the dataframe name, column headers, or first five rows of data might be shared with Mito and OpenAI. 
                  </p>
                  <p>
                      The data collected by Mito AI is used to construct a prompt for OpenAI. 
                      Mito supplements the prompt you provide with additional information about your data to give OpenAI the best chance of generating helpful code.
                  </p>
                  <p>
                      The data collected is also used to improve Mito AI. Such uses include: 
                  </p>
                  <ol className={classNames('margin-top-1rem', 'margin-left-1rem')}>
                    <li className='margin-top-p5rem'>
                        Evaluating Mito AI to determine its effectiveness
                    </li>
                    <li className='margin-top-p5rem'>
                        Conducting research to improve Mito AI
                    </li>
                    <li className='margin-top-p5rem'>
                        Detecting potential abuse of Mito AI
                    </li>
                  </ol>
                </div>
            </FAQCard>
            <FAQCard title='How can enterprises use Mito AI?'>
                <div>
                  <p>
                      Mito AI uses OpenAI to generate code by default. 
                      Doing so requires sending your information to OpenAI. 
                      To further protect your data, Mito Enterprise users can connect Mito AI to a self-hosted large language model. 
                      This ensures no data will ever leave your systems.
                  </p>
                  <p>
                      To learn more about this option, reach out to the <a href={"mailto:founders@sagacollab.com?subject=Enterprise AI"} className={pageStyles.link}>Mito Team</a>.
                  </p>
                </div>
            </FAQCard>
          </section>
        </main>
        <Footer />
      </div>
    </>
  )
}

export default PythonAITools