/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useEffect } from 'react';
import Link from 'next/link';
import CodeBlock from '../CodeBlock/CodeBlock';
import ctaButtons from '../CTAButtons/CTAButtons.module.css'
import installInstructions from './InstallInstructions.module.css'
import pageStyles from '../../styles/Home.module.css';
import { CREATE_MITOSHEET_DOCS_LINK, MITO_INSTALLATION_DOCS_LINK } from '../Header/Header';
import { MITO_GITHUB_LINK } from '../Buttons/GithubButton/GithubButton';
import { PLAUSIBLE_COPIED_MITOSHEET_HELLO_COMMAND, PLAUSIBLE_COPIED_PIP_INSTALL_COMMAND } from '../../utils/plausible';
import { classNames } from '../../utils/classNames';
import { DISCORD_LINK } from '../Footer/Footer';

// Import Prism to apply syntax highlighting to the code block
import Prism from 'prismjs';
import 'prism-themes/themes/prism-coldark-dark.css'

const InstallInstructions = (props: {}): JSX.Element => {

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
            <p style={{textAlign: 'center'}}>
                Or install open-source Mito in an existing Python environment
            </p>
            <div className={installInstructions.install_instructions_container}>
                <CodeBlock prefix='$ ' paddingRight='7rem' className={PLAUSIBLE_COPIED_PIP_INSTALL_COMMAND}>
                    pip install mito-ai mitosheet
                </CodeBlock>
            </div>
        </>
    )
}

export default InstallInstructions;