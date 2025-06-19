/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

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
        <div className={classNames(featureSquaresStyles.feature_card_container, pageStyles.background_card)}>
            <div className={featureSquaresStyles.feature_card_text_container}>
                <h2>AI Chat</h2>
                <p>Chat is like collaborating with a colleague who sees your code, knows your data, and is a Python expert. Its ChatGPT integrated directly into Jupyter.</p>
            </div>
            <p className={pageStyles.link}>
                <Link href="https://docs.trymito.io/mito-ai/agent">
                    Learn more about Mito AI →
                </Link>
            </p>
            <div className={featureSquaresStyles.feature_card_image_container}>
                <video 
                    src='/chat-1080-website.mp4' 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    style={{ width: '100%', height: 'auto', maxWidth: '800px' }}
                />
            </div>
        </div>
    )
}

const SpreadsheetEditorCard = () => {
    return (
        <div className={classNames(featureSquaresStyles.feature_card_container, pageStyles.background_card)}>
            <div className={featureSquaresStyles.feature_card_text_container}>
                <h2>Spreadsheet Editor</h2>
                <p>Write spreadsheet formulas like VLOOKUP, build pivot tables, and create graphs. Every edit is automatically converted to Python.</p>
            </div>
            <a href="https://docs.trymito.io/how-to/importing-data-to-mito" target="_blank" rel="noreferrer" className={classNames(pageStyles.link)}>
                View 100+ transformations →
            </a>
            <div className={featureSquaresStyles.feature_card_image_container}>
                <Image src='/features/spreadsheet-editor.png' alt='Spreadsheet Editor' height={243} width={464} />
            </div>
        </div>
    )
}

const SmartDebuggingCard = () => {
    return (
        <div className={classNames(featureSquaresStyles.feature_card_container, pageStyles.background_card)}>
            <div className={featureSquaresStyles.feature_card_text_container}>
                <h2>Smart Debugging</h2>
                <p>Fix your code with the click of a button and let the AI explain your error to you.</p>
            </div>
            <div className={featureSquaresStyles.feature_card_image_container}>
                <video 
                    src='/smart-debug-1080-website.mp4' 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    style={{ width: '100%', height: 'auto', maxWidth: '800px' }}
                />
            </div>
        </div>
    )
}

const FeatureSquares = (): JSX.Element => {

    return (
        <div className={featureSquaresStyles.feature_squares_container}>
            <AiChatCard />
            <SpreadsheetEditorCard />
            <SmartDebuggingCard />
        </div>
    )
}

export default FeatureSquares;