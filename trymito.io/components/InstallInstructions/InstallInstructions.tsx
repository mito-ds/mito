import Link from 'next/link';
import CodeBlock from '../CodeBlock/CodeBlock';
import ctaButtons from '../CTAButtons/CTAButtons.module.css'
import installInstructions from './InstallInstructions.module.css'
import pageStyles from '../../styles/Home.module.css';
import { MITO_INSTALLATION_DOCS_LINK } from '../Header/Header';
import { MITO_GITHUB_LINK } from '../GithubButton/GithubButton';
import { PLAUSIBLE_COPIED_MITOSHEET_HELLO_COMMAND, PLAUSIBLE_COPIED_PIP_INSTALL_COMMAND } from '../../utils/plausible';


const InstallInstructions = (props: {}): JSX.Element => {
    return (
        <>
            <h2 style={{textAlign: 'center'}}>
                Install <span className='text-highlight'><a className={pageStyles.link} href={MITO_GITHUB_LINK} target="_blank" rel="noreferrer">open-source</a></span> Mito <br/>
                in under a minute
            </h2>
            <div className={installInstructions.install_instructions_container}>
                <CodeBlock prefix='$ ' paddingRight='7rem' className={PLAUSIBLE_COPIED_PIP_INSTALL_COMMAND}>
                    pip install mitosheet
                </CodeBlock>
                <CodeBlock prefix='$ ' paddingRight='7rem' className={PLAUSIBLE_COPIED_MITOSHEET_HELLO_COMMAND}>
                    python -m mitosheet hello
                </CodeBlock>
                <div className={ctaButtons.cta_subbutton}>
                    <Link href={MITO_INSTALLATION_DOCS_LINK}>
                        {/** Open in a new tab */}
                        <a className={ctaButtons.pro_cta_text} target="_blank" rel="noreferrer">
                            Then check out our documentation →
                        </a>
                    </Link>
                </div>
            </div>
        </>
    )
}

export default InstallInstructions;