import React from 'react';
import Image from 'next/image';
import { classNames } from '../../utils/classNames';
import featureSquaresStyles from './FeatureSquares.module.css';
import pageStyles from '../../styles/Page.module.css';
import CTAButtons from '../CTAButtons/CTAButtons';
import { PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_FEATURE_SQUARES } from '../../utils/plausible';
const FeatureSquares = (): JSX.Element => {

    return (
        <table className={classNames(featureSquaresStyles.feature_squares_table)}>
            <tbody>
                <tr>
                    <td>
                        <div className={classNames(featureSquaresStyles.feature_card_container, pageStyles.gradient_card)}>
                            <div className={featureSquaresStyles.feature_card_text_container}>
                                <h2>AI Chat</h2>
                                <p>Chat is like collaborating with a colleague who sees your code, knows your data, and is a Python expert. Its ChatGPT integrated directly into Jupyter.</p>
                            </div>
                            <div className={featureSquaresStyles.feature_card_image_container}>
                                <Image src='/features/ai-chat.png' alt='AI Chat' height={243} width={464} />
                            </div>
                        </div>
                    </td>
                    <td>
                        <div className={classNames(featureSquaresStyles.feature_card_container, pageStyles.gradient_card)}>
                            <div className={featureSquaresStyles.feature_card_text_container}>
                                <h2>Spreadsheet Editor</h2>
                                <p>Write spreadsheet formulas like VLOOKUP, build pivot tables, and create graphs. Every edit is automatically converted to Python.</p>
                            </div>
                            <div className={featureSquaresStyles.feature_card_image_container}>
                                <Image src='/features/spreadsheet-editor.png' alt='Spreadsheet Editor' height={243} width={464} />
                            </div>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>
                        <div className={classNames(featureSquaresStyles.feature_card_container, pageStyles.gradient_card)}>
                            <div className={featureSquaresStyles.feature_card_text_container}>
                                <h2>Smart Debugging</h2>
                                <p>Fix your code with the click of a button and let the AI explain your error to you. </p>
                            </div>
                            <div className={featureSquaresStyles.feature_card_image_container}>
                                <Image src='/features/smart-debugging.png' alt='Smart Debugging' height={243} width={464} />
                            </div>
                        </div>
                    </td>
                    <td>
                        <div className={classNames(featureSquaresStyles.feature_card_container, pageStyles.gradient_card)}>
                            <div className={featureSquaresStyles.feature_card_text_container}>
                                <h2>Code Completions</h2>
                                <p>Autocomplete that finishes your thought. No more googling syntax or correcting typos.</p>
                            </div>
                            <div className={featureSquaresStyles.feature_card_image_container}>
                                <p>Coming Soon</p>
                                <CTAButtons variant='download' align='center' displaySecondaryCTA={false} textButtonClassName={PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_FEATURE_SQUARES}/>
                            </div>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    )
}

export default FeatureSquares;