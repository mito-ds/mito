import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Footer from '../../components/Footer/Footer';
import Header from '../../components/Header/Header';
import pageStyles from '../../styles/Page.module.css';
import securityStyles from '../../styles/Security.module.css';
import titleStyles from '../../styles/Title.module.css';
import pythonTrainingStyles from '../../styles/PythonTraining.module.css';
import spreadsheetAutomationStyles from '../../styles/SpreadsheetAutomation.module.css';
import textImageSplitStyles from '../../styles/TextImageSplit.module.css';

// Import Icons & Background Grid
import { classNames } from '../../utils/classNames';
import CTAButtons from '../../components/CTAButtons/CTAButtons';
import customerCardStyles from '../../components/CustomerCard/CustomerCard.module.css';
import ContactCTACard from '../../components/CTACards/ContactCTACard';

import automationIcon from '../../public/python-training/automation.svg';
import bugIconPurple from '../../public/python-training/bug_purple.svg';
import dataIconPurple from '../../public/python-training/data_purple.svg';
import fastClockIcon from '../../public/python-training/fast_clock.svg';
import infoIcon from '../../public/python-training/info.svg';
import React, { useEffect, useState } from 'react';

const PythonTraining: NextPage = () => {

    const [showQuizAnswer, setShowQuizAnswer] = useState(false);
    useEffect(() => {
        if (showQuizAnswer) {
            setTimeout(() => {setShowQuizAnswer(false)}, 3000)
        }
    }, [showQuizAnswer])
    const quizAnswerClass = showQuizAnswer ? pythonTrainingStyles.display_quiz_answer : undefined

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
                        Leverage Excel skills to build Python automations.
                    </p>
                    <CTAButtons variant={'contact'} align='left' displaySecondaryCTA={false}/>
                    </div>
                    <div className={classNames(spreadsheetAutomationStyles.hero_video_container)}>
                    <video autoPlay loop disablePictureInPicture playsInline webkit-playsinline="true" muted>
                        <source src="/python-training/vlookup.mp4"/>
                    </video>
                    </div>
                </section>

                <section>
                    <div className={classNames(pageStyles.subsection, pageStyles.left_aligned_section)}>
                        <h2 className={classNames('margin-top-4rem', 'margin-bottom-2rem', pythonTrainingStyles.three_quarter_width_header)}>
                            Increase Python retention by embracing your business analysts&apos; Excel mastery in your trainings.
                        </h2>
                    </div>
                    <div className={pageStyles.subsection}>
                        <div className={securityStyles.security_bullet_container}>
                            <div className={securityStyles.icon}>
                                <Image className={securityStyles.icon} src={fastClockIcon} alt='icon'></Image>
                            </div>
                            <h3>
                                Write code 4x faster with Mito
                            </h3>
                            <p>
                                Mito generates the equivalent Python code for every edit the user makes. Business analysts <a className={pageStyles.link} href='https://www.trymito.io/blog/quantifying-mitos-impact-on-analyst-python-productivity' target="_blank" rel="noreferrer">code 400% faster using Mito</a> compared to writing Python code by hand. 
                            </p>
                            <p>
                                The biggest blocker for analysts building their own automation after a training is not having enough time to do so. Mito solves that problem. Empower your analysts to write <code className='code-highlight'>=VLOOKUP</code> in Mito instead of struggling through <a className={pageStyles.link} href='https://www.trymito.io/excel-to-python/functions/lookup/VLOOKUP#Implementing%20VLOOKUP%20in%20Pandas' target="_blank" rel="noreferrer">5 lines</a> of complex pandas code. 
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
                                Mito let&apos;s your analysts start building useful automations in the first 10 minutes. It&apos;s the fastest way to demonstrate Python&apos;s value.
                            </p>
                            <p>
                                If analysts leave your training without having built a useful Python automation, you&apos;re teaching them that they don&apos;t have enough time to learn Python.
                            </p>
                        </div>
                    </div>
                    <div className={pageStyles.subsection}>
                        <div className={securityStyles.security_bullet_container}>
                            <div className={securityStyles.icon}>
                                <Image  src={dataIconPurple} alt='icon'></Image>
                            </div>
                            <h3>
                                Train with your own data
                            </h3>
                            <p>
                                Training is most engaging when you&apos;re practicing on real business data. Because Mito hides the complexity of learning Python syntax, you don&apos;t have to oversimplify your data. 
                            </p>
                            <p>
                                Instead of learning <code className='code-highlight'>total = x + y</code> skip straight to building pivot tables on your monthly returns data.
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
                                Help your analysts leapfrog the <a className={pageStyles.link} href='https://www.trymito.io/blog/10-mistakes-to-look-out-for-when-transitioning-from-excel-to-python' target="_blank" rel="noreferrer">“Why is this not working? Ugh!!”</a> phase. 
                            </p>
                        </div>
                    </div>
                    <div className={pageStyles.subsection}>
                        <div className={securityStyles.security_bullet_container}>
                            <div className={securityStyles.icon}>
                                <Image  src={dataIconPurple} alt='icon'></Image>
                            </div>
                            <h3>
                                Improve data discoverability
                            </h3>
                            <p>
                                Figuring out which database holds the monthly report&apos;s data is often a multi-week scavenger hunt. Then getting permission to query that database might be another few weeks of waiting.
                            </p>
                            <p>
                                Pre-load common SQL queries into Mito so your business analysts can start working with their data immediately.
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
                                Skip pandas syntax 
                            </h3>
                            <p>
                                Since Mito generates the equivalent Python code for every edit, you don&apos;t need to teach confusing pandas syntax.
                            </p>
                            <p>
                                Test yourself. Which of these is correct?
                            </p>
                            <ol style={{'listStylePosition': 'inside', 'paddingLeft': '0'}} className={pythonTrainingStyles.quiz_answers} onClick={() => setShowQuizAnswer(true)}>
                                <li>
                                    df[&apos;Age&apos;] = pd.tonumeric(df[&apos;Age&apos;])
                                </li>
                                <li style={{marginTop: '.5rem'}} className={quizAnswerClass}>
                                    df[&apos;Age&apos;] = df[&apos;Age&apos;].astype(int)
                                </li>
                                <li style={{marginTop: '.5rem'}}>
                                    df[&apos;Age&apos;] = df[&apos;Age&apos;].as_type(int)
                                </li>
                            </ol>
                        </div>
                    </div>
                </section>

                <section className='center'>
                    <div className={pythonTrainingStyles.training_quote_container}>
                        <p className='quote'><span className={classNames(customerCardStyles.quote_symbol, pythonTrainingStyles.training_quote_text)}>❝We&apos;ve trained thousands of analysts to build Python automations with Mito. Every time we make Mito a bigger part of our training, our end user reviews go up. Now Mito is the first thing we teach in our Python trainings. </span></p>
                        <p>
                            Chief Data Architect @ Bulge Bracket Bank
                        </p>
                    </div>
                </section>

                <section>
                    <div className={classNames(pageStyles.subsection, pageStyles.subsection_justify_baseline)}>
                        <div className={textImageSplitStyles.functionality_text}>
                            <h2>
                                Track Python Adoption. Open the Black Box.
                            </h2>
                            <p> 
                                Mito lets you track your organization&apos;s Python adoption so you can easily evaluate and communicate the success of your trainings.
                            </p>
                            <p>
                                Just point Mito to your enterprise logging infrastructure and we&apos;ll take care of the rest. No data will ever leave your computers, of course.
                            </p>
                        </div>
                        <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin, 'center')}>
                            <Image src={'/python-training/metrics-icon.png'} alt='Mito Python Adoption Logging' width={434} height={432}/>
                        </div>
                    </div>
                
                    <div className={classNames(pageStyles.subsection)}>
                        <div className={classNames(textImageSplitStyles.functionality_text, pythonTrainingStyles.mobile_bottom_margin)}>
                            <h2>
                                Improve your existing Python training 
                            </h2>
                            <p>
                                Mito is the easiest way to improve the effectiveness of your existing Python training programs. Give your users a spreadsheet interface to generate Python code, and use our documentation, training guides, and best practices to plug and play Mito into your training.                            
                            </p>
                            <CTAButtons variant={'contact'} align='left' ctaText="Improve your trainings" displaySecondaryCTA={false}/>
                        </div>
                        <div className={textImageSplitStyles.functionality_text}>
                            <h2>
                                Or setup a new Python training program
                            </h2>
                            <p>
                                We&apos;re experts at setting up new Python training programs.
                            </p>
                            <p>
                                We can help you build a curriculum, train you trainers, evaluate the effectiveness of your training, and expand your program to new teams.
                            </p>
                            <CTAButtons variant={'contact'} align='left' ctaText="Setup Python training" displaySecondaryCTA={false}/>
                        </div>
                    </div>

                    <div className={classNames(pageStyles.subsection, pageStyles.subsection_justify_baseline)}>
                        <div className={textImageSplitStyles.functionality_text}>
                            <h2>
                                Python Trainings for Finance
                            </h2>
                            <p> 
                                Mito is the foundation of Python training programs at some of the world&apos;s largest companies. From bulge bracket banks to e-commerce giants, from New York to Singapore, Mito has helped thousands of analysts automate their spreadsheets with Python.
                            </p>
                        </div>
                        <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin)}>
                            <Image src={'/python-training/pivot.png'} alt='Creating a Mito Pivot Table' width={628} height={316} layout='responsive'/>
                        </div>
                    </div>
                </section>

                <section className={pageStyles.background_card}>
                    <ContactCTACard contactCardTitle='Learn more about running effective Python Trainings'/>
                </section>
                </main>
                <Footer />
            </div>
        </>
    )
}

export default PythonTraining