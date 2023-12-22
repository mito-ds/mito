import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Footer from '../../components/Footer/Footer';
import Header from '../../components/Header/Header';
import pageStyles from '../../styles/Page.module.css';
import securityStyles from '../../styles/Security.module.css';
import titleStyles from '../../styles/Title.module.css';
import trainingStyles from '../../styles/Training.module.css';
import spreadsheetAutomationStyles from '../../styles/SpreadsheetAutomation.module.css';
import textImageSplitStyles from '../../styles/TextImageSplit.module.css';

// Import Icons & Background Grid
import { classNames } from '../../utils/classNames';
import CTAButtons from '../../components/CTAButtons/CTAButtons';
import customerCardStyles from '../../components/CustomerCard/CustomerCard.module.css';
import ContactCTACard from '../../components/CTACards/ContactCTACard';

import automationIcon from '../../public/training/automation.svg';
import bugIconPurple from '../../public/training/bug_purple.svg';
import dataIconPurple from '../../public/training/data_purple.svg';
import fastClockIcon from '../../public/training/fast_clock.svg';
import infoIcon from '../../public/training/info.svg';
import React, { useEffect, useState } from 'react';

const LifeSciences: NextPage = () => {

    const [showQuizAnswer, setShowQuizAnswer] = useState(false);
    useEffect(() => {
        if (showQuizAnswer) {
            setTimeout(() => {setShowQuizAnswer(false)}, 3000)
        }
    }, [showQuizAnswer])
    const quizAnswerClass = showQuizAnswer ? trainingStyles.display_answerquiz_answer : undefined


    /* Rotate the final h2 heading to display all of the people that use Mito Python Training */
    const [currentHeading, setCurrentHeading] = useState(1);
    const headingIntervalTime = 3000;
    const headingCount = 10;
    useEffect(() => {
        const interval = setInterval(() => {
            // Save the current heading so we know which one to display next
            const nextHeadingToDisplay = currentHeading + 1 <= headingCount ? currentHeading + 1 : 1;
            setCurrentHeading(nextHeadingToDisplay)
            
            // Add the display class to the correct heading by id
            const headingElements = document.getElementsByClassName(trainingStyles.rotating_heading);
            console.log(headingElements)
            for (let i = 0; i < headingElements.length; i++) {
                const element = headingElements[i];
                if (element.id === `rotating_header_${currentHeading}`) {
                    element.classList.add(trainingStyles.display_rotating_heading);
                } else {
                    element.classList.remove(trainingStyles.display_rotating_heading);
                }
            }
        }, headingIntervalTime);
        return () => clearInterval(interval);
    }, [currentHeading])

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
                                Write <code>=VLOOKUP</code> in Mito instead of struggling through <a className={pageStyles.link} href='https://www.trymito.io/excel-to-python/functions/lookup/VLOOKUP#Implementing%20VLOOKUP%20in%20Pandas' target="_blank" rel="noreferrer">5 lines</a> of complex pandas code. 
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
                                Instead of learning <code>total = x + y</code> skip straight to building pivot tables on your monthly returns data.
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
                                <li style={{marginTop: '.5rem'}} className={quizAnswerClass}>
                                    df['Age'] = df['Age'].astype(int)
                                </li>
                                <li style={{marginTop: '.5rem'}}>
                                    df['Age'] = df['Age'].as_type(int)
                                </li>
                            </ol>
                            <p className={trainingStyles.quiz_answer_button} onClick={() => setShowQuizAnswer(true)}>
                                Click to see the right answer
                            </p>
                        </div>
                    </div>
                </section>

                <section className='center'>
                    <div className={trainingStyles.training_quote_container}>
                        <p className='quote'><span className={classNames(customerCardStyles.quote_symbol, trainingStyles.training_quote_text)}>❝We&apos;ve trained thousands of analysts to build Python automations with Mito. Every time we make Mito a bigger part of our training, our end user reviews go up. Now Mito is the first thing we teach in our Python trainings. </span></p>
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
                                Mito lets you track your organization's Python adoption so you can easily evaluate the success of your trainings and communicate it's value with your organization&apos;s leadership.
                            </p>
                            <p>
                                Mito has built in logging infrastructure that lets you track metrics like: how many analysts are writing and re-running Python code, which database integrations are most popular, and which automations are shared across the firm. 
                            </p>
                            <p>
                                Just point Mito to your enterprise logging infrastructure and we&apos;ll take care of the rest. 
                            </p>
                        </div>
                        <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin)}>
                            <Image src={'/training/black-metrics-box.png'} alt='Mito Python Adoption Logging' width={457} height={457} layout='responsive'/>
                        </div>
                    </div>
                
                    <div className={classNames(pageStyles.subsection)}>
                        <div className={textImageSplitStyles.functionality_text}>
                            <h2>
                                Improve your existing Python Training 
                            </h2>
                            <p>
                                Mito is the easiest way to improve the effectiveness of your existing Python training programs. Give your users a spreadsheet interface to generate Python code, and use our documentation, training guides, and best practices to plug and play Mito into your training.                            
                            </p>
                        </div>
                        <div className={textImageSplitStyles.functionality_text}>
                            <h2>
                                Or setup a new Python Training Program
                            </h2>
                            <p>
                                We&apos;re experts at setting up new Python training programs. We&apos;ll guide you through the process of setting up, evaluating, and expanding a new Python training program.
                            </p>
                            <CTAButtons variant={'contact'} align='left' ctaText="Learn about Mito Training" displaySecondaryCTA={false}/>
                        </div>
                    </div>

                    <div className={classNames(pageStyles.subsection, pageStyles.subsection_justify_baseline)}>
                        <div className={textImageSplitStyles.functionality_text}>
                            {/* 
                                In order to only display one header at a time, we dynamically move the display_rotating_heading 
                                class from one header to the next. If you want to add more header, make sure to update the headingCount
                                variable at the top of this component.
                            */}
                            <h2 className={classNames(trainingStyles.rotating_heading, trainingStyles.display_rotating_heading)} id='rotating_header_1'>
                                Python Trainings for Wealth Management 
                            </h2>
                            <h2 className={trainingStyles.rotating_heading} id='rotating_header_2'>
                                Python Trainings for Finance
                            </h2>
                            <h2 className={trainingStyles.rotating_heading} id='rotating_header_3'>
                                Python Trainings for Insurance
                            </h2>
                            <h2 className={trainingStyles.rotating_heading} id='rotating_header_4'>
                                Python Trainings for Banking
                            </h2>
                            <h2 className={trainingStyles.rotating_heading} id='rotating_header_5'>
                                Python Trainings for FP&A
                            </h2>
                            <h2 className={trainingStyles.rotating_heading} id='rotating_header_6'>
                                Python Training for Business Analysts
                            </h2>
                            <h2 className={trainingStyles.rotating_heading} id='rotating_header_7'>
                                Python Training for Excel users
                            </h2>
                            <h2 className={trainingStyles.rotating_heading} id='rotating_header_8'>
                                Python Training for IB
                            </h2>
                            <h2 className={trainingStyles.rotating_heading} id='rotating_header_9'>
                                Python Training for Risk Management
                            </h2>
                            <h2 className={trainingStyles.rotating_heading} id='rotating_header_10'>
                                Python Training for Actuarial Scienctists
                            </h2>
                            <p> 
                                Mito is the foundation of Python training programs at some of the world&apos;s largest companies. From bulge bracket banks to e-commerce giants, from New York to Singapore, Mito has helped thousands of analysts automate their spreadsheets with Python.
                            </p>
                        </div>
                        <div className={classNames(textImageSplitStyles.functionality_media, textImageSplitStyles.functionality_media_supress_bottom_margin)}>
                            <Image src={'/computational-biotech.png'} alt='Mito for Computational Biotech' width={707} height={370} layout='responsive'/>
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

export default LifeSciences