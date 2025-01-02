import React from 'react';
import Image from 'next/image';
import { classNames } from '../../utils/classNames';
import featureSquaresStyles from './FeatureSquares.module.css';
import pageStyles from '../../styles/Page.module.css';
import CTAButtons from '../CTAButtons/CTAButtons';
import { PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_FEATURE_SQUARES } from '../../utils/plausible';
import Link from 'next/link';


const AiChatCard = () => {
    return (
        <div className={classNames(featureSquaresStyles.feature_card_container, pageStyles.gradient_card)}>
            <div className={featureSquaresStyles.feature_card_text_container}>
                <h2>AI Chat</h2>
                <p>Chat is like collaborating with a colleague who sees your code, knows your data, and is a Python expert. Its ChatGPT integrated directly into Jupyter.</p>
            </div>
            <div className={featureSquaresStyles.feature_card_image_container}>
                <Image src='/features/ai-chat.png' alt='AI Chat' height={243} width={464} />
            </div>
            <p className={pageStyles.link}>
                <Link href="/python-ai-tools" >
                    Learn more about Mito AI →
                </Link>
            </p>
        </div>
    )
}

const SpreadsheetEditorCard = () => {
    return (
        <div className={classNames(featureSquaresStyles.feature_card_container, pageStyles.gradient_card)}>
            <div className={featureSquaresStyles.feature_card_text_container}>
                <h2>Spreadsheet Editor</h2>
                <p>Write spreadsheet formulas like VLOOKUP, build pivot tables, and create graphs. Every edit is automatically converted to Python.</p>
            </div>
            <div className={featureSquaresStyles.feature_card_image_container}>
                <Image src='/features/spreadsheet-editor.png' alt='Spreadsheet Editor' height={243} width={464} />
            </div>
            <a href="https://docs.trymito.io/how-to/importing-data-to-mito" target="_blank" rel="noreferrer" className={classNames(pageStyles.link_with_p_tag_margins)}>
                View 100+ transformations →
            </a>
        </div>
    )
}

const SmartDebuggingCard = () => {
    return (
        <div className={classNames(featureSquaresStyles.feature_card_container, pageStyles.gradient_card)}>
            <div className={featureSquaresStyles.feature_card_text_container}>
                <h2>Smart Debugging</h2>
                <p>Fix your code with the click of a button and let the AI explain your error to you.</p>
            </div>
            <div className={featureSquaresStyles.feature_card_image_container}>
                <Image src='/features/smart-debugging.png' alt='Smart Debugging' height={243} width={464} />
            </div>
        </div>
    )
}

const CodeCompletionsCard = () => {
    return (
        <div className={classNames(featureSquaresStyles.feature_card_container, pageStyles.gradient_card)}>
            <div className={featureSquaresStyles.feature_card_text_container}>
                <h2>Code Completions</h2>
                <p>Autocomplete that finishes your thought. No more googling syntax or correcting typos.</p>
            </div>
            <div className={classNames(featureSquaresStyles.feature_card_image_container, 'only-on-desktop')} >
                <Image src='/features/inline-code-completion.png' alt='Code Completions' height={243} width={464} />
            </div>
        </div>
    )
}

const FeatureSquares = (): JSX.Element => {

    return (
        <>
            <table className={classNames(featureSquaresStyles.feature_squares_container, 'only-on-desktop')}>
                <tbody>
                    <tr>
                        <td>
                            <AiChatCard />
                        </td>
                        <td>
                            <SpreadsheetEditorCard />
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <SmartDebuggingCard />
                        </td>
                        <td>
                            <CodeCompletionsCard />
                        </td>
                    </tr>
                </tbody>
            </table>
            <div className={classNames(featureSquaresStyles.feature_squares_container, 'only-on-mobile')}>
                <AiChatCard />
                <SpreadsheetEditorCard />
                <SmartDebuggingCard />
                <CodeCompletionsCard />
            </div>
        </>
    )
}

export default FeatureSquares;